import { MarketData, PricePoint } from '../types';

export interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class MarketDataService {
  private cache: Map<string, MarketData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly FALLBACK_PRICES: Record<string, number> = {
    wheat: 2500,
    chili: 8000,
    tomato: 3000,
    'general-grain': 2200
  };

  constructor(private s3Config: S3Config) {}

  /**
   * Fetch market data for a specific crop with defensive handling
   */
  async getMarketData(cropId: string): Promise<MarketData> {
    try {
      // Check cache first
      const cached = this.getCachedData(cropId);
      if (cached) {
        return cached;
      }

      // Attempt to fetch from S3
      const data = await this.fetchFromS3(cropId);
      if (data) {
        this.setCachedData(cropId, data);
        return data;
      }

      // Fallback to default pricing
      return this.getFallbackData(cropId);
    } catch (error) {
      console.warn(`Failed to fetch market data for ${cropId}:`, error);
      return this.getFallbackData(cropId);
    }
  }

  /**
   * Fetch market data from S3 bucket
   */
  private async fetchFromS3(cropId: string): Promise<MarketData | null> {
    try {
      const fileName = `market_prices_${cropId}.csv`;
      const url = this.buildS3Url(fileName);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvData = await response.text();
      return this.parseMarketDataFromCSV(cropId, csvData);
    } catch (error) {
      console.error(`S3 fetch failed for ${cropId}:`, error);
      return null;
    }
  }

  /**
   * Parse CSV data into MarketData structure
   */
  private parseMarketDataFromCSV(cropId: string, csvData: string): MarketData {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    // Validate CSV structure
    if (!headers.includes('date') || !headers.includes('price')) {
      throw new Error('Invalid CSV format: missing required columns');
    }

    const priceHistory: PricePoint[] = [];
    let currentPrice = this.FALLBACK_PRICES[cropId] || this.FALLBACK_PRICES['general-grain'];

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        const dateStr = values[headers.indexOf('date')];
        const priceStr = values[headers.indexOf('price')];
        const volumeStr = values[headers.indexOf('volume')] || '0';

        if (dateStr && priceStr) {
          const date = new Date(dateStr);
          const price = parseFloat(priceStr);
          const volume = parseFloat(volumeStr);

          if (!isNaN(price) && !isNaN(date.getTime())) {
            priceHistory.push({ date, price, volume });
            
            // Use most recent price as current price
            if (i === lines.length - 1) {
              currentPrice = price;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to parse CSV line ${i}:`, error);
        // Continue processing other lines
      }
    }

    return {
      cropId,
      currentPrice,
      priceHistory: priceHistory.sort((a, b) => a.date.getTime() - b.date.getTime()),
      lastUpdated: new Date(),
      source: 'S3'
    };
  }

  /**
   * Get cached data if still valid
   */
  private getCachedData(cropId: string): MarketData | null {
    const data = this.cache.get(cropId);
    const expiry = this.cacheExpiry.get(cropId);
    
    if (data && expiry && Date.now() < expiry) {
      return data;
    }
    
    // Clean up expired cache
    this.cache.delete(cropId);
    this.cacheExpiry.delete(cropId);
    return null;
  }

  /**
   * Cache market data with expiry
   */
  private setCachedData(cropId: string, data: MarketData): void {
    this.cache.set(cropId, data);
    this.cacheExpiry.set(cropId, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Generate fallback data when S3 is unavailable
   */
  private getFallbackData(cropId: string): MarketData {
    const fallbackPrice = this.FALLBACK_PRICES[cropId] || this.FALLBACK_PRICES['general-grain'];
    
    return {
      cropId,
      currentPrice: fallbackPrice,
      priceHistory: [
        {
          date: new Date(),
          price: fallbackPrice,
          volume: 0
        }
      ],
      lastUpdated: new Date(),
      source: 'fallback'
    };
  }

  /**
   * Build S3 URL for market data file
   */
  private buildS3Url(fileName: string): string {
    return `https://${this.s3Config.bucketName}.s3.${this.s3Config.region}.amazonaws.com/${fileName}`;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Batch fetch multiple crops
   */
  async getMultipleMarketData(cropIds: string[]): Promise<Record<string, MarketData>> {
    const results: Record<string, MarketData> = {};
    
    const promises = cropIds.map(async (cropId) => {
      try {
        results[cropId] = await this.getMarketData(cropId);
      } catch (error) {
        console.warn(`Failed to fetch data for ${cropId}:`, error);
        results[cropId] = this.getFallbackData(cropId);
      }
    });

    await Promise.all(promises);
    return results;
  }
}