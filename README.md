# Couchto5K

A simple interval timer that follows the Couch to 5K methodology.

Set a total workout length (default 30 minutes), then pick your run and walk
durations. The app calculates how many run/walk sets fit in the total time,
then counts down each interval and alternates between the two until time runs
out. A tone plays at every phase change.

## Usage

Open `index.html` in any modern browser. No build step, no dependencies.

- **Total workout length**: overall session in minutes (e.g. 30)
- **Run**: duration of each run interval (min + sec)
- **Walk**: duration of each walk interval (min + sec)

The preview shows how many full sets fit and any leftover time that will be
trimmed (a partial set is never started). Press **Start workout** to begin.

## How the timing works

```
sets     = floor(total_seconds / (run_seconds + walk_seconds))
workout  = sets × (run + walk)
leftover = total - workout    // trimmed so you always finish on a full set
```

The sequence is always `run → walk → run → walk → ...`, repeated `sets` times.
