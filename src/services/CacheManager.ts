/**
 * Cache manager for market data with TTL and real-time updates
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheOptions {
  defaultTTL?: number; // milliseconds
  maxSize?: number;
  enableRealTimeUpdates?: boolean;
}

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private updateCallbacks: Map<string, ((data: T) => void)[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private readonly options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      enableRealTimeUpdates: true,
      ...options
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Set data in cache with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTTL,
      key
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);

    // Notify subscribers of update
    if (this.options.enableRealTimeUpdates) {
      this.notifySubscribers(key, data);
    }
  }

  /**
   * Get data from cache if not expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    this.updateCallbacks.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.updateCallbacks.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: string[];
    expiredEntries: number;
  } {
    const expiredCount = Array.from(this.cache.values()).filter(entry => this.isExpired(entry)).length;
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate(),
      entries: Array.from(this.cache.keys()),
      expiredEntries: expiredCount
    };
  }

  /**
   * Subscribe to real-time updates for a specific key
   */
  subscribe(key: string, callback: (data: T) => void): () => void {
    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, []);
    }
    
    this.updateCallbacks.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        
        // Clean up empty callback arrays
        if (callbacks.length === 0) {
          this.updateCallbacks.delete(key);
        }
      }
    };
  }

  /**
   * Get or set with async loader function
   */
  async getOrLoad(
    key: string,
    loader: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Load data and cache it
    try {
      const data = await loader();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Batch get multiple keys
   */
  getMultiple(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = this.get(key);
    }
    
    return result;
  }

  /**
   * Batch set multiple entries
   */
  setMultiple(entries: Record<string, T>, ttl?: number): void {
    for (const [key, data] of Object.entries(entries)) {
      this.set(key, data, ttl);
    }
  }

  /**
   * Refresh cache entry by extending its TTL
   */
  refresh(key: string, additionalTTL?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    entry.timestamp = Date.now();
    if (additionalTTL) {
      entry.ttl = additionalTTL;
    }

    return true;
  }

  /**
   * Get time until expiry for a key
   */
  getTimeToExpiry(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) {
      return 0;
    }

    const expiryTime = entry.timestamp + entry.ttl;
    return Math.max(0, expiryTime - Date.now());
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.updateCallbacks.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private notifySubscribers(key: string, data: T): void {
    const callbacks = this.updateCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Callback error for key ${key}:`, error);
        }
      });
    }
  }

  private calculateHitRate(): number {
    // This would need to be implemented with hit/miss tracking
    // For now, return a placeholder
    return 0;
  }

  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
}