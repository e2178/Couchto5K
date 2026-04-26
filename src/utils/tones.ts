import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import type { SegmentKind } from '../types';
import { settingsStore } from '../stores/settings';

const TONE_SOURCES = {
  run:      require('../../assets/tones/run.wav'),
  walk:     require('../../assets/tones/walk.wav'),
  complete: require('../../assets/tones/complete.wav'),
} as const;

type ToneKind = keyof typeof TONE_SOURCES;

let audioInitialized = false;

const ensureAudioMode = async () => {
  if (audioInitialized) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioInitialized = true;
  } catch {
    /* ignore */
  }
};

export const playTone = async (kind: ToneKind): Promise<void> => {
  const settings = settingsStore.get();
  if (!settings.audioEnabled) return;
  await ensureAudioMode();
  try {
    const { sound } = await Audio.Sound.createAsync(
      TONE_SOURCES[kind],
      { volume: Math.max(0, Math.min(1, settings.audioVolume)), shouldPlay: true },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => undefined);
      }
    });
  } catch {
    /* ignore audio errors silently */
  }
};

export const buzz = (intensity: 'light' | 'medium' | 'heavy' = 'medium'): void => {
  if (!settingsStore.get().vibrationEnabled) return;
  const map = {
    light:  Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy:  Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(map[intensity]).catch(() => undefined);
};

export const phaseStartCue = (kind: SegmentKind | 'done'): void => {
  if (kind === 'run') {
    playTone('run');
    buzz('heavy');
  } else if (kind === 'walk') {
    playTone('walk');
    buzz('medium');
  } else {
    playTone('complete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
  }
};
