/**
 * TypeScript interfaces for SAP Business One Service Layer API
 */

// ========================================
// AUTHENTICATION
// ========================================

export interface SAPLoginRequest {
  CompanyDB: string;
  UserName: string;
  Password: string;
}

export interface SAPLoginResponse {
  SessionId: string;
  Version: string;
  SessionTimeout: number;
}

// ========================================
// GENERIC RESPONSE TYPES
// ========================================

/**
 * Generic SAP OData response wrapper
 * Used for paginated responses from SAP Service Layer
 */
export interface SAPResponse<T> {
  value: T[];
  'odata.nextLink'?: string;
}

export interface SAPErrorResponse {
  error: {
    code: string;
    message: {
      lang: string;
      value: string;
    };
  };
}

export interface SAPQueryParams {
  $select?: string;
  $filter?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $expand?: string;
}

// ========================================
// ITEMS (PRODUCTS)
// ========================================

export interface SAPBarCode {
  ItemCode?: string;
  UoMEntry?: number;
  Barcode?: string;
}

/**
 * Stock information for an item in a specific warehouse
 * Note: For items with batch management (ManageBatchNumbers = 'tYES'),
 * the InStock value should match the sum of all batch quantities
 */
export interface SAPItemWarehouseInfo {
  ItemCode: string;
  WarehouseCode: string;
  InStock: number;
}

export interface SAPItem {
  ItemCode: string;
  ItemName: string;
  ItemDescription?: string;
  BarCode?: string; // Primary barcode
  InventoryUOM?: string; // e.g., 'PCS', 'CASE'
  InventoryUoMEntry?: number;
  UoMGroupEntry?: number;
  DefaultWarehouse?: string;
  U_CCF_Type?: string;
  Valid?: string; // 'Y' or 'N'
  ManageBatchNumbers?: string; // 'tYES' or 'tNO' - indicates if batch management is enabled
  ItemBarCodeCollection?: SAPBarCode[];
  ItemWarehouseInfoCollection?: SAPItemWarehouseInfo[];
}

// ========================================
// WAREHOUSES
// ========================================

export interface SAPWarehouse {
  WarehouseCode: string;
  WarehouseName: string;
  Inactive?: string; // 'Y' or 'N'
}

// ========================================
// BATCHES
// ========================================

/**
 * Raw response from SAP Custom Query for batches
 * Field names are as returned from SAP
 */
export interface SAPBatchInStockRaw {
  ItemCode: string;
  DistNumber: string; // This is the batch number
  Quantity: number;
  WhsCode: string; // Warehouse code
  CreateDate?: string; // YYYYMMDD format
  ExpDate?: string; // YYYYMMDD format
}

/**
 * Mapped batch data with clean field names
 * Use this type in application code
 * 
 * Note: The sum of all batch quantities for an item should match
 * the InStock value in ItemWarehouseInfoCollection
 */
export interface SAPBatchInStock {
  ItemCode: string;
  WarehouseCode: string;
  BatchNumber: string;
  Quantity: number;
  ExpiryDate?: string;
  ManufacturingDate?: string;
}

// ========================================
// UNIT OF MEASUREMENT (UoM)
// ========================================

export interface SAPUoMGroupDefinition {
  AlternateUoM?: string;
  AlternateQuantity?: number;
  BaseQuantity?: number;
}

export interface SAPUnitOfMeasurementGroup {
  AbsEntry: number;
  BaseUoM: string;
  UoMGroupDefinitionCollection?: SAPUoMGroupDefinition[];
}

// ========================================
// MASTER ITEM TYPE (Combined Frontend Data)
// ========================================
export interface MasterItemBarCode {
  barCode: string;
  uomType: string; // e.g., 'PCS', 'CASE'
  uomEntry?: number;
  alternateUoM?: string;
  alternateQuantity?: number;
  baseQuantity?: number;
  quantityInStock: number; // Calculated stock for this barcode's UoM
}

export interface MasterItemBatch {
  batchNumber: string;
  quantity: number; // In InventoryUoM/BaseUoM
  expiryDate?: string;
  manufacturingDate?: string;
}

export interface MasterItemType {
  itemCode: string;
  itemName: string;
  inventoryUoM: string;
  inventoryUoMEntry?: number;
  warehouseCode: string;
  amountInStockInInventoryUoM: number;
  uomGroupEntry?: number;
  baseUoM: string;
  barCodeCollection: MasterItemBarCode[];
  batchesInStock: MasterItemBatch[];
  isValid: boolean;
}

// ========================================
// INVENTORY COUNTING & POSTING
// ========================================

/**
 * Batch difference for inventory posting
 * Positive = increase, Negative = decrease
 */
export interface SAPInventoryPostingBatchNumber {
  BatchNumber: string;
  Quantity: number; // Difference (can be negative)
}

/**
 * Line item for inventory posting
 */
export interface SAPInventoryPostingLine {
  ItemCode: string;
  UoMCode: string; // Must be InventoryUoM
  UoMCountedQuantity: number; // Total counted in InventoryUoM
  WarehouseCode: string;
  CostingCode?: string; // e.g., '800'
  InventoryOffsetDecreaseAccount?: string; // e.g., '25100'
  InventoryOffsetIncreaseAccount?: string; // e.g., '25100'
  InventoryPostingBatchNumbers?: SAPInventoryPostingBatchNumber[];
}

/**
 * SAP Inventory Posting document
 */
export interface SAPInventoryPosting {
  CountDate?: string; // ISO date
  PostingDate?: string; // ISO date
  Reference2?: string; // External reference (e.g., session ID)
  JournalRemark?: string;
  Remarks?: string; // e.g., "Counted by 'First Last'"
  InventoryPostingLines: SAPInventoryPostingLine[];
}

/**
 * Response after creating inventory posting
 */
export interface SAPInventoryPostingResponse {
  DocEntry: number;
  DocNum: number;
  PostingDate: string;
}

/**
 * Input for counting an item (from frontend)
 */
export interface CountedItem {
  itemCode: string;
  countedQuantity: number; // In the UoM that was scanned/selected
  countedUoM: string; // The UoM used for counting (might not be InventoryUoM)
  warehouseCode: string;
  batchCounts?: CountedBatch[]; // Required for batch-managed items
}

/**
 * Batch count input from frontend
 */
export interface CountedBatch {
  batchNumber: string;
  countedQuantity: number; // In InventoryUoM
}









