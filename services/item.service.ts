import api from './api';

export interface MasterItemBarCode {
  barCode: string;
  uomType: string;
  uomEntry?: number;
  alternateUoM?: string;
  alternateQuantity?: number;
  baseQuantity?: number;
  quantityInStock: number;
}

export interface MasterItemBatch {
  batchNumber: string;
  quantity: number;
  expiryDate?: string;
  manufacturingDate?: string;
}

export interface MasterItem {
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

export const itemService = {
  /**
   * Get item by barcode
   */
  async getItemByBarcode(barcode: string, warehouseCode: string = '01'): Promise<MasterItem | null> {
    try {
      const response = await api.get(`/items/barcode/${barcode}`, {
        params: { warehouseCode },
      });
      return response.data.item;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get item by item code
   */
  async getItemByCode(itemCode: string, warehouseCode: string = '01'): Promise<MasterItem | null> {
    try {
      const response = await api.get(`/items/${itemCode}`, {
        params: { warehouseCode },
      });
      return response.data.item;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Search items
   */
  async searchItems(query: string, warehouseCode: string = '01'): Promise<MasterItem[]> {
    const response = await api.get('/items/search', {
      params: { q: query, warehouseCode },
    });
    return response.data.items || [];
  },

  /**
   * Get all items for a warehouse
   */
  async getAllItems(warehouseCode: string = '01'): Promise<MasterItem[]> {
    const response = await api.get('/items', {
      params: { warehouseCode },
    });
    return response.data.items || [];
  },
};
