import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import type { SegmentKind } from '../types';
import { settings } from '../store';

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
  const s = settings.get();
  if (!s.audioEnabled) return;
  await ensureAudioMode();
  try {
    const { sound } = await Audio.Sound.createAsync(TONE_SOURCES[kind], {
      volume: Math.max(0, Math.min(1, s.audioVolume)),
      shouldPlay: true,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => undefined);
      }
    });
  } catch {
    /* ignore audio errors silently */
  }
};

export const phaseStartCue = (kind: SegmentKind | 'done'): void => {
  if (kind === 'run') {
    playTone('run');
    if (settings.get().vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }
  } else if (kind === 'walk') {
    playTone('walk');
    if (settings.get().vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
  } else {
    playTone('complete');
    if (settings.get().vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
  }
};
