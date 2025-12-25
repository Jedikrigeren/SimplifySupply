import { getSAPClient } from '../client.ts';
import type {
    CountedBatch,
    CountedItem,
    SAPInventoryPosting,
    SAPInventoryPostingBatchNumber,
    SAPInventoryPostingLine,
    SAPInventoryPostingResponse,
    SAPUnitOfMeasurementGroup
} from '../types.ts';
import { getMasterItemService } from './master-item.service.ts';
import { getUoMService } from './uom.service.ts';

/**
 * Service for Inventory Counting and Posting
 * Handles UoM conversion and batch difference calculation
 */
export class InventoryCountingService {
  private client = getSAPClient();
  private masterItemService = getMasterItemService();
  private uomService = getUoMService();

  /**
   * Convert quantity from any UoM to InventoryUoM
   * 
   * @param quantity - Quantity in sourceUoM
   * @param sourceUoM - UoM that was counted in
   * @param inventoryUoM - Target InventoryUoM
   * @param uomGroup - UoM group definitions
   * @returns Quantity converted to InventoryUoM
   */
  convertToInventoryUoM(
    quantity: number,
    sourceUoM: string,
    inventoryUoM: string,
    uomGroup: SAPUnitOfMeasurementGroup | null
  ): number {
    // If already in inventory UoM, no conversion needed
    if (sourceUoM === inventoryUoM) {
      return quantity;
    }

    // If no UoM group, can't convert
    if (!uomGroup || !uomGroup.UoMGroupDefinitionCollection) {
      throw new Error(`Cannot convert from ${sourceUoM} to ${inventoryUoM}: no UoM group definitions`);
    }

    // Find the conversion definition
    const definition = uomGroup.UoMGroupDefinitionCollection.find(
      def => def.AlternateUoM === sourceUoM
    );

    if (!definition || !definition.BaseQuantity || !definition.AlternateQuantity) {
      throw new Error(`Cannot convert from ${sourceUoM} to ${inventoryUoM}: no conversion definition found`);
    }

    // Example: BaseQuantity=12, AlternateQuantity=1 means "12 Pcs per 1 Case"
    // If counted 5 Cases, that's 5 * (12/1) = 60 Pcs
    const conversionFactor = definition.BaseQuantity / definition.AlternateQuantity;
    return quantity * conversionFactor;
  }

  /**
   * Calculate batch differences for inventory posting
   * Compares current batch quantities with counted quantities
   * 
   * @param currentBatches - Current batches in stock
   * @param countedBatches - User-counted batches
   * @returns Array of batch differences (positive = increase, negative = decrease)
   */
  calculateBatchDifferences(
    currentBatches: Array<{ batchNumber: string; quantity: number }>,
    countedBatches: CountedBatch[]
  ): SAPInventoryPostingBatchNumber[] {
    const differences: SAPInventoryPostingBatchNumber[] = [];
    const countedMap = new Map<string, number>();

    // Build map of counted quantities
    for (const batch of countedBatches) {
      countedMap.set(batch.batchNumber, batch.countedQuantity);
    }

    // Check all current batches for differences
    for (const currentBatch of currentBatches) {
      const countedQty = countedMap.get(currentBatch.batchNumber) || 0;
      const difference = countedQty - currentBatch.quantity;

      if (difference !== 0) {
        differences.push({
          BatchNumber: currentBatch.batchNumber,
          Quantity: difference,
        });
      }

      // Remove from map so we can detect new batches
      countedMap.delete(currentBatch.batchNumber);
    }

    // Any remaining batches in countedMap are new batches
    for (const [batchNumber, countedQty] of countedMap.entries()) {
      if (countedQty > 0) {
        differences.push({
          BatchNumber: batchNumber,
          Quantity: countedQty,
        });
      }
    }

    return differences;
  }

  /**
   * Prepare inventory posting from counted items
   * Handles UoM conversion and batch difference calculation
   * 
   * @param countedItems - Items that were counted
   * @param countedBy - Name of person who counted
   * @param sessionId - Optional session/reference ID
   * @returns Prepared inventory posting document
   */
  async prepareInventoryPosting(
    countedItems: CountedItem[],
    countedBy: string,
    sessionId?: string
  ): Promise<SAPInventoryPosting> {
    const lines: SAPInventoryPostingLine[] = [];

    for (const countedItem of countedItems) {
      // Get master item data
      const masterItem = this.masterItemService.getMasterItemByCode(
        countedItem.itemCode,
        countedItem.warehouseCode
      );

      if (!masterItem) {
        throw new Error(`Item ${countedItem.itemCode} not found`);
      }

      // Get UoM group for conversion
      let uomGroup: SAPUnitOfMeasurementGroup | null = null;
      if (masterItem.uomGroupEntry) {
        uomGroup = await this.uomService.getUoMGroupByAbsEntry(masterItem.uomGroupEntry);
      }

      // Convert counted quantity to InventoryUoM
      const countedInInventoryUoM = this.convertToInventoryUoM(
        countedItem.countedQuantity,
        countedItem.countedUoM,
        masterItem.inventoryUoM,
        uomGroup
      );

      // Prepare line
      const line: SAPInventoryPostingLine = {
        ItemCode: countedItem.itemCode,
        UoMCode: masterItem.inventoryUoM,
        UoMCountedQuantity: countedInInventoryUoM,
        WarehouseCode: countedItem.warehouseCode,
        CostingCode: '800', // Default costing code
        InventoryOffsetDecreaseAccount: '25100',
        InventoryOffsetIncreaseAccount: '25100',
      };

      // Handle batch differences if item is batch-managed
      if (masterItem.batchesInStock.length > 0) {
        if (!countedItem.batchCounts || countedItem.batchCounts.length === 0) {
          throw new Error(
            `Item ${countedItem.itemCode} is batch-managed but no batch counts provided`
          );
        }

        // Calculate batch differences
        const batchDifferences = this.calculateBatchDifferences(
          masterItem.batchesInStock,
          countedItem.batchCounts
        );

        // Verify batch differences sum equals total difference
        const batchDiffSum = batchDifferences.reduce((sum, b) => sum + b.Quantity, 0);
        const totalDifference = countedInInventoryUoM - masterItem.amountInStockInInventoryUoM;

        if (Math.abs(batchDiffSum - totalDifference) > 0.01) {
          throw new Error(
            `Batch differences (${batchDiffSum}) don't match total difference (${totalDifference}) for item ${countedItem.itemCode}`
          );
        }

        line.InventoryPostingBatchNumbers = batchDifferences;
      }

      lines.push(line);
    }

    // Build posting document
    const now = new Date().toISOString();
    const posting: SAPInventoryPosting = {
      CountDate: now,
      PostingDate: now,
      Reference2: sessionId || 'Mobile App Counting',
      JournalRemark: 'AUTOMATIC POSTING',
      Remarks: `Counted by '${countedBy}'`,
      InventoryPostingLines: lines,
    };

    return posting;
  }

  /**
   * Post inventory counting to SAP
   * 
   * @param posting - Prepared inventory posting document
   * @returns SAP response with document numbers
   */
  async postInventoryCounting(
    posting: SAPInventoryPosting
  ): Promise<SAPInventoryPostingResponse> {
    try {
      const response = await this.client.createSAPEntity<SAPInventoryPostingResponse>(
        '/InventoryPostings',
        posting
      );

      return response;
    } catch (error) {
      console.error('Failed to post inventory counting:', error);
      throw error;
    }
  }

  /**
   * Complete workflow: prepare and post inventory counting
   * 
   * @param countedItems - Items that were counted
   * @param countedBy - Name of person who counted
   * @param sessionId - Optional session/reference ID
   * @returns SAP response with document numbers
   */
  async countAndPost(
    countedItems: CountedItem[],
    countedBy: string,
    sessionId?: string
  ): Promise<SAPInventoryPostingResponse> {
    const posting = await this.prepareInventoryPosting(countedItems, countedBy, sessionId);
    return await this.postInventoryCounting(posting);
  }
}

// Singleton instance
let inventoryCountingServiceInstance: InventoryCountingService | null = null;

export function getInventoryCountingService(): InventoryCountingService {
  if (!inventoryCountingServiceInstance) {
    inventoryCountingServiceInstance = new InventoryCountingService();
  }
  return inventoryCountingServiceInstance;
}
