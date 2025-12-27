import type { Context } from '@hono/hono';
import { Hono } from '@hono/hono';
import { authMiddleware } from '../middleware/auth.ts';
import { getCountingSessionModel } from '../models/CountingSession.ts';
import { getInventoryCountingService } from '../sap/index.ts';
import type { CountedItem as SAPCountedItem } from '../sap/types.ts';

export const countingRoutes = new Hono();

// Apply auth middleware to all routes
countingRoutes.use('/*', authMiddleware);

/**
 * POST /api/counting-sessions
 * Create a new counting session
 * Body: { warehouseCode: string }
 */
countingRoutes.post('/', async (c: Context) => {
  try {
    const body = await c.req.json();
    const { warehouseCode } = body;
    const userId = c.get('user').userId;

    if (!warehouseCode) {
      return c.json({ success: false, error: 'warehouseCode is required' }, 400);
    }

    const model = getCountingSessionModel();
    const session = await model.create(userId, warehouseCode);

    return c.json({
      success: true,
      session,
    }, 201);
  } catch (error) {
    console.error('Error creating counting session:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/counting-sessions
 * List all counting sessions for the current user
 * Query params: status (optional) - filter by status
 */
countingRoutes.get('/', async (c: Context) => {
  try {
    const userId = c.get('user').userId;
    const status = c.req.query('status');

    const model = getCountingSessionModel();
    const sessions = await model.findByUserId(userId, status);

    return c.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('Error fetching counting sessions:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/counting-sessions/:id
 * Get a specific counting session with all items and batches
 */
countingRoutes.get('/:id', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('user').userId;

    const model = getCountingSessionModel();
    const session = await model.findByIdWithItems(sessionId);

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    // Verify ownership
    if (session.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    return c.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching counting session:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * PATCH /api/counting-sessions/:id
 * Update counting session status (pause/resume/complete)
 * Body: { status: 'active' | 'paused' | 'completed' }
 */
countingRoutes.patch('/:id', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('user').userId;
    const body = await c.req.json();
    const { status } = body;

    if (!status || !['active', 'paused', 'completed'].includes(status)) {
      return c.json({
        success: false,
        error: 'Valid status is required (active, paused, completed)',
      }, 400);
    }

    const model = getCountingSessionModel();
    
    // Verify ownership
    const existingSession = await model.findById(sessionId);
    if (!existingSession) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (existingSession.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const session = await model.updateStatus(sessionId, status);

    return c.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error updating counting session:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * DELETE /api/counting-sessions/:id
 * Delete a counting session
 */
countingRoutes.delete('/:id', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('user').userId;

    const model = getCountingSessionModel();
    
    // Verify ownership
    const session = await model.findById(sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (session.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    await model.delete(sessionId);

    return c.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('Error deleting counting session:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/counting-sessions/:id/items
 * Add a counted item to the session
 * Body: { itemCode, countedQuantity, countedUom, batches?: CountedBatch[] }
 */
countingRoutes.post('/:id/items', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('user').userId;
    const body = await c.req.json();
    const { itemCode, countedQuantity, countedUom, location, batches } = body;

    if (!itemCode || !countedQuantity || !countedUom) {
      return c.json({
        success: false,
        error: 'itemCode, countedQuantity, and countedUom are required',
      }, 400);
    }

    const model = getCountingSessionModel();
    
    // Verify ownership and session is active
    const session = await model.findById(sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (session.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }
    if (session.status !== 'active') {
      return c.json({
        success: false,
        error: 'Session must be active to add items',
      }, 400);
    }

    // Add the item
    const item = await model.addItem(
      sessionId,
      itemCode,
      countedQuantity,
      countedUom,
      session.warehouse_code,
      location
    );

    // Add batches if provided
    if (batches && Array.isArray(batches)) {
      for (const batch of batches) {
        await model.addBatch(item.id, batch.batchNumber, batch.countedQuantity);
      }
    }

    // Get item with batches
    const itemWithBatches = {
      ...item,
      batches: batches ? await model.getBatchesByItemId(item.id) : [],
    };

    return c.json({
      success: true,
      item: itemWithBatches,
    }, 201);
  } catch (error) {
    console.error('Error adding item to session:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * PUT /api/counting-sessions/:id/items/:itemId
 * Update a counted item
 * Body: { countedQuantity, batches?: CountedBatch[] }
 */
countingRoutes.put('/:id/items/:itemId', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const itemId = c.req.param('itemId');
    const userId = c.get('user').userId;
    const body = await c.req.json();
    const { countedQuantity, batches } = body;

    if (!countedQuantity) {
      return c.json({ success: false, error: 'countedQuantity is required' }, 400);
    }

    const model = getCountingSessionModel();
    
    // Verify ownership
    const session = await model.findById(sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (session.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    // Update item
    const item = await model.updateItem(itemId, countedQuantity);
    if (!item) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }

    // Update batches if provided
    if (batches && Array.isArray(batches)) {
      // Delete existing batches
      const existingBatches = await model.getBatchesByItemId(itemId);
      for (const batch of existingBatches) {
        await model.deleteBatch(batch.id);
      }

      // Add new batches
      for (const batch of batches) {
        await model.addBatch(itemId, batch.batchNumber, batch.countedQuantity);
      }
    }

    // Get item with batches
    const itemWithBatches = {
      ...item,
      batches: await model.getBatchesByItemId(itemId),
    };

    return c.json({
      success: true,
      item: itemWithBatches,
    });
  } catch (error) {
    console.error('Error updating item:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * DELETE /api/counting-sessions/:id/items/:itemId
 * Remove an item from the session
 */
countingRoutes.delete('/:id/items/:itemId', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const itemId = c.req.param('itemId');
    const userId = c.get('user').userId;

    const model = getCountingSessionModel();
    
    // Verify ownership
    const session = await model.findById(sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (session.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    await model.deleteItem(itemId);

    return c.json({
      success: true,
      message: 'Item removed',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/counting-sessions/:id/submit
 * Submit counting session to SAP
 * Body: { countedBy: string }
 */
countingRoutes.post('/:id/submit', async (c: Context) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.get('user').userId;
    const body = await c.req.json();
    const { countedBy } = body;

    if (!countedBy) {
      return c.json({ success: false, error: 'countedBy is required' }, 400);
    }

    const model = getCountingSessionModel();
    
    // Get session with items
    const session = await model.findByIdWithItems(sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }
    if (session.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }
    if (session.items.length === 0) {
      return c.json({ success: false, error: 'No items to submit' }, 400);
    }

    // Convert to SAP counted items format
    const countedItems: SAPCountedItem[] = session.items.map((item) => ({
      itemCode: item.item_code,
      countedQuantity: item.counted_quantity,
      countedUoM: item.counted_uom,
      warehouseCode: item.warehouse_code,
      batchCounts: item.batches?.map((batch) => ({
        batchNumber: batch.batch_number,
        countedQuantity: batch.counted_quantity,
      })),
    }));

    // Submit to SAP
    const inventoryService = getInventoryCountingService();
    const response = await inventoryService.countAndPost(
      countedItems,
      countedBy,
      sessionId
    );

    // Update session with SAP response
    await model.updateStatus(sessionId, 'submitted', {
      session_reference: sessionId,
      sap_doc_entry: response.DocEntry,
      sap_doc_num: response.DocNum,
      submitted_at: new Date(),
    });

    return c.json({
      success: true,
      docEntry: response.DocEntry,
      docNum: response.DocNum,
      postingDate: response.PostingDate,
    });
  } catch (error) {
    console.error('Error submitting counting session:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/counting-sessions/inventory-counting/prepare
 * Prepare inventory posting document (validate without posting)
 * Body: { countedItems: CountedItem[], countedBy: string, sessionId?: string }
 */
countingRoutes.post('/inventory-counting/prepare', async (c: Context) => {
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
      countedItems as SAPCountedItem[],
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
 * POST /api/counting-sessions/inventory-counting/post
 * Count and post inventory to SAP (standalone, without session)
 * Body: { countedItems: CountedItem[], countedBy: string, sessionId?: string }
 */
countingRoutes.post('/inventory-counting/post', async (c: Context) => {
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
      countedItems as SAPCountedItem[],
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
