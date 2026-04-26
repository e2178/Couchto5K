import type { Settings } from '../types';
import { createPersistedStore } from './createStore';

const DEFAULTS: Settings = {
  theme: 'dark',
  audioEnabled: true,
  audioVolume: 0.7,
  vibrationEnabled: true,
  units: 'km',
  autoLogEnabled: true,
  restDayReminders: false,
  restDayReminderTime: '18:00',
};

export const settingsStore = createPersistedStore<Settings>(
  'c25k.settings',
  DEFAULTS,
);

export const setSettings = (patch: Partial<Settings>): void => {
  settingsStore.set((prev) => ({ ...prev, ...patch }));
};
