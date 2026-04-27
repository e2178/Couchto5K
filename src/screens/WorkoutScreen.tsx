import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { SegmentBar } from '../components/SegmentBar';
import { LogRunModal } from '../components/LogRunModal';
import { findNextSession, markDone } from '../store';
import { totalSeconds } from '../data/program';
import { formatTime } from '../utils/time';
import { phaseStartCue } from '../utils/tones';
import type { SessionContext } from '../types';

type Props = {
  pendingCtx: SessionContext | null;
  onPendingConsumed: () => void;
  onRunLogged: () => void;
};

type Status = 'idle' | 'running' | 'paused' | 'finished';

type Live = {
  activeIndex: number;
  segmentRemaining: number;
  totalRemaining: number;
};

export const WorkoutScreen: React.FC<Props> = ({
  pendingCtx,
  onPendingConsumed,
  onRunLogged,
}) => {
  const [ctx, setCtx] = useState<SessionContext | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [live, setLive] = useState<Live>({ activeIndex: 0, segmentRemaining: 0, totalRemaining: 0 });
  const [log, setLog] = useState<{ visible: boolean; partial: boolean; duration: number }>(
    { visible: false, partial: false, duration: 0 },
  );

  const liveRef = useRef(live);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  liveRef.current = live;

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const loadSession = (s: SessionContext) => {
    stopTimer();
    setCtx(s);
    setStatus('idle');
    setLive({ activeIndex: 0, segmentRemaining: s.day.segments[0].sec, totalRemaining: totalSeconds(s.day.segments) });
    elapsedRef.current = 0;
  };

  useFocusEffect(
    useCallback(() => {
      if (pendingCtx) {
        loadSession(pendingCtx);
        onPendingConsumed();
      } else {
        const next = findNextSession();
        if (next) loadSession(next);
        else setCtx(null);
      }
      return stopTimer;
    }, [pendingCtx]),
  );

  useEffect(() => stopTimer, []);

  const tick = () => {
    if (!ctx) return;
    const now = Date.now();
    const dt = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;
    elapsedRef.current += dt;

    const cur = liveRef.current;
    let { activeIndex, segmentRemaining, totalRemaining } = cur;
    segmentRemaining -= dt;
    totalRemaining -= dt;

    if (totalRemaining <= 0) {
      setLive({ activeIndex, segmentRemaining: 0, totalRemaining: 0 });
      finish();
      return;
    }
    if (segmentRemaining <= 0) {
      const overshoot = -segmentRemaining;
      activeIndex += 1;
      if (activeIndex >= ctx.day.segments.length) { finish(); return; }
      const seg = ctx.day.segments[activeIndex];
      segmentRemaining = seg.sec - overshoot;
      phaseStartCue(seg.kind);
    }
    setLive({ activeIndex, segmentRemaining, totalRemaining });
  };

  const startTimer = () => {
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 200);
  };

  const onStart = () => {
    if (!ctx) return;
    setStatus('running');
    startTimer();
    phaseStartCue(ctx.day.segments[0].kind);
  };

  const onPause = () => { stopTimer(); setStatus('paused'); };
  const onResume = () => { setStatus('running'); startTimer(); };

  const finish = () => {
    stopTimer();
    setStatus('finished');
    if (!ctx) return;
    setLive((l) => ({ ...l, activeIndex: ctx.day.segments.length - 1, segmentRemaining: 0, totalRemaining: 0 }));
    phaseStartCue('done');
    setLog({
      visible: true,
      partial: false,
      duration: Math.round(elapsedRef.current) || totalSeconds(ctx.day.segments),
    });
  };

  const onFinishEarly = () => {
    Alert.alert('Finish early?', 'This will stop the timer and log a partial run.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'destructive',
        onPress: () => {
          if (!ctx) return;
          const elapsed = Math.round(elapsedRef.current);
          stopTimer();
          setStatus('finished');
          if (elapsed <= 0) { onRunLogged(); return; }
          setLog({ visible: true, partial: true, duration: elapsed });
        },
      },
    ]);
  };

  const onLogClose = (saved: boolean) => {
    setLog((l) => ({ ...l, visible: false }));
    if (ctx && !log.partial) markDone(ctx.dayId);
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

  const seg = ctx.day.segments[live.activeIndex];
  const pillStyle =
    status === 'finished' ? styles.pillDone :
    seg.kind === 'run' ? styles.pillRun : styles.pillWalk;
  const pillText = status === 'finished' ? 'DONE' : seg.kind === 'run' ? 'RUN' : 'WALK';

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

        <Text style={styles.timer}>{formatTime(live.segmentRemaining)}</Text>
        <Text style={styles.timerLabel}>phase time remaining</Text>

        <SegmentBar
          segments={ctx.day.segments}
          height={14}
          activeIndex={status === 'running' ? live.activeIndex : undefined}
          finished={status === 'finished'}
        />

        <View style={styles.stats}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{formatTime(live.totalRemaining)}</Text>
            <Text style={styles.statLabel}>total remaining</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>
              {Math.min(live.activeIndex + 1, ctx.day.segments.length)} / {ctx.day.segments.length}
            </Text>
            <Text style={styles.statLabel}>segment</Text>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          {status === 'idle' && (
            <Button label="Start" variant="primary" onPress={onStart} block />
          )}
          {status === 'running' && (
            <>
              <Button label="Pause" variant="secondary" onPress={onPause} block />
              <Button label="Finish early" variant="quiet" onPress={onFinishEarly} block />
            </>
          )}
          {status === 'paused' && (
            <>
              <Button label="Resume" variant="primary" onPress={onResume} block />
              <Button label="Finish early" variant="quiet" onPress={onFinishEarly} block />
            </>
          )}
          {status === 'finished' && (
            <Button label="Complete" variant="secondary" disabled block />
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
