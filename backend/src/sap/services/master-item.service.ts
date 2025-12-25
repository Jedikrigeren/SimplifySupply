import { CacheKeys, CacheTTL, getCacheService } from '../cache.service.ts';
import { getSAPClient } from '../client.ts';
import type {
  MasterItemType,
  SAPBatchInStock,
  SAPItem,
  SAPItemWarehouseInfo,
  SAPUnitOfMeasurementGroup,
} from '../types.ts';
import { getBatchService } from './batch.service.ts';
import { ItemService } from './item.service.ts';
import { getMasterItemMapper } from './master-item-mapper.service.ts';
import { getUoMService } from './uom.service.ts';

/**
 * Service for Master Item operations with multi-layer caching
 * 
 * Cache Strategy:
 * 1. Independent caches: items, uomGroups, batches (per warehouse)
 * 2. Master items cache: derived from independent caches
 * 3. When any independent cache updates, master items auto-rebuild
 * 4. Different refresh intervals for different data types
 */
export class MasterItemService {
  private client = getSAPClient();
  private cache = getCacheService();
  private itemService = new ItemService();
  private uomService = getUoMService();
  private batchService = getBatchService();
  private mapper = getMasterItemMapper();
  private initializedWarehouses = new Set<string>();

  constructor() {
    // Initialize independent cache schedules (not warehouse-specific)
    this.initializeIndependentCaches();
  }

  /**
   * Initialize caching for independent data sources
   * These are shared across all warehouses
   */
  private initializeIndependentCaches(): void {
    // Items cache - refresh every 24 hours (rarely changes)
    this.cache.scheduleRefresh(
      CacheKeys.allItems(),
      async () => {
        const items = await this.itemService.getAllItems();
        this.cache.set(CacheKeys.allItems(), items, CacheTTL.DAY);
      },
      24 * 60 * 60 * 1000
    );

    // UoM Groups cache - refresh every 24 hours (rarely changes)
    this.cache.scheduleRefresh(
      CacheKeys.allUoMGroups(),
      async () => {
        const uomGroups = await this.uomService.getAllUoMGroups();
        this.cache.set(CacheKeys.allUoMGroups(), uomGroups, CacheTTL.DAY);
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Initialize batch caching and master item building for a warehouse
   * 
   * @param warehouseCode - Warehouse code to initialize cache for
   */
  initializeCache(warehouseCode: string): void {
    if (this.initializedWarehouses.has(warehouseCode)) {
      return;
    }

    // Batches cache - refresh every hour (changes frequently)
    this.cache.scheduleRefresh(
      CacheKeys.warehouseBatches(warehouseCode),
      async () => {
        const batches = await this.batchService.fetchBatchesInStock(warehouseCode);
        this.cache.set(CacheKeys.warehouseBatches(warehouseCode), batches, CacheTTL.MEDIUM);
      },
      60 * 60 * 1000 // 1 hour
    );

    // Register master items rebuilder when any dependency updates
    const rebuildMasterItems = () => {
      this.buildMasterItemsCache(warehouseCode);
      return Promise.resolve();
    };

    this.cache.onCacheUpdate(CacheKeys.allItems(), rebuildMasterItems);
    this.cache.onCacheUpdate(CacheKeys.allUoMGroups(), rebuildMasterItems);
    this.cache.onCacheUpdate(CacheKeys.warehouseBatches(warehouseCode), rebuildMasterItems);

    this.initializedWarehouses.add(warehouseCode);
  }

  /**
   * Build master items cache from independent caches
   * Called automatically when any dependency cache updates
   */
  private buildMasterItemsCache(warehouseCode: string): void {
    try {
      // Get data from independent caches
      const items = this.cache.get<SAPItem[]>(CacheKeys.allItems()) || [];
      const uomGroups = this.cache.get<SAPUnitOfMeasurementGroup[]>(CacheKeys.allUoMGroups()) || [];
      const batches = this.cache.get<SAPBatchInStock[]>(CacheKeys.warehouseBatches(warehouseCode)) || [];

      // If any cache is empty, skip building (wait for all to be ready)
      if (items.length === 0 || uomGroups.length === 0) {
        return;
      }

      // Extract stock levels from items
      const stockMap = this.extractStockFromItems(items, warehouseCode);

      // Create batches map
      const batchesMap = new Map<string, SAPBatchInStock[]>();
      for (const batch of batches) {
        if (!batchesMap.has(batch.ItemCode)) {
          batchesMap.set(batch.ItemCode, []);
        }
        batchesMap.get(batch.ItemCode)!.push(batch);
      }

      // Map to MasterItemType
      const masterItems = this.mapper.mapToMasterItems(
        items,
        uomGroups,
        batchesMap,
        stockMap,
        warehouseCode
      );

      // Store in cache (no need to notify dependents, this is the final cache)
      this.cache.set(CacheKeys.allMasterItems(warehouseCode), masterItems, CacheTTL.LONG);
    } catch (error) {
      console.error('Failed to build master items cache:', error);
    }
  }

  /**
   * Extract stock levels from items' ItemWarehouseInfoCollection
   * ItemWarehouseInfoCollection is already included in the item data
   */
  private extractStockFromItems(
    items: Array<{ ItemCode: string; ItemWarehouseInfoCollection?: SAPItemWarehouseInfo[] }>,
    warehouseCode: string
  ): Map<string, SAPItemWarehouseInfo> {
    const stockMap = new Map<string, SAPItemWarehouseInfo>();

    for (const item of items) {
      if (item.ItemWarehouseInfoCollection) {
        // Find the stock info for this warehouse
        const warehouseStock = item.ItemWarehouseInfoCollection.find(
          stock => stock.WarehouseCode === warehouseCode
        );
        
        if (warehouseStock) {
          stockMap.set(item.ItemCode, warehouseStock);
        }
      }
    }

    return stockMap;
  }

  /**
   * Get ALL master items (from cache - backend serves this)
   * Cache is kept fresh by automatic rebuilds when dependencies update
   * If warehouse hasn't been initialized yet, initialize it automatically
   */
  getAllMasterItems(warehouseCode: string): MasterItemType[] {
    // Initialize cache for this warehouse if not done yet
    if (!this.initializedWarehouses.has(warehouseCode)) {
      this.initializeCache(warehouseCode);
      // Build master items immediately on first request
      this.buildMasterItemsCache(warehouseCode);
    }

    const cacheKey = CacheKeys.allMasterItems(warehouseCode);

    // Return from cache (might be empty on very first call before caches populate)
    return this.cache.get<MasterItemType[]>(cacheKey) || [];
  }

  /**
   * Get master item by item code
   */
  getMasterItemByCode(itemCode: string, warehouseCode: string): MasterItemType | null {
    const allItems = this.getAllMasterItems(warehouseCode);
    return allItems.find(item => item.itemCode === itemCode) || null;
  }

  /**
   * Get master item by barcode (searches all barcodes in barCodeCollection)
   */
  getMasterItemByBarcode(barcode: string, warehouseCode: string): MasterItemType | null {
    const allItems = this.getAllMasterItems(warehouseCode);
    return allItems.find(item => 
      item.barCodeCollection.some(bc => bc.barCode === barcode)
    ) || null;
  }

  /**
   * Search master items by name or code
   */
  searchMasterItems(query: string, warehouseCode: string): MasterItemType[] {
    const allItems = this.getAllMasterItems(warehouseCode);
    const lowerQuery = query.toLowerCase();
    
    return allItems.filter(item =>
      item.itemCode.toLowerCase().includes(lowerQuery) ||
      item.itemName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Invalidate master item cache (manual trigger)
   */
  invalidateMasterItemCache(warehouseCode: string): void {
    this.cache.invalidate(CacheKeys.allMasterItems(warehouseCode));
  }
}

// Singleton instance
let masterItemServiceInstance: MasterItemService | null = null;

export function getMasterItemService(): MasterItemService {
  if (!masterItemServiceInstance) {
    masterItemServiceInstance = new MasterItemService();
  }
  return masterItemServiceInstance;
}
