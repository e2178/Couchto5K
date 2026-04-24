import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunId, runId } from '../types';

const KEY = '@couchto5k/completed-runs';

export type CompletionSet = Set<RunId>;

export async function loadCompletion(): Promise<CompletionSet> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return new Set();
  try {
    const ids = JSON.parse(raw) as RunId[];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function saveCompletion(set: CompletionSet): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(set)));
}

export async function toggleRunComplete(
  week: number,
  run: number,
  set: CompletionSet
): Promise<CompletionSet> {
  const id = runId(week, run);
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  await saveCompletion(next);
  return next;
}

export function isWeekComplete(
  week: number,
  totalRuns: number,
  set: CompletionSet
): boolean {
  for (let run = 1; run <= totalRuns; run += 1) {
    if (!set.has(runId(week, run))) return false;
  }
  return true;
}
