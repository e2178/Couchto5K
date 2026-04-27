import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import type { SegmentKind } from '../types';
import { settings } from '../store';

const TONE_SOURCES = {
  run:      require('../../assets/tones/run.wav'),
  walk:     require('../../assets/tones/walk.wav'),
  complete: require('../../assets/tones/complete.wav'),
} as const;

type ToneKind = keyof typeof TONE_SOURCES;

const players: Partial<Record<ToneKind, AudioPlayer>> = {};
let audioModeInitialized = false;

const ensureAudioMode = async () => {
  if (audioModeInitialized) return;
  audioModeInitialized = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      shouldRouteThroughEarpiece: false,
      allowsRecording: false,
    } as Parameters<typeof setAudioModeAsync>[0]);
  } catch {
    /* non-fatal */
  }
};

const getPlayer = (kind: ToneKind): AudioPlayer => {
  let p = players[kind];
  if (!p) {
    p = createAudioPlayer(TONE_SOURCES[kind]);
    players[kind] = p;
  }
  return p;
};

export const playTone = async (kind: ToneKind): Promise<void> => {
  const s = settings.get();
  if (!s.audioEnabled) return;
  await ensureAudioMode();
  try {
    const player = getPlayer(kind);
    player.volume = Math.max(0, Math.min(1, s.audioVolume));
    await player.seekTo(0);
    player.play();
  } catch {
    /* ignore audio errors */
  }
};

export const phaseStartCue = (kind: SegmentKind | 'done'): void => {
  const vibrationOn = settings.get().vibrationEnabled;
  if (kind === 'run') {
    playTone('run');
    if (vibrationOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }
  } else if (kind === 'walk') {
    playTone('walk');
    if (vibrationOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
  } else {
    playTone('complete');
    if (vibrationOn) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
  }
};
