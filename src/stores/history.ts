import type { Run } from '../types';
import { createPersistedStore } from './createStore';

export const historyStore = createPersistedStore<Run[]>(
  'c25k.history',
  [],
  (defaults, loaded) => (Array.isArray(loaded) ? (loaded as Run[]) : defaults),
);

export const addRun = (run: Run): void => {
  historyStore.set((prev) => [run, ...prev]);
};

export const clearHistory = (): void => {
  historyStore.set([]);
};
