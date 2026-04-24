import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CompletionSet,
  loadCompletion,
  saveCompletion,
  toggleRunComplete,
} from '../storage/completion';
import { runId, RunId } from '../types';

type Ctx = {
  completion: CompletionSet;
  isRunComplete: (week: number, run: number) => boolean;
  toggle: (week: number, run: number) => Promise<void>;
  markComplete: (week: number, run: number) => Promise<void>;
};

const CompletionContext = createContext<Ctx | null>(null);

export function CompletionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [completion, setCompletion] = useState<CompletionSet>(new Set());

  useEffect(() => {
    loadCompletion().then(setCompletion);
  }, []);

  const isRunComplete = useCallback(
    (week: number, run: number) => completion.has(runId(week, run)),
    [completion]
  );

  const toggle = useCallback(
    async (week: number, run: number) => {
      const next = await toggleRunComplete(week, run, completion);
      setCompletion(next);
    },
    [completion]
  );

  const markComplete = useCallback(
    async (week: number, run: number) => {
      const id: RunId = runId(week, run);
      if (completion.has(id)) return;
      const next = new Set(completion);
      next.add(id);
      await saveCompletion(next);
      setCompletion(next);
    },
    [completion]
  );

  const value = useMemo(
    () => ({ completion, isRunComplete, toggle, markComplete }),
    [completion, isRunComplete, toggle, markComplete]
  );

  return (
    <CompletionContext.Provider value={value}>
      {children}
    </CompletionContext.Provider>
  );
}

export function useCompletion(): Ctx {
  const ctx = useContext(CompletionContext);
  if (!ctx)
    throw new Error('useCompletion must be used inside CompletionProvider');
  return ctx;
}
