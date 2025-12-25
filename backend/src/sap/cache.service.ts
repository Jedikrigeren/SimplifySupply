/**
 * In-memory cache for SAP data
 * Reduces SAP API load and improves response times
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: number;
  private refreshCallbacks = new Map<string, () => Promise<void>>();
  private refreshIntervals = new Map<string, number>();
  private dependencyCallbacks = new Map<string, Set<() => Promise<void>>>();

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
  }

  /**
   * Schedule periodic cache refresh
   * The callback will be called immediately and then on the specified interval
   * 
   * @param key - Unique identifier for this refresh job
   * @param callback - Async function that populates the cache
   * @param intervalMs - How often to refresh (in milliseconds)
   */
  scheduleRefresh(key: string, callback: () => Promise<void>, intervalMs: number): void {
    // Store the callback
    this.refreshCallbacks.set(key, callback);

    // Run immediately
    const wrappedCallback = async () => {
      await callback();
      await this.notifyDependents(key);
    };

    wrappedCallback().catch(err => console.error(`Initial cache refresh failed for '${key}':`, err));

    // Schedule periodic refresh
    const interval = setInterval(async () => {
      try {
        await wrappedCallback();
      } catch (error) {
        console.error(`Scheduled cache refresh failed for '${key}':`, error);
      }
    }, intervalMs);

    this.refreshIntervals.set(key, interval);
  }

  /**
   * Cancel a scheduled refresh
   */
  cancelRefresh(key: string): void {
    const interval = this.refreshIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(key);
      this.refreshCallbacks.delete(key);
    }
  }

  /**
   * Manually trigger a specific refresh job
   */
  async triggerRefresh(key: string): Promise<void> {
    const callback = this.refreshCallbacks.get(key);
    if (callback) {
      await callback();
    } else {
      throw new Error(`No refresh job found for key: ${key}`);
    }
  }

  /**
   * Register a callback to run when a cache key is updated
   * Used for dependent caches (e.g., master items depends on items, uom, batches)
   * 
   * @param dependencyKey - The cache key to watch
   * @param callback - Function to call when the dependency updates
   */
  onCacheUpdate(dependencyKey: string, callback: () => Promise<void>): void {
    if (!this.dependencyCallbacks.has(dependencyKey)) {
      this.dependencyCallbacks.set(dependencyKey, new Set());
    }
    this.dependencyCallbacks.get(dependencyKey)!.add(callback);
  }

  /**
   * Notify all dependent callbacks that a cache was updated
   */
  private async notifyDependents(key: string): Promise<void> {
    const callbacks = this.dependencyCallbacks.get(key);
    if (callbacks && callbacks.size > 0) {
      for (const callback of callbacks) {
        try {
          await callback();
        } catch (error) {
          console.error(`Dependent cache update failed for '${key}':`, error);
        }
      }
    }
  }

  /**
   * Set cached data with TTL and notify dependents
   */
  async setAndNotify<T>(key: string, data: T, ttl: number): Promise<void> {
    this.set(key, data, ttl);
    await this.notifyDependents(key);
  }

  /**
   * Stop cleanup interval and all refresh jobs (for graceful shutdown)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    
    // Stop all refresh intervals
    for (const interval of this.refreshIntervals.values()) {
      clearInterval(interval);
    }
    
    this.refreshIntervals.clear();
    this.refreshCallbacks.clear();
    this.dependencyCallbacks.clear();
    this.cache.clear();
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

/**
 * Get cache service instance
 */
export function getCacheService(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  // Raw SAP Items (used by ItemService)
  allItems: () => 'sap:items:all',
  item: (itemCode: string) => `sap:item:${itemCode}`,
  itemByBarcode: (barcode: string) => `sap:item:barcode:${barcode}`,
  itemStock: (itemCode: string, warehouse: string) => `sap:stock:${itemCode}:${warehouse}`,
  
  // Master Items (combined data - used by MasterItemService)
  allMasterItems: (warehouseCode: string) => `sap:master-items:${warehouseCode}`,
  masterItem: (itemCode: string, warehouseCode: string) => `sap:master-item:${itemCode}:${warehouseCode}`,
  
  // UoM Groups
  allUoMGroups: () => 'sap:uom-groups:all',
  uomGroup: (absEntry: number) => `sap:uom-group:${absEntry}`,
  
  // Warehouses
  allWarehouses: () => 'sap:warehouses:all',
  warehouse: (code: string) => `sap:warehouse:${code}`,
  
  // Batches
  warehouseBatches: (warehouseCode: string) => `sap:batches:${warehouseCode}`,
  itemBatches: (itemCode: string, warehouseCode: string) => `sap:batches:${itemCode}:${warehouseCode}`,
  
  // Generic key generator for custom patterns
  key: (key: string) => `sap:${key}`,
};

/**
 * Default TTL values (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes
  LONG: 4 * 60 * 60 * 1000,  // 4 hours
  DAY: 24 * 60 * 60 * 1000,  // 24 hours
};
