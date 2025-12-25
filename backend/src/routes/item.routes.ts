import { Hono } from '@hono/hono';
import { getMasterItemService } from '../sap/index.ts';

export const itemRoutes = new Hono();

/**
 * GET /api/items
 * Get all master items for a warehouse
 * Query params: warehouseCode (optional, defaults to '01')
 */
itemRoutes.get('/', (c) => {
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
 * GET /api/items/search
 * Search master items by name or code
 * Query params: 
 *   - q: search query (required)
 *   - warehouseCode: warehouse (optional, defaults to '01')
 */
itemRoutes.get('/search', (c) => {
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
 * GET /api/items/barcode/:barcode
 * Get a master item by barcode
 * Query params: warehouseCode (optional, defaults to '01')
 */
itemRoutes.get('/barcode/:barcode', (c) => {
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
 * GET /api/items/:itemCode
 * Get a specific master item by item code
 * Query params: warehouseCode (optional, defaults to '01')
 */
itemRoutes.get('/:itemCode', (c) => {
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
 * GET /api/items/cache/status
 * Get cache status information
 */
itemRoutes.get('/cache/status', async (c) => {
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
 * POST /api/items/cache/refresh
 * Manually trigger cache refresh for a warehouse
 * Body: { warehouseCode: string }
 */
itemRoutes.post('/cache/refresh', async (c) => {
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
