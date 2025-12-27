import apiClient from './api';

export interface CountedBatch {
  id?: string;
  counted_item_id?: string;
  batchNumber: string;
  countedQuantity: number;
  batch_number?: string;
  counted_quantity?: number;
}

export interface CountedItem {
  id: string;
  session_id: string;
  item_code: string;
  counted_quantity: number;
  counted_uom: string;
  warehouse_code: string;
  location?: string;
  counted_at: string;
  batches?: CountedBatch[];
}

export interface CountingSession {
  id: string;
  user_id: string;
  warehouse_code: string;
  status: 'active' | 'paused' | 'completed' | 'submitted';
  started_at: string;
  paused_at?: string;
  completed_at?: string;
  submitted_at?: string;
  session_reference?: string;
  sap_doc_entry?: number;
  sap_doc_num?: number;
  items?: CountedItem[];
}

interface CreateSessionResponse {
  success: boolean;
  session: CountingSession;
}

interface GetSessionResponse {
  success: boolean;
  session: CountingSession;
}

interface ListSessionsResponse {
  success: boolean;
  count: number;
  sessions: CountingSession[];
}

interface UpdateSessionResponse {
  success: boolean;
  session: CountingSession;
}

interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

interface AddItemResponse {
  success: boolean;
  item: CountedItem;
}

interface UpdateItemResponse {
  success: boolean;
  item: CountedItem;
}

interface RemoveItemResponse {
  success: boolean;
  message: string;
}

interface SubmitSessionResponse {
  success: boolean;
  docEntry: number;
  docNum: number;
  postingDate: string;
}

class CountingSessionService {
  /**
   * Create a new counting session
   */
  async createSession(warehouseCode: string): Promise<CountingSession> {
    const response = await apiClient.post<CreateSessionResponse>('/counting-sessions', {
      warehouseCode,
    });
    return response.data.session;
  }

  /**
   * Get a specific session with all items and batches
   */
  async getSession(sessionId: string): Promise<CountingSession> {
    const response = await apiClient.get<GetSessionResponse>(`/counting-sessions/${sessionId}`);
    return response.data.session;
  }

  /**
   * List all sessions for the current user
   */
  async listSessions(status?: string): Promise<CountingSession[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<ListSessionsResponse>('/counting-sessions', { params });
    return response.data.sessions;
  }

  /**
   * Update session status (pause, resume, complete)
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<CountingSession> {
    const response = await apiClient.patch<UpdateSessionResponse>(`/counting-sessions/${sessionId}`, {
      status,
    });
    return response.data.session;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete<DeleteSessionResponse>(`/counting-sessions/${sessionId}`);
  }

  /**
   * Add an item to the session
   */
  async addItem(
    sessionId: string,
    itemCode: string,
    countedQuantity: number,
    countedUom: string,
    location?: string,
    batches?: { batchNumber: string; countedQuantity: number }[]
  ): Promise<CountedItem> {
    const response = await apiClient.post<AddItemResponse>(`/counting-sessions/${sessionId}/items`, {
      itemCode,
      countedQuantity,
      countedUom,
      location,
      batches,
    });
    return response.data.item;
  }

  /**
   * Update an item in the session
   */
  async updateItem(
    sessionId: string,
    itemId: string,
    countedQuantity: number,
    batches?: { batchNumber: string; countedQuantity: number }[]
  ): Promise<CountedItem> {
    const response = await apiClient.put<UpdateItemResponse>(
      `/counting-sessions/${sessionId}/items/${itemId}`,
      {
        countedQuantity,
        batches,
      }
    );
    return response.data.item;
  }

  /**
   * Remove an item from the session
   */
  async removeItem(sessionId: string, itemId: string): Promise<void> {
    await apiClient.delete<RemoveItemResponse>(`/counting-sessions/${sessionId}/items/${itemId}`);
  }

  /**
   * Submit the session to SAP
   */
  async submitSession(sessionId: string, countedBy: string): Promise<SubmitSessionResponse> {
    const response = await apiClient.post<SubmitSessionResponse>(
      `/counting-sessions/${sessionId}/submit`,
      {
        countedBy,
      }
    );
    return response.data;
  }
}

export const countingSessionService = new CountingSessionService();
