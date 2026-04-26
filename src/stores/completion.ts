import { createPersistedStore } from './createStore';

type CompletionState = Record<string, true>;

export const completionStore = createPersistedStore<CompletionState>(
  'c25k.completion',
  {},
);

export const isDone = (id: string): boolean => !!completionStore.get()[id];

export const markDone = (id: string): void => {
  if (completionStore.get()[id]) return;
  completionStore.set((prev) => ({ ...prev, [id]: true }));
};

export const resetCompletion = (): void => {
  completionStore.set({});
};
