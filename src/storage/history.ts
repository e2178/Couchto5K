import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryEntry } from '../types';

const KEY = '@couchto5k/history';

export async function loadHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as HistoryEntry[];
    return list.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  } catch {
    return [];
  }
}

export async function addHistoryEntry(
  entry: Omit<HistoryEntry, 'id'>
): Promise<HistoryEntry[]> {
  const list = await loadHistory();
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const next = [...list, { ...entry, id }];
  next.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function deleteHistoryEntry(id: string): Promise<HistoryEntry[]> {
  const list = await loadHistory();
  const next = list.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function paceMinPerKm(entry: HistoryEntry): number | null {
  if (entry.distanceKm <= 0) return null;
  return entry.durationSeconds / 60 / entry.distanceKm;
}

export function formatPace(minPerKm: number | null): string {
  if (minPerKm == null || !isFinite(minPerKm)) return '—';
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
}
