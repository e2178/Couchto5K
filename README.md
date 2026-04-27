# Couchto5K

An Expo / React Native Couch to 5K trainer. Walks you through the standard
9-week C25K program — run/walk intervals at the right ratio for each session —
with audio cues at every phase change, history tracking, and configurable
settings.

## Run on Expo Go

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on iOS/Android. Requires Expo Go for SDK 54.

If your phone isn't on the same Wi-Fi:

```bash
npx expo start --tunnel
```

## App structure

Four screens behind a bottom tab bar (with a gear icon in the header):

- **Program** — 9-week plan grouped into 3 phases. Tap a week to expand;
  tap a day's *Start* to launch that session.
- **Workout** — auto-selects the next incomplete day. Phase pill,
  big timer, pulsing active segment in the progress bar, *Finish early*
  option that prompts for partial-distance logging.
- **History** — stats tiles (Runs / Avg pace / Total km), per-run rows
  with pace, plus *+ Log run manually*.
- **Settings** — theme, audio tones + volume, vibration, units (km/mi),
  auto-log toggle, rest-day reminder time, *Reset progress*, *Clear history*.

Progress and settings persist via `AsyncStorage`.

## Tech

- Expo SDK 54, React Native 0.81, TypeScript
- React Navigation (bottom tabs + native stack)
- expo-av for the bundled WAV tones (`assets/tones/{run,walk,complete}.wav`)
- expo-haptics for vibration
- AsyncStorage for persistence

## Source layout

```
App.tsx                  # boot: SafeAreaProvider + RootNavigator
src/
  theme.ts               # color / radii / spacing / typography tokens
  types.ts               # Segment, Day, Week, Phase, Run, Settings
  data/program.ts        # the 9-week C25K plan
  stores/
    createStore.ts       # tiny useSyncExternalStore + AsyncStorage helper
    settings.ts
    completion.ts
    history.ts
    program.ts           # findNextSession, weekStatus, useCompletionVersion
  utils/
    time.ts              # formatTime, relativeDate
    pace.ts              # computePace, formatPace, distance helpers
    tones.ts             # playTone + buzz + phaseStartCue (expo-av/haptics)
  components/
    Button.tsx           # primary / ghost / secondary / quiet / danger
    SegmentBar.tsx       # proportional run/walk bar with pulsing active seg
    Toggle.tsx
    Segmented.tsx
    Icons.tsx            # unicode glyph "icons"
    ConfirmModal.tsx
    LogRunModal.tsx      # post-workout auto-log
    ManualLogModal.tsx   # history's manual log entry
  screens/
    ProgramScreen.tsx
    WorkoutScreen.tsx    # timer state machine + finish-early flow
    HistoryScreen.tsx
    SettingsScreen.tsx
  navigation/
    RootNavigator.tsx    # tabs + Settings stack
assets/
  tones/{run,walk,complete}.wav    # generated short PCM tones
web/                     # the original vanilla web prototype, preserved
```

## Regenerating the tone WAV files

The three short tones are generated with a Node script (no external
dependencies). To regenerate:

```bash
node -e "
const fs = require('fs');
function tone(notes) {
  const sr = 22050;
  const total = notes.reduce((s, n) => s + n.dur + (n.gap || 0), 0);
  const samples = Math.floor(sr * total);
  const data = Buffer.alloc(samples * 2);
  let cursor = 0;
  for (const n of notes) {
    const noteSamples = Math.floor(sr * n.dur);
    const fade = Math.min(0.015, n.dur / 4);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sr;
      let amp = 0.55;
      if (t < fade) amp *= t / fade;
      const tail = n.dur - t;
      if (tail < fade) amp *= Math.max(0, tail / fade);
      const v = Math.sin(2 * Math.PI * n.f * t) * amp;
      const s = Math.max(-32768, Math.min(32767, Math.round(v * 0x7fff)));
      data.writeInt16LE(s, (cursor + i) * 2);
    }
    cursor += noteSamples + Math.floor(sr * (n.gap || 0));
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8); header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(sr, 24);
  header.writeUInt32LE(sr * 2, 28); header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34); header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
fs.writeFileSync('assets/tones/run.wav',
  tone([{ f: 880, dur: 0.18, gap: 0.04 }, { f: 1175, dur: 0.22 }]));
fs.writeFileSync('assets/tones/walk.wav', tone([{ f: 523, dur: 0.32 }]));
fs.writeFileSync('assets/tones/complete.wav',
  tone([{ f: 659, dur: 0.18, gap: 0.04 },
        { f: 784, dur: 0.18, gap: 0.04 },
        { f: 988, dur: 0.36 }]));
"
```

## Web prototype

The earlier vanilla HTML/CSS/JS prototype is preserved in `web/`. Open
`web/index.html` directly in any browser.
