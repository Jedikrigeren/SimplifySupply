import { validateSapConfig } from './config.ts';
import { getMasterItemService } from './services/master-item.service.ts';

/**
 * Initialize SAP cache with periodic refresh
 * Call this once when the backend starts
 * 
 * @param warehouseCode - Default warehouse code to cache data for
 */
export function initializeSAPCache(warehouseCode: string = '01'): void {
  // Check if SAP is configured
  const validation = validateSapConfig();
  if (!validation.valid) {
    console.warn('SAP configuration incomplete. Skipping cache initialization.');
    console.warn('Missing:', validation.missing.join(', '));
    return;
  }

  try {
    // Initialize master item cache (combines Items + UoM + Batches + Stock)
    // Only MasterItemType is cached - raw services just fetch data
    const masterItemService = getMasterItemService();
    masterItemService.initializeCache(warehouseCode);
  } catch (error) {
    console.error('SAP cache initialization failed:', error);
    console.warn('Backend will continue without SAP caching');
  }
}
