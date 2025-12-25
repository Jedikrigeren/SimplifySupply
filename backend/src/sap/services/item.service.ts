import { getSAPClient } from '../client.ts';
import type {
  SAPItem,
  SAPQueryParams
} from '../types.ts';

// Fields to retrieve from SAP for items
const SELECT_FIELDS = [
  'ItemCode',
  'ItemName',
  'InventoryUOM',
  'InventoryUoMEntry',
  'UoMGroupEntry',
  'Valid',
  'DefaultWarehouse',
  'U_CCF_Type',
  'ManageBatchNumbers',
  'ItemBarCodeCollection',
  'ItemWarehouseInfoCollection',
];

const FILTER_ACTIVE_ITEMS = ["Valid eq 'Y'"];
/**
 * Service for SAP Item operations (NO caching - raw data only)
 * MasterItemService handles caching of combined data
 */
export class ItemService {
  private client = getSAPClient();

  /**
   * Fetch all items from SAP (no cache)
   */
  async getAllItems(): Promise<SAPItem[]> {
    try {
      return await this.client.fetchAllSAPData<SAPItem>({
        endpoint: '/Items',
        selectFields: SELECT_FIELDS,
        filters: FILTER_ACTIVE_ITEMS,
        pageSize: 100,
      });
    } catch (error) {
      console.error('Failed to fetch items from SAP:', error);
      return [];
    }
  }

  /**
   * Get item by item code (no cache)
   */
  async getItemByCode(itemCode: string): Promise<SAPItem | null> {
    try {
      return await this.client.fetchSAPEntity<SAPItem>('/Items', itemCode);
    } catch (error) {
      console.error(`Failed to fetch item ${itemCode}:`, error);
      return null;
    }
  }

  /**
   * Search items by barcode (no cache)
   */
  async getItemByBarcode(barcode: string): Promise<SAPItem | null> {
    try {
      const params: SAPQueryParams = {
        $filter: `BarCode eq '${barcode}'`,
      };
      
      const response = await this.client.fetchSAPData<SAPItem>(
        '/Items',
        params
      );
      
      return response.value?.[0] || null;
    } catch (error) {
      console.error(`Failed to fetch item by barcode ${barcode}:`, error);
      return null;
    }
  }
}
