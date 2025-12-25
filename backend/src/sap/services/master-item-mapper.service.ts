import type {
    MasterItemBarCode,
    MasterItemBatch,
    MasterItemType,
    SAPBatchInStock,
    SAPItem,
    SAPItemWarehouseInfo,
    SAPUnitOfMeasurementGroup,
    SAPUoMGroupDefinition,
} from '../types.ts';

/**
 * Service to map and combine SAP data into MasterItemType
 * Combines Items + UoM Groups + Batches + Stock into a unified format
 */
export class MasterItemMapperService {
  
  /**
   * Map a single SAP item to MasterItemType
   * 
   * @param item - SAP Item
   * @param uomGroup - UoM Group for this item (if exists)
   * @param batches - Batches for this item in the warehouse
   * @param stock - Stock information for this item in the warehouse
   * @param warehouseCode - Current warehouse code
   * @returns MasterItemType with all combined data
   */
  mapToMasterItem(
    item: SAPItem,
    uomGroup: SAPUnitOfMeasurementGroup | null,
    batches: SAPBatchInStock[],
    stock: SAPItemWarehouseInfo | null,
    warehouseCode: string
  ): MasterItemType {
    const inventoryUoM = item.InventoryUOM || 'PCS';
    const baseUoM = uomGroup?.BaseUoM || inventoryUoM;
    
    // Get stock quantity (default to 0 if not found)
    const stockInInventoryUoM = stock?.InStock || 0;
    
    // Validate batch-managed items
    // For items with ManageBatchNumbers = 'tYES', the sum of batch quantities
    // should match the InStock value from ItemWarehouseInfoCollection
    if (item.ManageBatchNumbers === 'tYES' && batches.length > 0) {
      const batchTotal = batches.reduce((sum, batch) => sum + batch.Quantity, 0);
      if (Math.abs(batchTotal - stockInInventoryUoM) > 0.01) {
        console.warn(
          `Stock mismatch for item ${item.ItemCode}: ` +
          `Batch total=${batchTotal}, InStock=${stockInInventoryUoM}`
        );
      }
    }
    // For items without batch management (ManageBatchNumbers = 'tNO'),
    // only use the InStock value from ItemWarehouseInfoCollection
    
    // Map barcodes with conversion rates and calculated quantities
    const barCodeCollection: MasterItemBarCode[] = [];
    
    if (item.ItemBarCodeCollection && item.ItemBarCodeCollection.length > 0) {
      for (const bc of item.ItemBarCodeCollection) {
        if (!bc.Barcode) continue;
        
        // Find matching UoM definition for this barcode
        let uomDef: SAPUoMGroupDefinition | undefined;
        let quantityInStock = stockInInventoryUoM; // Default to inventory UoM stock
        
        if (bc.UoMEntry && uomGroup?.UoMGroupDefinitionCollection) {
          // Find the UoM definition that matches this barcode's UoM entry
          uomDef = uomGroup.UoMGroupDefinitionCollection.find(
            def => def.AlternateUoM // For now, matching alternate UoM
          );
          
          // Calculate stock in this UoM
          if (uomDef && uomDef.BaseQuantity && uomDef.AlternateQuantity) {
            // Example: BaseQuantity=12, AlternateQuantity=1 means "12 Pcs per 1 Case"
            // If stock is 144 Pcs, then in Cases = 144 / 12 = 12
            quantityInStock = stockInInventoryUoM / (uomDef.BaseQuantity / uomDef.AlternateQuantity);
          }
        }
        
        barCodeCollection.push({
          barCode: bc.Barcode,
          uomType: uomDef?.AlternateUoM || baseUoM,
          uomEntry: bc.UoMEntry,
          alternateUoM: uomDef?.AlternateUoM,
          alternateQuantity: uomDef?.AlternateQuantity,
          baseQuantity: uomDef?.BaseQuantity,
          quantityInStock: Math.floor(quantityInStock), // Round down
        });
      }
    }
    
    // Map batches
    const batchesInStock: MasterItemBatch[] = batches.map(batch => ({
      batchNumber: batch.BatchNumber,
      quantity: batch.Quantity,
      expiryDate: batch.ExpiryDate,
      manufacturingDate: batch.ManufacturingDate,
    }));
    
    return {
      itemCode: item.ItemCode,
      itemName: item.ItemName,
      inventoryUoM,
      inventoryUoMEntry: item.UoMGroupEntry,
      warehouseCode,
      amountInStockInInventoryUoM: stockInInventoryUoM,
      uomGroupEntry: item.UoMGroupEntry,
      baseUoM,
      barCodeCollection,
      batchesInStock,
      isValid: item.Valid !== 'N',
    };
  }
      
      // Barcodes
  
  /**
   * Map multiple SAP items to MasterItemType array
   * 
   * @param items - Array of SAP Items
   * @param uomGroups - Array of UoM Groups
   * @param batchesMap - Map of ItemCode -> Batches
   * @param stockMap - Map of ItemCode -> Stock Info
   * @param warehouseCode - Current warehouse code
   * @returns Array of MasterItemType
   */
  mapToMasterItems(
    items: SAPItem[],
    uomGroups: SAPUnitOfMeasurementGroup[],
    batchesMap: Map<string, SAPBatchInStock[]>,
    stockMap: Map<string, SAPItemWarehouseInfo>,
    warehouseCode: string
  ): MasterItemType[] {
    // Create a map of UoMGroupEntry -> UoMGroup for fast lookup
    const uomGroupMap = new Map<number, SAPUnitOfMeasurementGroup>();
    for (const uomGroup of uomGroups) {
      uomGroupMap.set(uomGroup.AbsEntry, uomGroup);
    }
    
    return items.map(item => {
      const uomGroup = item.UoMGroupEntry 
        ? uomGroupMap.get(item.UoMGroupEntry) || null 
        : null;
      const batches = batchesMap.get(item.ItemCode) || [];
      const stock = stockMap.get(item.ItemCode) || null;
      
      return this.mapToMasterItem(item, uomGroup, batches, stock, warehouseCode);
    });
  }
}

// Singleton instance
let masterItemMapperInstance: MasterItemMapperService | null = null;

export function getMasterItemMapper(): MasterItemMapperService {
  if (!masterItemMapperInstance) {
    masterItemMapperInstance = new MasterItemMapperService();
  }
  return masterItemMapperInstance;
}
