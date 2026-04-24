# Couch to 5K

A cross-platform Couch to 5K training app built with **React Native + Expo**.
Ships as a signed Android APK. Three tabs:

1. **Program** — the full 12-week plan, grouped by phase, with collapsible
   weeks, per-day completion checkboxes, and a tap-to-start button on every
   workout. Completed weeks are greyed out automatically.
2. **Workout** — big run/walk banner, phase countdown, total time,
   segment bar, and spoken + haptic cues at every transition. Distance-based
   runs (Weeks 10–12, day 3) switch to a stopwatch. After a session finishes,
   the day is marked complete and a log-run form is pre-filled.
3. **History** — every logged run (distance, time, auto-calculated pace,
   notes) with a pace-over-time chart. Manual entries supported too.

State persists locally via `AsyncStorage` — no account, no network.

## Project layout

```
App.tsx                       # NavigationContainer + bottom tabs
index.ts                      # Expo root component registration
app.json                      # Expo config (package id, icons, splash)
eas.json                      # EAS Build profiles (APK + AAB)
src/
├── data/plan.ts              # 12-week plan with typed segments
├── types.ts                  # Segment / Run / Week / HistoryEntry types
├── theme.ts                  # color tokens
├── lib/format.ts             # formatTime, formatDuration, formatDate
├── storage/
│   ├── completion.ts         # AsyncStorage for completed-day flags
│   └── history.ts            # AsyncStorage for run log
├── context/
│   ├── Completion.tsx        # completion provider/hook
│   ├── History.tsx           # history provider/hook
│   └── SelectedRun.tsx       # currently-selected run (Plan → Workout)
├── components/SegmentBar.tsx # horizontal proportional run/walk bar
└── screens/
    ├── PlanScreen.tsx
    ├── WorkoutScreen.tsx
    └── HistoryScreen.tsx
```

## Prerequisites

- **Node.js 20+** and **npm**
- An **Expo account** (free) — needed once for `eas login`
- **Expo CLI / EAS CLI**: `npm i -g eas-cli`
- For local APK builds: Android Studio + JDK 17 installed and on `PATH`

## Install

```bash
npm install
```

## Run in development

Start the Metro bundler:

```bash
npm start
```

Then:
- Install the **Expo Go** app on your Android/iOS device and scan the QR code.
- Or press `a` in the terminal to launch on an Android emulator, `i` for iOS simulator.

Because the app uses `expo-speech`, `expo-haptics`, and
`@react-native-async-storage/async-storage` (all config-plugin-free), it runs
in Expo Go without a custom dev client.

## Build a signed Android APK

EAS Build produces a signed APK in the cloud (free tier) without needing a
local Android toolchain.

```bash
eas login                         # one-time
eas build:configure               # one-time, picks up eas.json
npm run build:apk                 # = eas build -p android --profile preview
```

When the build finishes, EAS prints a download URL. Install the APK on any
Android device (enable "Install from unknown sources" if prompted).

### Local build (optional)

If you prefer to build locally and have Android SDK + JDK 17 set up:

```bash
npm run build:apk:local
```

The signed APK lands in the current directory.

### Production AAB for Play Store

```bash
eas build -p android --profile production
```

## Security / signing

- EAS manages an Android **upload keystore** on your behalf (viewable via
  `eas credentials`). The keystore's private key never leaves Expo's servers
  unless you explicitly download it, and the resulting APK is signed with it.
- Production (AAB) builds use Google Play App Signing on top, so even if the
  upload key is compromised, the Play Store distribution signature is safe.
- Local persistence uses AsyncStorage (unencrypted; fine for workout data but
  don't store secrets there).

## Data shape

```ts
// src/types.ts
type Segment =
  | { kind: 'run' | 'walk'; seconds: number }
  | { kind: 'distance'; distanceKm: number; label?: string };

type Run = { run: number; workout: string; segments: Segment[] };
```

Every day in `src/data/plan.ts` has a hand-authored `segments` array, so the
countdown exactly matches the workout string — including heterogeneous weeks
like Week 3 (`2x [run 90s / walk 90s / run 3m / walk 3m]`) and Week 6 Run 2
(`run 10m / walk 3m / run 10m`). Weeks 10–12 day 3 use distance segments and
switch the Workout screen to stopwatch mode with a Finish button.
