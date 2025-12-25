import { db } from '../config/database.ts';

export interface CountingSession {
  id: string;
  user_id: string;
  warehouse_code: string;
  status: 'active' | 'paused' | 'completed' | 'submitted';
  session_reference?: string;
  sap_doc_entry?: number;
  sap_doc_num?: number;
  started_at: Date;
  paused_at?: Date;
  completed_at?: Date;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CountedItem {
  id: string;
  session_id: string;
  item_code: string;
  counted_quantity: number;
  counted_uom: string;
  warehouse_code: string;
  counted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CountedBatch {
  id: string;
  counted_item_id: string;
  batch_number: string;
  counted_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CountingSessionWithItems extends CountingSession {
  items: (CountedItem & { batches?: CountedBatch[] })[];
}

export class CountingSessionModel {
  /**
   * Create a new counting session
   */
  async create(userId: string, warehouseCode: string): Promise<CountingSession> {
    const [session] = await db('counting_sessions')
      .insert({
        user_id: userId,
        warehouse_code: warehouseCode,
        status: 'active',
      })
      .returning('*');
    return session;
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<CountingSession | undefined> {
    return await db('counting_sessions').where({ id }).first();
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: string, status?: string): Promise<CountingSession[]> {
    const query = db('counting_sessions').where({ user_id: userId });
    
    if (status) {
      query.where({ status });
    }
    
    return await query.orderBy('started_at', 'desc');
  }

  /**
   * Get session with all items and batches
   */
  async findByIdWithItems(id: string): Promise<CountingSessionWithItems | undefined> {
    const session = await this.findById(id);
    if (!session) return undefined;

    const items = await db('counted_items')
      .where({ session_id: id })
      .orderBy('counted_at', 'asc');

    // Get batches for each item
    const itemsWithBatches = await Promise.all(
      items.map(async (item) => {
        const batches = await db('counted_batches')
          .where({ counted_item_id: item.id })
          .orderBy('batch_number', 'asc');
        return { ...item, batches };
      })
    );

    return {
      ...session,
      items: itemsWithBatches,
    };
  }

  /**
   * Update session status
   */
  async updateStatus(
    id: string,
    status: 'active' | 'paused' | 'completed' | 'submitted',
    additionalData?: Partial<CountingSession>
  ): Promise<CountingSession | undefined> {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date(),
    };

    // Set timestamps based on status
    if (status === 'paused' && !additionalData?.paused_at) {
      updateData.paused_at = new Date();
    } else if (status === 'active') {
      updateData.paused_at = null; // Clear pause time when resuming
    } else if (status === 'completed' && !additionalData?.completed_at) {
      updateData.completed_at = new Date();
    } else if (status === 'submitted' && !additionalData?.submitted_at) {
      updateData.submitted_at = new Date();
    }

    // Merge additional data
    Object.assign(updateData, additionalData);

    const [session] = await db('counting_sessions')
      .where({ id })
      .update(updateData)
      .returning('*');

    return session;
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await db('counting_sessions').where({ id }).delete();
    return deleted > 0;
  }

  /**
   * Add item to session
   */
  async addItem(
    sessionId: string,
    itemCode: string,
    countedQuantity: number,
    countedUom: string,
    warehouseCode: string
  ): Promise<CountedItem> {
    const [item] = await db('counted_items')
      .insert({
        session_id: sessionId,
        item_code: itemCode,
        counted_quantity: countedQuantity,
        counted_uom: countedUom,
        warehouse_code: warehouseCode,
      })
      .returning('*');
    return item;
  }

  /**
   * Update counted item
   */
  async updateItem(
    itemId: string,
    countedQuantity: number
  ): Promise<CountedItem | undefined> {
    const [item] = await db('counted_items')
      .where({ id: itemId })
      .update({
        counted_quantity: countedQuantity,
        updated_at: new Date(),
      })
      .returning('*');
    return item;
  }

  /**
   * Delete item from session
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const deleted = await db('counted_items').where({ id: itemId }).delete();
    return deleted > 0;
  }

  /**
   * Add batch to counted item
   */
  async addBatch(
    countedItemId: string,
    batchNumber: string,
    countedQuantity: number
  ): Promise<CountedBatch> {
    const [batch] = await db('counted_batches')
      .insert({
        counted_item_id: countedItemId,
        batch_number: batchNumber,
        counted_quantity: countedQuantity,
      })
      .returning('*');
    return batch;
  }

  /**
   * Update batch quantity
   */
  async updateBatch(
    batchId: string,
    countedQuantity: number
  ): Promise<CountedBatch | undefined> {
    const [batch] = await db('counted_batches')
      .where({ id: batchId })
      .update({
        counted_quantity: countedQuantity,
        updated_at: new Date(),
      })
      .returning('*');
    return batch;
  }

  /**
   * Delete batch
   */
  async deleteBatch(batchId: string): Promise<boolean> {
    const deleted = await db('counted_batches').where({ id: batchId }).delete();
    return deleted > 0;
  }

  /**
   * Get batches for counted item
   */
  async getBatchesByItemId(countedItemId: string): Promise<CountedBatch[]> {
    return await db('counted_batches')
      .where({ counted_item_id: countedItemId })
      .orderBy('batch_number', 'asc');
  }
}

// Singleton instance
let countingSessionModelInstance: CountingSessionModel | null = null;

export function getCountingSessionModel(): CountingSessionModel {
  if (!countingSessionModelInstance) {
    countingSessionModelInstance = new CountingSessionModel();
  }
  return countingSessionModelInstance;
}
