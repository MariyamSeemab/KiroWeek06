import { ValidationResult } from '../types';

export interface CSVParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
  requiredColumns?: string[];
}

export interface CSVParseResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export class CSVParser {
  private static readonly DEFAULT_OPTIONS: Required<CSVParseOptions> = {
    delimiter: ',',
    skipEmptyLines: true,
    trimValues: true,
    requiredColumns: []
  };

  /**
   * Parse CSV string into structured data with validation
   */
  static parse<T>(
    csvContent: string,
    rowParser: (row: Record<string, string>, lineNumber: number) => T | null,
    options: CSVParseOptions = {}
  ): CSVParseResult<T> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const result: CSVParseResult<T> = {
      data: [],
      errors: [],
      warnings: [],
      totalRows: 0,
      validRows: 0
    };

    try {
      // Validate input
      if (!csvContent || typeof csvContent !== 'string') {
        result.errors.push('Invalid CSV content: empty or non-string input');
        return result;
      }

      // Split into lines and filter empty ones if requested
      let lines = csvContent.split(/\r?\n/);
      if (opts.skipEmptyLines) {
        lines = lines.filter(line => line.trim().length > 0);
      }

      if (lines.length === 0) {
        result.errors.push('CSV content is empty');
        return result;
      }

      // Parse header
      const headerLine = lines[0];
      const headers = this.parseLine(headerLine, opts.delimiter, opts.trimValues);
      
      if (headers.length === 0) {
        result.errors.push('CSV header is empty or invalid');
        return result;
      }

      // Validate required columns
      const missingColumns = opts.requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        return result;
      }

      // Parse data rows
      result.totalRows = lines.length - 1; // Exclude header

      for (let i = 1; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i];

        try {
          const values = this.parseLine(line, opts.delimiter, opts.trimValues);
          
          // Skip empty lines if requested
          if (opts.skipEmptyLines && values.every(val => val === '')) {
            continue;
          }

          // Create row object
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          // Validate row length
          if (values.length !== headers.length) {
            result.warnings.push(
              `Line ${lineNumber}: Column count mismatch (expected ${headers.length}, got ${values.length})`
            );
          }

          // Parse row using provided parser
          const parsedRow = rowParser(rowData, lineNumber);
          if (parsedRow !== null) {
            result.data.push(parsedRow);
            result.validRows++;
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Line ${lineNumber}: ${errorMessage}`);
        }
      }

      // Add summary warnings
      if (result.validRows < result.totalRows) {
        result.warnings.push(
          `${result.totalRows - result.validRows} rows were skipped due to parsing errors`
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      result.errors.push(`CSV parsing failed: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Parse a single CSV line handling quoted values and delimiters
   */
  private static parseLine(line: string, delimiter: string, trimValues: boolean): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        values.push(trimValues ? current.trim() : current);
        current = '';
        i++;
      } else {
        // Regular character
        current += char;
        i++;
      }
    }

    // Add final field
    values.push(trimValues ? current.trim() : current);
    return values;
  }

  /**
   * Validate CSV structure without parsing all data
   */
  static validateStructure(csvContent: string, requiredColumns: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: []
    };

    try {
      if (!csvContent || typeof csvContent !== 'string') {
        result.isValid = false;
        result.errors.push('Invalid CSV content');
        return result;
      }

      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        result.isValid = false;
        result.errors.push('CSV is empty');
        return result;
      }

      // Check header
      const headers = this.parseLine(lines[0], ',', true);
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        result.isValid = false;
        result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Check for duplicate headers
      const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
      if (duplicates.length > 0) {
        result.isValid = false;
        result.errors.push(`Duplicate columns found: ${duplicates.join(', ')}`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Convert structured data back to CSV format
   */
  static stringify<T>(
    data: T[],
    columns: (keyof T)[],
    options: { includeHeader?: boolean; delimiter?: string } = {}
  ): string {
    const { includeHeader = true, delimiter = ',' } = options;
    const lines: string[] = [];

    if (data.length === 0) {
      return '';
    }

    // Add header if requested
    if (includeHeader) {
      const headerLine = columns.map(col => this.escapeCSVValue(String(col), delimiter)).join(delimiter);
      lines.push(headerLine);
    }

    // Add data rows
    for (const row of data) {
      const values = columns.map(col => {
        const value = row[col];
        return this.escapeCSVValue(String(value ?? ''), delimiter);
      });
      lines.push(values.join(delimiter));
    }

    return lines.join('\n');
  }

  /**
   * Escape CSV value if it contains special characters
   */
  private static escapeCSVValue(value: string, delimiter: string): string {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Get CSV parsing statistics
   */
  static getParsingStats(result: CSVParseResult<any>): {
    successRate: number;
    errorRate: number;
    warningCount: number;
  } {
    const successRate = result.totalRows > 0 ? (result.validRows / result.totalRows) * 100 : 0;
    const errorRate = result.totalRows > 0 ? ((result.totalRows - result.validRows) / result.totalRows) * 100 : 0;
    
    return {
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      warningCount: result.warnings.length
    };
  }
}