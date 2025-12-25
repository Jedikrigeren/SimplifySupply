import { getSAPClient } from '../client.ts';
import type {
  SAPBatchInStock,
  SAPBatchInStockRaw,
} from '../types.ts';

/**
 * Maps raw SAP batch data to clean field names
 */
function mapBatchData(raw: SAPBatchInStockRaw): SAPBatchInStock {
  return {
    ItemCode: raw.ItemCode,
    WarehouseCode: raw.WhsCode,
    BatchNumber: raw.DistNumber,
    Quantity: raw.Quantity,
    ManufacturingDate: raw.CreateDate,
    ExpiryDate: raw.ExpDate,
  };
}

/**
 * Service for SAP Batch operations via Custom Queries
 * Batches are typically managed through custom SQL queries in SAP
 */
export class BatchService {
  private client = getSAPClient();

  /**
   * Fetch batches in stock for a specific warehouse using custom query
   * Uses SQLQueries endpoint with custom query ID
   * 
   * @param warehouseCode - Warehouse code to filter batches
   * @param customQueryId - SAP custom query ID (e.g., 'CQ10004')
   * @returns Array of batches in stock
   */
  async fetchBatchesInStock(
    warehouseCode: string,
    customQueryId: string = 'CQ10004'
  ): Promise<SAPBatchInStock[]> {
    try {
      const queryParams = {
        wareHouseCode: `'${warehouseCode}'`,
      };

      const rawBatches = await this.client.fetchCustomQuery<SAPBatchInStockRaw>(
        customQueryId,
        queryParams
      );

      // Map raw SAP field names to clean field names
      return rawBatches.map(mapBatchData);
    } catch (error) {
      console.error(`Failed to fetch batches for warehouse ${warehouseCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch batches for a specific item in a warehouse
   * 
   * @param itemCode - Item code to filter
   * @param warehouseCode - Warehouse code to filter
   * @param customQueryId - SAP custom query ID
   * @returns Array of batches for the item
   */
  async fetchBatchesForItem(
    itemCode: string,
    warehouseCode: string,
    customQueryId: string = 'CQ10004'
  ): Promise<SAPBatchInStock[]> {
    const allBatches = await this.fetchBatchesInStock(warehouseCode, customQueryId);
    return allBatches.filter(batch => batch.ItemCode === itemCode);
  }
}

// Singleton instance
let batchServiceInstance: BatchService | null = null;

export function getBatchService(): BatchService {
  if (!batchServiceInstance) {
    batchServiceInstance = new BatchService();
  }
  return batchServiceInstance;
}
