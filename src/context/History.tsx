import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  addHistoryEntry,
  deleteHistoryEntry,
  loadHistory,
} from '../storage/history';
import { HistoryEntry } from '../types';

type Ctx = {
  history: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id'>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
};

const HistoryContext = createContext<Ctx | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<HistoryEntry, 'id'>) => {
      const next = await addHistoryEntry(entry);
      setHistory(next);
    },
    []
  );

  const removeEntry = useCallback(async (id: string) => {
    const next = await deleteHistoryEntry(id);
    setHistory(next);
  }, []);

  const value = useMemo(
    () => ({ history, addEntry, removeEntry }),
    [history, addEntry, removeEntry]
  );

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export function useHistory(): Ctx {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used inside HistoryProvider');
  return ctx;
}
