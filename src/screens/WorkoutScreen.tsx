import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { SegmentBar } from '../components/SegmentBar';
import { LogRunModal } from '../components/LogRunModal';
import {
  activeWorkout, clearActiveWorkout, elapsedSeconds, finishActiveWorkout,
  findNextSession, markDone, pauseActiveWorkout, resumeActiveWorkout, settings,
  startActiveWorkout,
} from '../store';
import { totalSeconds } from '../data/program';
import { formatTime } from '../utils/time';
import { phaseStartCue } from '../utils/tones';
import type { Segment, SessionContext } from '../types';

type Props = {
  pendingCtx: SessionContext | null;
  onPendingConsumed: () => void;
  onRunLogged: () => void;
};

type Derived = {
  activeIndex: number;
  segmentRemaining: number;
  totalRemaining: number;
  finished: boolean;
};

/* Compute the workout state from a snapshot of elapsed time. */
const computeDerived = (segments: Segment[], elapsedSec: number): Derived => {
  const total = segments.reduce((s, seg) => s + seg.sec, 0);
  if (elapsedSec >= total) {
    return { activeIndex: segments.length - 1, segmentRemaining: 0, totalRemaining: 0, finished: true };
  }
  let remaining = elapsedSec;
  for (let i = 0; i < segments.length; i++) {
    if (remaining < segments[i].sec) {
      return {
        activeIndex: i,
        segmentRemaining: segments[i].sec - remaining,
        totalRemaining: total - elapsedSec,
        finished: false,
      };
    }
    remaining -= segments[i].sec;
  }
  return { activeIndex: segments.length - 1, segmentRemaining: 0, totalRemaining: 0, finished: true };
};

export const WorkoutScreen: React.FC<Props> = ({
  pendingCtx,
  onPendingConsumed,
  onRunLogged,
}) => {
  const { keepScreenOn } = settings.use();
  const aw = activeWorkout.use();

  /* Tick driver: bumping a counter every 250ms while running causes the
   * derived state to recompute from wall-clock time. */
  const [, setNow] = useState(0);
  useEffect(() => {
    if (!aw || aw.pausedAt || aw.finishedAt) return;
    const id = setInterval(() => setNow((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [aw?.startedAt, aw?.pausedAt, aw?.finishedAt]);

  /* If Program tapped Start, replace any existing session with the new one. */
  useEffect(() => {
    if (pendingCtx) {
      startActiveWorkout(pendingCtx);
      onPendingConsumed();
    }
  }, [pendingCtx, onPendingConsumed]);

  /* Modal state */
  const [log, setLog] = useState<{ visible: boolean; partial: boolean; duration: number }>(
    { visible: false, partial: false, duration: 0 },
  );

  /* Derive current state for this render */
  const ctx = aw?.ctx ?? null;
  const derived: Derived | null = aw && ctx
    ? computeDerived(ctx.day.segments, elapsedSeconds(aw))
    : null;

  /* ---- Phase-cue + finish detection ---- */

  const lastSeenStartRef = useRef<number>(0);
  const lastCueIndexRef = useRef<number>(-1);
  const finishedHandledRef = useRef<boolean>(false);

  useEffect(() => {
    /* Reset trackers when the workout is cleared */
    if (!aw || !ctx || !derived) {
      lastSeenStartRef.current = 0;
      lastCueIndexRef.current = -1;
      finishedHandledRef.current = false;
      return;
    }

    /* Finish (natural or via wall-clock running past the end) */
    if (derived.finished && !finishedHandledRef.current && !aw.finishedAt) {
      finishedHandledRef.current = true;
      finishActiveWorkout();
      phaseStartCue('done');
      const elapsed = elapsedSeconds(aw);
      setLog({
        visible: true,
        partial: false,
        duration: elapsed || totalSeconds(ctx.day.segments),
      });
      return;
    }
    if (derived.finished) return;

    /* Phase-transition cue.
     *  - Only fire when the workout is actively running (not paused).
     *  - On a fresh start (new aw.startedAt), only fire if we are still on
     *    segment 0; otherwise we are restoring a workout mid-flight after
     *    the app was killed and we should not blast a tone the user did not
     *    expect. */
    if (aw.pausedAt) return;

    const isFreshStart = lastSeenStartRef.current !== aw.startedAt;
    if (isFreshStart) {
      lastSeenStartRef.current = aw.startedAt;
      lastCueIndexRef.current = derived.activeIndex;
      if (derived.activeIndex === 0) {
        phaseStartCue(ctx.day.segments[0].kind);
      }
      return;
    }

    if (derived.activeIndex !== lastCueIndexRef.current) {
      lastCueIndexRef.current = derived.activeIndex;
      phaseStartCue(ctx.day.segments[derived.activeIndex].kind);
    }
  }, [
    aw?.startedAt,
    aw?.pausedAt,
    aw?.finishedAt,
    derived?.activeIndex,
    derived?.finished,
    ctx,
    aw,
  ]);

  /* ---- Empty / ready states ---- */

  if (!aw || !ctx || !derived) {
    if (!findNextSession()) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Program complete</Text>
          <Text style={styles.emptyBody}>
            All 9 weeks done. Reset progress in Settings to run it again.
          </Text>
        </View>
      );
    }
    return <ReadyView />;
  }

  /* ---- Action handlers ---- */

  const onPause = () => pauseActiveWorkout();
  const onResume = () => resumeActiveWorkout();

  const onFinishEarly = () => {
    Alert.alert('Finish early?', 'This will stop the timer and log a partial run.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'destructive',
        onPress: () => {
          if (!aw || !ctx) return;
          const elapsed = elapsedSeconds(aw);
          finishedHandledRef.current = true;
          finishActiveWorkout();
          if (elapsed <= 0) {
            clearActiveWorkout();
            onRunLogged();
            return;
          }
          setLog({ visible: true, partial: true, duration: elapsed });
        },
      },
    ]);
  };

  const onLogClose = (_saved: boolean) => {
    setLog((l) => ({ ...l, visible: false }));
    if (ctx && !log.partial) markDone(ctx.dayId);
    clearActiveWorkout();
    onRunLogged();
  };

  /* ---- Pill + button labels ---- */

  const isPaused = !!aw.pausedAt;
  const isFinished = !!aw.finishedAt || derived.finished;
  const isRunning = !isPaused && !isFinished;
  const seg = ctx.day.segments[derived.activeIndex];
  const pillStyle =
    isFinished ? styles.pillDone :
    isPaused ? styles.pillPaused :
    seg.kind === 'run' ? styles.pillRun : styles.pillWalk;
  const pillText =
    isFinished ? 'DONE' :
    isPaused ? 'PAUSED' :
    seg.kind === 'run' ? 'RUN' : 'WALK';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {keepScreenOn && isRunning ? <KeepAwake /> : null}

      <View style={styles.card}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.metaWeek}>Week {ctx.week} · Day {ctx.dayIndex + 1}</Text>
          <Text style={styles.metaDesc}>{ctx.day.desc}</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <View style={[styles.pill, pillStyle]}>
            <Text style={styles.pillText}>{pillText}</Text>
          </View>
        </View>

        <Text style={styles.timer}>{formatTime(derived.segmentRemaining)}</Text>
        <Text style={styles.timerLabel}>phase time remaining</Text>

        <SegmentBar
          segments={ctx.day.segments}
          height={14}
          activeIndex={isRunning ? derived.activeIndex : undefined}
          finished={isFinished}
        />

        <View style={styles.stats}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{formatTime(derived.totalRemaining)}</Text>
            <Text style={styles.statLabel}>total remaining</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>
              {Math.min(derived.activeIndex + 1, ctx.day.segments.length)} / {ctx.day.segments.length}
            </Text>
            <Text style={styles.statLabel}>segment</Text>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          {isFinished && <Button label="Complete" variant="secondary" disabled block />}
          {!isFinished && isPaused && (
            <>
              <Button label="Resume" variant="primary" onPress={onResume} block />
              <Button label="Finish early" variant="quiet" onPress={onFinishEarly} block />
            </>
          )}
          {isRunning && (
            <>
              <Button label="Pause" variant="secondary" onPress={onPause} block />
              <Button label="Finish early" variant="quiet" onPress={onFinishEarly} block />
            </>
          )}
        </View>
      </View>

      <LogRunModal
        visible={log.visible}
        durationSeconds={log.duration}
        weekLabel={`W${ctx.week} D${ctx.dayIndex + 1}`}
        partial={log.partial}
        onClose={onLogClose}
      />
    </ScrollView>
  );
};

/* Activates the keep-awake lock for as long as this component is mounted. */
const KeepAwake: React.FC = () => {
  useKeepAwake();
  return null;
};

/* "Ready" panel shown when there is no active workout but a next session exists. */
const ReadyView: React.FC = () => {
  const next = findNextSession();
  if (!next) return null;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.metaWeek}>Week {next.week} · Day {next.dayIndex + 1}</Text>
          <Text style={styles.metaDesc}>{next.day.desc}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.pill, styles.pillReady]}>
            <Text style={styles.pillText}>READY</Text>
          </View>
        </View>
        <Text style={styles.timer}>{formatTime(next.day.segments[0].sec)}</Text>
        <Text style={styles.timerLabel}>first phase</Text>
        <SegmentBar segments={next.day.segments} height={14} />
        <Button label="Start" variant="primary" onPress={() => startActiveWorkout(next)} block />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  metaWeek: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  metaDesc: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  pill: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 16 },
  pillRun: { backgroundColor: colors.run },
  pillWalk: { backgroundColor: colors.walk },
  pillPaused: { backgroundColor: colors.bgSubtle },
  pillDone: { backgroundColor: colors.success },
  pillReady: { backgroundColor: colors.bgSubtle },
  pillText: { color: colors.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.6 },
  timer: {
    fontSize: 72, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', letterSpacing: -1, fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    textAlign: 'center', color: colors.textSecondary, ...typography.tiny,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: -10,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1, backgroundColor: colors.bg,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md, alignItems: 'center',
  },
  statValue: { ...typography.h2, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  statLabel: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
  },
});
