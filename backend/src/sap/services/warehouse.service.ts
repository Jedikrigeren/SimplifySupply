import { getSAPClient } from '../client.ts';
import type { SAPWarehouse, SAPResponse } from '../types.ts';

// Fields to retrieve from SAP for warehouses
const SELECT_FIELDS = [
  'WarehouseCode',
  'WarehouseName',
];

/**
 * Service for SAP Warehouse operations
 */
export class WarehouseService {
  private client = getSAPClient();

  /**
   * Get all active warehouses
   */
  async getAllWarehouses(): Promise<SAPWarehouse[]> {
    try {
      const params = {
        $filter: "Inactive eq 'N'",
        $select: SELECT_FIELDS.join(','),
      };
      
      const response = await this.client.get<SAPResponse<SAPWarehouse>>(
        '/Warehouses',
        params
      );
      
      return response.value || [];
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      return [];
    }
  }

  /**
   * Get warehouse by code
   */
  async getWarehouseByCode(warehouseCode: string): Promise<SAPWarehouse | null> {
    try {
      const warehouse = await this.client.get<SAPWarehouse>(
        `/Warehouses('${warehouseCode}')`
      );
      
      return warehouse;
    } catch (error) {
      console.error(`Failed to fetch warehouse ${warehouseCode}:`, error);
      return null;
    }
  }
}
