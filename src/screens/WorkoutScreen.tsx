import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { SegmentBar } from '../components/SegmentBar';
import { ConfirmModal } from '../components/ConfirmModal';
import { LogRunModal } from '../components/LogRunModal';
import { findNextSession } from '../stores/program';
import { markDone } from '../stores/completion';
import { totalSeconds } from '../data/program';
import { formatTime } from '../utils/time';
import { phaseStartCue } from '../utils/tones';
import type { SessionContext, SegmentKind } from '../types';

type Props = {
  pendingCtx: SessionContext | null;
  onPendingConsumed: () => void;
  onRunLogged: () => void;
};

type RunState = 'idle' | 'running' | 'paused' | 'finished';

export const WorkoutScreen: React.FC<Props> = ({
  pendingCtx,
  onPendingConsumed,
  onRunLogged,
}) => {
  const [ctx, setCtx] = useState<SessionContext | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [activeIndex, setActiveIndex] = useState(0);
  const [segmentRemaining, setSegmentRemaining] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [logPartial, setLogPartial] = useState(false);
  const [endedDuration, setEndedDuration] = useState(0);

  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ activeIndex: 0, segmentRemaining: 0, totalRemaining: 0 });

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const resetWith = (next: SessionContext) => {
    stopTimer();
    setCtx(next);
    const total = totalSeconds(next.day.segments);
    setActiveIndex(0);
    setSegmentRemaining(next.day.segments[0].sec);
    setTotalRemaining(total);
    stateRef.current = {
      activeIndex: 0,
      segmentRemaining: next.day.segments[0].sec,
      totalRemaining: total,
    };
    elapsedRef.current = 0;
    setRunState('idle');
  };

  /* Auto-select next session when screen is focused. */
  useFocusEffect(
    React.useCallback(() => {
      if (pendingCtx) {
        resetWith(pendingCtx);
        onPendingConsumed();
      } else {
        const next = findNextSession();
        if (next) resetWith(next);
        else setCtx(null);
      }
      return () => {
        stopTimer();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingCtx]),
  );

  useEffect(() => stopTimer, []);

  const tick = () => {
    if (!ctx) return;
    const now = Date.now();
    const dt = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;
    elapsedRef.current += dt;

    const s = stateRef.current;
    s.segmentRemaining -= dt;
    s.totalRemaining -= dt;

    if (s.totalRemaining <= 0) {
      s.totalRemaining = 0;
      s.segmentRemaining = 0;
      setSegmentRemaining(0);
      setTotalRemaining(0);
      finishWorkout();
      return;
    }

    if (s.segmentRemaining <= 0) {
      const overshoot = -s.segmentRemaining;
      s.activeIndex += 1;
      if (s.activeIndex >= ctx.day.segments.length) {
        finishWorkout();
        return;
      }
      const newSeg = ctx.day.segments[s.activeIndex];
      s.segmentRemaining = newSeg.sec - overshoot;
      setActiveIndex(s.activeIndex);
      phaseStartCue(newSeg.kind);
    }

    setSegmentRemaining(s.segmentRemaining);
    setTotalRemaining(s.totalRemaining);
  };

  const startTimer = () => {
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 200);
  };

  const handleStart = () => {
    if (!ctx) return;
    setRunState('running');
    startTimer();
    phaseStartCue(ctx.day.segments[0].kind);
  };

  const handlePause = () => {
    stopTimer();
    setRunState('paused');
  };

  const handleResume = () => {
    setRunState('running');
    startTimer();
  };

  const finishWorkout = () => {
    stopTimer();
    setRunState('finished');
    setActiveIndex(ctx ? ctx.day.segments.length - 1 : 0);
    setSegmentRemaining(0);
    setTotalRemaining(0);
    phaseStartCue('done');
    if (ctx) {
      const elapsed = Math.round(elapsedRef.current) || totalSeconds(ctx.day.segments);
      setEndedDuration(elapsed);
      setLogPartial(false);
      setLogVisible(true);
    }
  };

  const onConfirmFinishEarly = () => {
    setConfirmFinish(false);
    if (!ctx) return;
    const elapsed = Math.round(elapsedRef.current);
    stopTimer();
    setRunState('finished');
    if (elapsed <= 0) {
      onRunLogged();
      return;
    }
    setEndedDuration(elapsed);
    setLogPartial(true);
    setLogVisible(true);
  };

  const onLogClose = (saved: boolean) => {
    setLogVisible(false);
    if (ctx && !logPartial) markDone(ctx.dayId);
    onRunLogged();
  };

  if (!ctx) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Program complete</Text>
        <Text style={styles.emptyBody}>
          All 9 weeks done. Reset progress in Settings to run it again.
        </Text>
      </View>
    );
  }

  const seg = ctx.day.segments[activeIndex];
  const phasePillStyle =
    runState === 'finished'
      ? styles.pillDone
      : seg.kind === 'run'
      ? styles.pillRun
      : styles.pillWalk;
  const phasePillLabel =
    runState === 'finished' ? 'DONE' : seg.kind === 'run' ? 'RUN' : 'WALK';

  let primaryLabel = 'Start';
  let primaryAction = handleStart;
  let primaryVariant: 'primary' | 'secondary' = 'primary';
  if (runState === 'running') { primaryLabel = 'Pause'; primaryAction = handlePause; primaryVariant = 'secondary'; }
  else if (runState === 'paused') { primaryLabel = 'Resume'; primaryAction = handleResume; primaryVariant = 'secondary'; }
  else if (runState === 'finished') { primaryLabel = 'Complete'; primaryAction = () => {}; primaryVariant = 'secondary'; }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.meta}>
          <Text style={styles.metaWeek}>Week {ctx.week} · Day {ctx.dayIndex + 1}</Text>
          <Text style={styles.metaDesc}>{ctx.day.desc}</Text>
        </View>

        <View style={styles.pillWrap}>
          <View style={[styles.pill, phasePillStyle]}>
            <Text style={styles.pillText}>{phasePillLabel}</Text>
          </View>
        </View>

        <Text style={styles.timer}>{formatTime(segmentRemaining)}</Text>
        <Text style={styles.timerLabel}>phase time remaining</Text>

        <View style={styles.segmentBarWrap}>
          <SegmentBar
            segments={ctx.day.segments}
            height={14}
            activeIndex={runState === 'running' ? activeIndex : undefined}
            finished={runState === 'finished'}
          />
        </View>

        <View style={styles.stats}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{formatTime(totalRemaining)}</Text>
            <Text style={styles.statLabel}>total remaining</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>
              {Math.min(activeIndex + 1, ctx.day.segments.length)} / {ctx.day.segments.length}
            </Text>
            <Text style={styles.statLabel}>segment</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Button
            label={primaryLabel}
            onPress={primaryAction}
            variant={primaryVariant}
            disabled={runState === 'finished'}
            block
          />
          {(runState === 'running' || runState === 'paused') ? (
            <Button
              label="Finish early"
              variant="quiet"
              onPress={() => setConfirmFinish(true)}
              block
            />
          ) : null}
        </View>
      </View>

      <ConfirmModal
        visible={confirmFinish}
        title="Finish early?"
        body="This will stop the timer and log a partial run."
        confirmLabel="Finish"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={onConfirmFinishEarly}
      />

      <LogRunModal
        visible={logVisible}
        durationSeconds={endedDuration}
        weekLabel={`W${ctx.week} D${ctx.dayIndex + 1}`}
        partial={logPartial}
        onClose={onLogClose}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  emptyTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyBody:  { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  meta: { alignItems: 'center', gap: 4 },
  metaWeek: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  metaDesc: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },

  pillWrap: { alignItems: 'center' },
  pill: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 16 },
  pillRun:  { backgroundColor: colors.run },
  pillWalk: { backgroundColor: colors.walk },
  pillDone: { backgroundColor: colors.success },
  pillText: { color: colors.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.6 },

  timer: {
    fontSize: 72, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', letterSpacing: -1, fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    textAlign: 'center', color: colors.textSecondary, ...typography.tiny,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: -10,
  },

  segmentBarWrap: { paddingHorizontal: 4 },

  stats: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2, color: colors.textPrimary, fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
  },

  controls: { gap: spacing.sm },
});
