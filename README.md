# Couchto5K

A web-based Couch to 5K trainer. Walks you through the standard 9-week C25K
program — run/walk intervals at the right ratio for each session — with audio
cues at every phase change, history tracking, and configurable settings.

## Usage

Open `index.html` in any modern browser. No build step, no dependencies.

The app has four sections accessible via the bottom tab bar (and gear icon):

- **Program** — the full 9-week plan, grouped into 3 phases. Tap a week to
  expand it; tap a day's *Start* button to begin that session.
- **Workout** — the active session screen. Auto-selects the next incomplete
  day. Big phase timer, segment progress bar, and a *Finish early* option
  that logs a partial run.
- **History** — every logged run with pace, distance, and duration. Stats
  bar at the top (total runs, average pace, total distance). *Log run
  manually* button at the bottom.
- **Settings** — theme, audio tones, vibration, units (km/mi), auto-log
  toggle, rest day reminder time, plus *Reset progress* and *Clear history*.

Progress is stored in the browser via `localStorage`.

## Files

- `index.html` — markup and tab structure
- `styles.css` — design tokens (purple/pink palette) and component styles
- `js/data.js` — the C25K program data
- `js/store.js` — completion, history, and settings persistence
- `js/utils.js` — time/pace formatting, audio tones, vibration
- `js/screens.js` — render functions for each screen + log run modal
- `js/workout.js` — workout timer state machine
- `js/main.js` — bootstrap and tab navigation
