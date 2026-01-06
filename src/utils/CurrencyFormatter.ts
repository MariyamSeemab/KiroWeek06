/**
 * Currency formatting utilities for Indian Rupee display
 */

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useIndianNumbering?: boolean;
}

export class CurrencyFormatter {
  private static readonly DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
    locale: 'en-IN',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useIndianNumbering: true
  };

  /**
   * Format amount in Indian Rupees with proper locale formatting
   */
  static formatINR(amount: number, options: CurrencyFormatOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      if (typeof amount !== 'number' || isNaN(amount)) {
        return '₹0';
      }

      if (opts.useIndianNumbering) {
        return this.formatIndianNumbering(amount, opts);
      } else {
        return new Intl.NumberFormat(opts.locale, {
          style: 'currency',
          currency: opts.currency,
          minimumFractionDigits: opts.minimumFractionDigits,
          maximumFractionDigits: opts.maximumFractionDigits
        }).format(amount);
      }
    } catch (error) {
      console.warn('Currency formatting failed:', error);
      return `₹${amount.toFixed(2)}`;
    }
  }

  /**
   * Format with Indian numbering system (lakhs, crores)
   */
  private static formatIndianNumbering(amount: number, options: Required<CurrencyFormatOptions>): string {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    let formattedNumber: string;
    let suffix = '';

    if (absAmount >= 10000000) { // 1 crore
      formattedNumber = (absAmount / 10000000).toFixed(options.maximumFractionDigits);
      suffix = ' Cr';
    } else if (absAmount >= 100000) { // 1 lakh
      formattedNumber = (absAmount / 100000).toFixed(options.maximumFractionDigits);
      suffix = ' L';
    } else if (absAmount >= 1000) { // 1 thousand
      formattedNumber = (absAmount / 1000).toFixed(options.maximumFractionDigits);
      suffix = ' K';
    } else {
      formattedNumber = absAmount.toFixed(options.minimumFractionDigits);
    }

    // Remove trailing zeros after decimal
    formattedNumber = formattedNumber.replace(/\.?0+$/, '');

    return `${sign}₹${formattedNumber}${suffix}`;
  }

  /**
   * Format amount as compact notation (e.g., 1.2K, 3.5L, 2.1Cr)
   */
  static formatCompact(amount: number): string {
    return this.formatINR(amount, {
      useIndianNumbering: true,
      maximumFractionDigits: 1
    });
  }

  /**
   * Format amount with full precision for calculations
   */
  static formatPrecise(amount: number): string {
    return this.formatINR(amount, {
      useIndianNumbering: false,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Parse formatted currency string back to number
   */
  static parseINR(formattedAmount: string): number {
    try {
      // Remove currency symbol and spaces
      let cleanAmount = formattedAmount.replace(/[₹,\s]/g, '');
      
      // Handle Indian suffixes
      const multipliers: Record<string, number> = {
        'Cr': 10000000,
        'L': 100000,
        'K': 1000
      };

      for (const [suffix, multiplier] of Object.entries(multipliers)) {
        if (cleanAmount.endsWith(suffix)) {
          cleanAmount = cleanAmount.slice(0, -suffix.length);
          const baseAmount = parseFloat(cleanAmount);
          return isNaN(baseAmount) ? 0 : baseAmount * multiplier;
        }
      }

      const amount = parseFloat(cleanAmount);
      return isNaN(amount) ? 0 : amount;
    } catch (error) {
      console.warn('Currency parsing failed:', error);
      return 0;
    }
  }

  /**
   * Format percentage with Indian locale
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    } catch (error) {
      return `${value.toFixed(decimals)}%`;
    }
  }

  /**
   * Format difference between two amounts with +/- indicator
   */
  static formatDifference(current: number, previous: number): string {
    const difference = current - previous;
    const sign = difference >= 0 ? '+' : '';
    const formatted = this.formatCompact(Math.abs(difference));
    
    return `${sign}${formatted}`;
  }

  /**
   * Format savings with positive/negative indicators
   */
  static formatSavings(amount: number): string {
    if (amount > 0) {
      return `Save ${this.formatCompact(amount)}`;
    } else if (amount < 0) {
      return `Loss ${this.formatCompact(Math.abs(amount))}`;
    } else {
      return 'Break Even';
    }
  }
}