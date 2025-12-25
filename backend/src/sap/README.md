# SAP Service Layer Integration

This module handles all interactions with SAP Business One Service Layer API.

## Structure

```
sap/
├── client.ts              # HTTP client with session management
├── config.ts              # Configuration and environment variables
├── types.ts               # TypeScript interfaces for SAP entities
├── cache.service.ts       # In-memory caching with TTL and scheduled refresh
├── init.ts                # Cache initialization on server startup
├── index.ts               # Central export point
└── services/
    ├── item.service.ts              # Raw SAP Item operations
    ├── uom.service.ts               # Unit of Measurement Groups
    ├── batch.service.ts             # Batch operations via custom queries
    ├── warehouse.service.ts         # Warehouse operations
    ├── inventory.service.ts         # Inventory counting and adjustments
    ├── master-item-mapper.service.ts # Maps SAP data to MasterItemType
    └── master-item.service.ts       # Combined cached master items (USE THIS)
```

## Architecture: MasterItemType

Instead of caching raw SAP data, we combine multiple SAP entities into a unified `MasterItemType`:

**Data Sources Combined:**
1. **Items** - Basic product info (ItemCode, ItemName, BarCodeCollection)
2. **UnitOfMeasurementGroups** - UoM conversions (Pcs ↔ Case)
3. **ItemWarehouseInfoCollection** - Stock levels per warehouse
4. **BatchesInStock** (Custom Query) - Batch/serial numbers with quantities

**Why MasterItemType?**
- Frontend gets **one unified object** with all needed data
- **Automatic UoM conversions** (stock in Pcs AND Case)
- **Multiple barcodes** handled (Pcs barcode vs Case barcode)
- **Batch tracking** included for items that use batches
- **Fast responses** - everything pre-calculated and cached

**Example MasterItemType:**
```typescript
{
  itemCode: "ITEM001",
  itemName: "Widget Premium",
  
  // UoM Info
  inventoryUoM: "PCS",
  baseUoM: "PCS",
  alternateUoM: "CASE",
  baseQuantityPerAlternate: 12, // 12 Pcs per Case
  
  // Stock (auto-calculated for both UoMs)
  warehouseCode: "WH01",
  amountInStockInInventoryUoM: 144,
  amountInStockInBaseUoM: 144,      // In Pcs
  amountInStockInAlternateUoM: 12,  // In Cases (144/12)
  
  // Barcodes (with stock per barcode)
  primaryBarcode: "1234567890",
  barcodes: [
    { barcode: "1234567890", uomName: "PCS", quantityInStock: 144 },
    { barcode: "9876543210", uomName: "CASE", quantityInStock: 12 }
  ],
  
  // Batches
  batchesInStock: [
    { BatchNumber: "BATCH001", Quantity: 72, ExpiryDate: "2025-12-31" },
    { BatchNumber: "BATCH002", Quantity: 72, ExpiryDate: "2026-01-31" }
  ]
}
```

## Configuration

Required environment variables in `.env`:

```env
# SAP Service Layer URL (e.g., https://your-sap-server:50000/b1s/v1)
SAP_SERVICE_LAYER_URL=

# SAP Company Database name
SAP_COMPANY_DB=

# SAP Service account credentials
SAP_USERNAME=
SAP_PASSWORD=

# Default warehouse for caching (optional, defaults to WH01)
SAP_DEFAULT_WAREHOUSE=WH01
```

## Usage

### Master Items (Recommended - Use This!)

```typescript
import { getMasterItemService } from './sap/index.ts';

const masterItemService = getMasterItemService();

// Get all items for a warehouse (from cache)
const items = await masterItemService.getAllMasterItems('WH01');

// Get item by code
const item = await masterItemService.getMasterItemByCode('ITEM001', 'WH01');

// Get item by barcode (searches all barcodes)
const item = await masterItemService.getMasterItemByBarcode('1234567890', 'WH01');

// Search items
const results = await masterItemService.searchMasterItems('widget', 'WH01');
const items = await itemService.searchItems('widget', 20);

// Get stock level
const stock = await itemService.getItemStock('ITEM001', 'WH01');
```

### Inventory Submission

```typescript
import { InventoryService } from './sap/index.ts';

const inventoryService = new InventoryService();

// Submit physical count
const result = await inventoryService.submitInventoryCount(
  'WH01', // warehouse code
  [
    { itemCode: 'ITEM001', countedQuantity: 50 },
    { itemCode: 'ITEM002', countedQuantity: 100 },
  ],
  'SESSION-UUID', // reference
  'Counted by John Doe' // comments
);

console.log('SAP Document Number:', result.DocNum);
```

### Warehouses

```typescript
import { WarehouseService } from './sap/index.ts';

const warehouseService = new WarehouseService();

// Get all warehouses
const warehouses = await warehouseService.getAllWarehouses();

// Get specific warehouse
const warehouse = await warehouseService.getWarehouseByCode('WH01');
```

## Session Management

The SAP client automatically handles:
- Login on first request
- Session token storage
- Session expiry detection
- Automatic re-login when session expires
- Cookie-based authentication

## Error Handling

All SAP errors are caught and transformed into meaningful error messages:

```typescript
try {
  await itemService.getItemByCode('INVALID');
} catch (error) {
  console.error(error.message); // "SAP Error: Item not found"
}
```

## Key Features

✅ **Singleton Client** - One session shared across all services  
✅ **Automatic Authentication** - Login happens transparently  
✅ **Session Persistence** - Sessions maintained for 30 minutes  
✅ **Error Handling** - SAP errors extracted and formatted  
✅ **Type Safety** - Full TypeScript interfaces for all SAP entities  
✅ **Service Pattern** - Clean separation of concerns  

## Testing

Test SAP connectivity:

```bash
deno run --allow-net --allow-env test-sap-connection.ts
```

## SAP API Documentation

- [SAP Business One Service Layer API Reference](https://help.sap.com/doc/0d2533ad95ba4ad7a702e83570a21c32/10.0/en-US/Working_with_SAP_Business_One_Service_Layer.pdf)
- Key endpoints used:
  - `/Login` - Authentication
  - `/Items` - Product master data
  - `/Warehouses` - Warehouse master data
  - `/ItemWarehouseInfo` - Stock levels per warehouse
  - `/InventoryPostings` - Physical inventory counting documents
