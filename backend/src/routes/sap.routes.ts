import { Hono } from '@hono/hono';
import { getInventoryCountingService, getMasterItemService } from '../sap/index.ts';
import type { CountedItem } from '../sap/types.ts';

export const sapRoutes = new Hono();

/**
 * GET /api/sap/master-items
 * Get all master items for a warehouse
 * Query params: warehouseCode (optional, defaults to '01')
 */
sapRoutes.get('/master-items', (c) => {
  try {
    const warehouseCode = c.req.query('warehouseCode') || '01';
    
    const masterItemService = getMasterItemService();
    const items = masterItemService.getAllMasterItems(warehouseCode);
    
    return c.json({
      success: true,
      warehouseCode,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Error fetching master items:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/sap/master-items/:itemCode
 * Get a specific master item by item code
 * Query params: warehouseCode (optional, defaults to '01')
 */
sapRoutes.get('/master-items/:itemCode', (c) => {
  try {
    const itemCode = c.req.param('itemCode');
    const warehouseCode = c.req.query('warehouseCode') || '01';
    
    const masterItemService = getMasterItemService();
    const item = masterItemService.getMasterItemByCode(itemCode, warehouseCode);
    
    if (!item) {
      return c.json({
        success: false,
        error: 'Item not found',
      }, 404);
    }
    
    return c.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error fetching master item:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/sap/master-items/barcode/:barcode
 * Get a master item by barcode
 * Query params: warehouseCode (optional, defaults to '01')
 */
sapRoutes.get('/master-items/barcode/:barcode', (c) => {
  try {
    const barcode = c.req.param('barcode');
    const warehouseCode = c.req.query('warehouseCode') || '01';
    
    const masterItemService = getMasterItemService();
    const item = masterItemService.getMasterItemByBarcode(barcode, warehouseCode);
    
    if (!item) {
      return c.json({
        success: false,
        error: 'Item not found',
      }, 404);
    }
    
    return c.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error fetching master item by barcode:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/sap/master-items/search
 * Search master items by name or code
 * Query params: 
 *   - q: search query (required)
 *   - warehouseCode: warehouse (optional, defaults to '01')
 */
sapRoutes.get('/master-items/search', (c) => {
  try {
    const query = c.req.query('q');
    const warehouseCode = c.req.query('warehouseCode') || '01';
    
    if (!query) {
      return c.json({
        success: false,
        error: 'Query parameter "q" is required',
      }, 400);
    }
    
    const masterItemService = getMasterItemService();
    const items = masterItemService.searchMasterItems(query, warehouseCode);
    
    return c.json({
      success: true,
      query,
      warehouseCode,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Error searching master items:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/sap/cache/status
 * Get cache status information
 */
sapRoutes.get('/cache/status', async (c) => {
  try {
    const { getCacheService } = await import('../sap/index.ts');
    const cache = getCacheService();
    const stats = cache.getStats();
    
    return c.json({
      success: true,
      cache: {
        size: stats.size,
        keys: stats.keys,
      },
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/sap/cache/refresh
 * Manually trigger cache refresh for a warehouse
 * Body: { warehouseCode: string }
 */
sapRoutes.post('/cache/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const warehouseCode = body.warehouseCode || '01';
    
    const { getCacheService } = await import('../sap/index.ts');
    const cache = getCacheService();
    
    // Trigger refresh
    await cache.triggerRefresh(`sap:master-items:refresh:${warehouseCode}`);
    
    return c.json({
      success: true,
      message: `Cache refresh triggered for warehouse ${warehouseCode}`,
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/sap/inventory-counting/prepare
 * Prepare inventory posting document (validate without posting)
 * Body: { countedItems: CountedItem[], countedBy: string, sessionId?: string }
 */
sapRoutes.post('/inventory-counting/prepare', async (c) => {
  try {
    const body = await c.req.json();
    const { countedItems, countedBy, sessionId } = body;

    if (!countedItems || !Array.isArray(countedItems) || countedItems.length === 0) {
      return c.json({
        success: false,
        error: 'countedItems array is required',
      }, 400);
    }

    if (!countedBy || typeof countedBy !== 'string') {
      return c.json({
        success: false,
        error: 'countedBy (string) is required',
      }, 400);
    }

    const inventoryService = getInventoryCountingService();
    const posting = await inventoryService.prepareInventoryPosting(
      countedItems as CountedItem[],
      countedBy,
      sessionId
    );

    return c.json({
      success: true,
      posting,
    });
  } catch (error) {
    console.error('Error preparing inventory posting:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/sap/inventory-counting/post
 * Count and post inventory to SAP
 * Body: { countedItems: CountedItem[], countedBy: string, sessionId?: string }
 */
sapRoutes.post('/inventory-counting/post', async (c) => {
  try {
    const body = await c.req.json();
    const { countedItems, countedBy, sessionId } = body;

    if (!countedItems || !Array.isArray(countedItems) || countedItems.length === 0) {
      return c.json({
        success: false,
        error: 'countedItems array is required',
      }, 400);
    }

    if (!countedBy || typeof countedBy !== 'string') {
      return c.json({
        success: false,
        error: 'countedBy (string) is required',
      }, 400);
    }

    const inventoryService = getInventoryCountingService();
    const response = await inventoryService.countAndPost(
      countedItems as CountedItem[],
      countedBy,
      sessionId
    );

    return c.json({
      success: true,
      docEntry: response.DocEntry,
      docNum: response.DocNum,
      postingDate: response.PostingDate,
    });
  } catch (error) {
    console.error('Error posting inventory counting:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});
