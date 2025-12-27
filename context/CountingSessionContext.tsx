import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CountedItem, CountingSession, countingSessionService } from '../services/counting-session.service';

interface CountingSessionContextType {
  currentSession: CountingSession | null;
  sessions: CountingSession[];
  isLoading: boolean;
  error: string | null;
  
  // Session management
  createSession: (warehouseCode: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  loadAllSessions: (status?: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Item management
  addItem: (itemCode: string, quantity: number, uom: string, location?: string, batches?: { batchNumber: string; countedQuantity: number }[]) => Promise<void>;
  updateItem: (itemId: string, quantity: number, batches?: { batchNumber: string; countedQuantity: number }[]) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  
  // Submission
  submitSession: (countedBy: string) => Promise<void>;
  
  // Clear current session
  clearSession: () => void;
}

const CountingSessionContext = createContext<CountingSessionContextType | undefined>(undefined);

export const useCountingSession = () => {
  const context = useContext(CountingSessionContext);
  if (!context) {
    throw new Error('useCountingSession must be used within CountingSessionProvider');
  }
  return context;
};

interface CountingSessionProviderProps {
  children: ReactNode;
}

export const CountingSessionProvider: React.FC<CountingSessionProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<CountingSession | null>(null);
  const [sessions, setSessions] = useState<CountingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (warehouseCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await countingSessionService.createSession(warehouseCode);
      setCurrentSession(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await countingSessionService.getSession(sessionId);
      setCurrentSession(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllSessions = useCallback(async (status?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const allSessions = await countingSessionService.listSessions(status);
      setSessions(allSessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pauseSession = useCallback(async () => {
    if (!currentSession) {
      throw new Error('No active session');
    }
    try {
      setIsLoading(true);
      setError(null);
      const updated = await countingSessionService.updateSessionStatus(currentSession.id, 'paused');
      setCurrentSession(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const resumeSession = useCallback(async () => {
    if (!currentSession) {
      throw new Error('No active session');
    }
    try {
      setIsLoading(true);
      setError(null);
      const updated = await countingSessionService.updateSessionStatus(currentSession.id, 'active');
      setCurrentSession(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await countingSessionService.deleteSession(sessionId);
      
      // If deleted session is current, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      
      // Remove from sessions list
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const addItem = useCallback(async (
    itemCode: string,
    quantity: number,
    uom: string,
    location?: string,
    batches?: { batchNumber: string; countedQuantity: number }[]
  ) => {
    if (!currentSession) {
      throw new Error('No active session');
    }
    try {
      setIsLoading(true);
      setError(null);
      const item = await countingSessionService.addItem(
        currentSession.id,
        itemCode,
        quantity,
        uom,
        location,
        batches
      );
      
      // Update current session with new item
      setCurrentSession((prev: CountingSession | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: [...(prev.items || []), item],
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const updateItem = useCallback(async (
    itemId: string,
    quantity: number,
    batches?: { batchNumber: string; countedQuantity: number }[]
  ) => {
    if (!currentSession) {
      throw new Error('No active session');
    }
    try {
      setIsLoading(true);
      setError(null);
      const item = await countingSessionService.updateItem(
        currentSession.id,
        itemId,
        quantity,
        batches
      );
      
      // Update current session with updated item
      setCurrentSession((prev: CountingSession | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items?.map((i: CountedItem) => i.id === itemId ? item : i),
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!currentSession) {
      throw new Error('No active session');
    }
    try {
      setIsLoading(true);
      setError(null);
      await countingSessionService.removeItem(currentSession.id, itemId);
      
      // Remove item from current session
      setCurrentSession((prev: CountingSession | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items?.filter((i: CountedItem) => i.id !== itemId),
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const submitSession = useCallback(async (countedBy: string) => {
    if (!currentSession) {
      throw new Error('No active session');
    }
    try {
      setIsLoading(true);
      setError(null);
      await countingSessionService.submitSession(currentSession.id, countedBy);
      
      // Reload session to get updated status
      const updated = await countingSessionService.getSession(currentSession.id);
      setCurrentSession(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError(null);
  }, []);

  const value: CountingSessionContextType = {
    currentSession,
    sessions,
    isLoading,
    error,
    createSession,
    loadSession,
    loadAllSessions,
    pauseSession,
    resumeSession,
    deleteSession,
    addItem,
    updateItem,
    removeItem,
    submitSession,
    clearSession,
  };

  return (
    <CountingSessionContext.Provider value={value}>
      {children}
    </CountingSessionContext.Provider>
  );
};
