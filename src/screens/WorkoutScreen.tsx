import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { findRun, totalSecondsFor } from '../data/plan';
import { theme } from '../theme';
import { useSelectedRun } from '../context/SelectedRun';
import { useCompletion } from '../context/Completion';
import { useHistory } from '../context/History';
import { formatTime, formatDuration } from '../lib/format';
import SegmentBar from '../components/SegmentBar';
import { RootTabs } from '../../App';

type Nav = BottomTabNavigationProp<RootTabs, 'Workout'>;

type Phase = 'idle' | 'running' | 'paused' | 'done';

export default function WorkoutScreen() {
  useKeepAwake();
  const navigation = useNavigation<Nav>();
  const { selected, setSelected } = useSelectedRun();
  const { markComplete } = useCompletion();
  const { addEntry } = useHistory();

  const data = useMemo(
    () => (selected ? findRun(selected.week, selected.run) : null),
    [selected]
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [segIndex, setSegIndex] = useState(0);
  const [segRemaining, setSegRemaining] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const [logOpen, setLogOpen] = useState(false);
  const [logDistance, setLogDistance] = useState('');
  const [logMinutes, setLogMinutes] = useState('');
  const [logSeconds, setLogSeconds] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const lastTickRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const segments = data?.run.segments ?? [];
  const current = segments[segIndex];
  const isDistanceRun =
    segments.length > 0 && segments.every((s) => s.kind === 'distance');
  const totalPlanned = useMemo(() => totalSecondsFor(segments), [segments]);

  useEffect(() => {
    if (!data) return;
    resetForRun();
  }, [data?.week.week, data?.run.run]);

  useEffect(() => {
    return () => stopInterval();
  }, []);

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resetForRun() {
    stopInterval();
    setPhase('idle');
    setSegIndex(0);
    const first = segments[0];
    setSegRemaining(first && first.kind !== 'distance' ? first.seconds : 0);
    setTotalElapsed(0);
    setLogOpen(false);
    setLogDistance('');
    setLogMinutes('');
    setLogSeconds('');
    setLogNotes('');
  }

  function cueForSegment(
    kind: 'run' | 'walk' | 'distance' | 'done',
    spoken?: string
  ) {
    try {
      if (kind === 'run') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (kind === 'walk') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (kind === 'done') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      /* haptics unsupported */
    }
    if (spoken) {
      Speech.speak(spoken, { rate: 1.05, pitch: 1.0 });
    }
  }

  function start() {
    if (!data || segments.length === 0) return;
    if (isDistanceRun) {
      cueForSegment('distance', 'Go! Run your distance.');
    } else if (current?.kind === 'run') {
      cueForSegment('run', 'Start running');
    } else if (current?.kind === 'walk') {
      cueForSegment('walk', 'Start walking');
    }
    setPhase('running');
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 200);
  }

  function pause() {
    stopInterval();
    setPhase('paused');
  }

  function resume() {
    setPhase('running');
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 200);
  }

  function stopAndReset() {
    Alert.alert('Reset workout?', 'Timer will return to the beginning.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetForRun },
    ]);
  }

  function advanceSegment(overflow: number) {
    const next = segIndex + 1;
    if (next >= segments.length) {
      finish();
      return;
    }
    const nextSeg = segments[next];
    setSegIndex(next);
    if (nextSeg.kind === 'distance') {
      setSegRemaining(0);
      cueForSegment('distance', `${nextSeg.distanceKm} kilometers`);
      return;
    }
    setSegRemaining(Math.max(0, nextSeg.seconds - overflow));
    cueForSegment(
      nextSeg.kind,
      nextSeg.kind === 'run' ? 'Run' : 'Walk'
    );
  }

  function tick() {
    const now = Date.now();
    const dt = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    setTotalElapsed((t) => t + dt);

    if (isDistanceRun) return; // distance run uses stopwatch only

    const seg = segments[segIndex];
    if (!seg || seg.kind === 'distance') return;

    setSegRemaining((prev) => {
      const next = prev - dt;
      if (next <= 0) {
        advanceSegment(-next);
        return 0;
      }
      return next;
    });
  }

  async function finish() {
    stopInterval();
    setPhase('done');
    cueForSegment('done', 'Workout complete. Great job!');
    if (data) {
      await markComplete(data.week.week, data.run.run);
    }
    // seed log modal with defaults
    if (data) {
      const hasTimedSegments = segments.some((s) => s.kind !== 'distance');
      if (hasTimedSegments) {
        const runningSeconds = segments.reduce(
          (acc, s) => acc + (s.kind === 'run' ? s.seconds : 0),
          0
        );
        const mins = Math.floor(runningSeconds / 60);
        const secs = runningSeconds % 60;
        setLogMinutes(String(mins));
        setLogSeconds(String(secs));
      }
      const distSeg = segments.find((s) => s.kind === 'distance');
      if (distSeg && distSeg.kind === 'distance') {
        setLogDistance(String(distSeg.distanceKm));
      }
    }
    setLogOpen(true);
  }

  async function saveLog() {
    if (!data) return;
    const distance = parseFloat(logDistance);
    const mins = parseInt(logMinutes || '0', 10);
    const secs = parseInt(logSeconds || '0', 10);
    const duration = mins * 60 + secs;
    if (!Number.isFinite(distance) || distance <= 0 || duration <= 0) {
      Alert.alert(
        'Incomplete entry',
        'Enter a positive distance (km) and duration.'
      );
      return;
    }
    await addEntry({
      week: data.week.week,
      run: data.run.run,
      dateISO: new Date().toISOString(),
      durationSeconds: duration,
      distanceKm: distance,
      notes: logNotes.trim() || undefined,
    });
    setLogOpen(false);
    navigation.navigate('History');
  }

  function skipLog() {
    setLogOpen(false);
  }

  function pickNewWorkout() {
    setSelected(null);
    resetForRun();
    navigation.navigate('Plan');
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No workout selected</Text>
          <Text style={styles.emptyBody}>
            Open the Program tab and tap Start on any day.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Plan')}
          >
            <Text style={styles.primaryBtnText}>Go to Program</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const bannerColor =
    current?.kind === 'walk'
      ? theme.walk
      : current?.kind === 'distance'
        ? theme.distance
        : theme.run;
  const bannerLabel =
    phase === 'done'
      ? 'DONE'
      : current?.kind === 'walk'
        ? 'WALK'
        : current?.kind === 'distance'
          ? `RUN ${current.distanceKm} km`
          : 'RUN';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.meta}>
          <Text style={styles.metaTitle}>
            Week {data.week.week} · Day {data.run.run}
          </Text>
          <Text style={styles.metaSubtitle}>{data.week.title}</Text>
          <Text style={styles.metaWorkout}>{data.run.workout}</Text>
        </View>

        <View
          style={[
            styles.banner,
            { backgroundColor: phase === 'done' ? theme.accent : bannerColor },
          ]}
        >
          <Text style={styles.bannerText}>{bannerLabel}</Text>
        </View>

        {isDistanceRun ? (
          <>
            <Text style={styles.timer}>{formatTime(totalElapsed)}</Text>
            <Text style={styles.timerLabel}>elapsed</Text>
          </>
        ) : (
          <>
            <Text style={styles.timer}>{formatTime(segRemaining)}</Text>
            <Text style={styles.timerLabel}>phase remaining</Text>
          </>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {isDistanceRun
                ? formatTime(totalElapsed)
                : formatTime(Math.max(0, totalPlanned - totalElapsed))}
            </Text>
            <Text style={styles.statLabel}>
              {isDistanceRun ? 'total elapsed' : 'total remaining'}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {Math.min(segIndex + 1, segments.length)} / {segments.length}
            </Text>
            <Text style={styles.statLabel}>segment</Text>
          </View>
        </View>

        <View style={styles.segWrap}>
          <SegmentBar segments={segments} activeIndex={segIndex} />
        </View>

        <View style={styles.controls}>
          {phase === 'idle' && (
            <Pressable style={styles.primaryBtn} onPress={start}>
              <Text style={styles.primaryBtnText}>Start</Text>
            </Pressable>
          )}
          {phase === 'running' && (
            <>
              <Pressable style={styles.secondaryBtn} onPress={pause}>
                <Text style={styles.secondaryBtnText}>Pause</Text>
              </Pressable>
              {isDistanceRun && (
                <Pressable style={styles.primaryBtn} onPress={finish}>
                  <Text style={styles.primaryBtnText}>Finish</Text>
                </Pressable>
              )}
            </>
          )}
          {phase === 'paused' && (
            <>
              <Pressable style={styles.primaryBtn} onPress={resume}>
                <Text style={styles.primaryBtnText}>Resume</Text>
              </Pressable>
              <Pressable style={styles.dangerBtn} onPress={stopAndReset}>
                <Text style={styles.dangerBtnText}>Reset</Text>
              </Pressable>
            </>
          )}
          {phase !== 'idle' && phase !== 'done' && !isDistanceRun && (
            <Pressable style={styles.dangerBtn} onPress={stopAndReset}>
              <Text style={styles.dangerBtnText}>Reset</Text>
            </Pressable>
          )}
          {phase === 'done' && (
            <Pressable style={styles.secondaryBtn} onPress={pickNewWorkout}>
              <Text style={styles.secondaryBtnText}>Pick next workout</Text>
            </Pressable>
          )}
        </View>

        {logOpen && (
          <View style={styles.logCard}>
            <Text style={styles.logTitle}>Log this run</Text>
            <Text style={styles.logBody}>
              Enter distance and time from your treadmill or watch. Pace is
              calculated automatically.
            </Text>

            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Distance (km)</Text>
                <TextInput
                  value={logDistance}
                  onChangeText={setLogDistance}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 3.2"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Time — minutes</Text>
                <TextInput
                  value={logMinutes}
                  onChangeText={setLogMinutes}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>seconds</Text>
                <TextInput
                  value={logSeconds}
                  onChangeText={setLogSeconds}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              value={logNotes}
              onChangeText={setLogNotes}
              placeholder="How did it feel?"
              placeholderTextColor={theme.subtle}
              style={[styles.input, { minHeight: 60 }]}
              multiline
            />

            <View style={styles.controls}>
              <Pressable style={styles.primaryBtn} onPress={saveLog}>
                <Text style={styles.primaryBtnText}>Save to history</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={skipLog}>
                <Text style={styles.secondaryBtnText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Total planned: {formatDuration(totalPlanned)}
          {isDistanceRun ? ' (distance-based)' : ''}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 16, gap: 14 },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  emptyTitle: { color: theme.text, fontSize: 20, fontWeight: '700' },
  emptyBody: { color: theme.muted, textAlign: 'center' },
  meta: {
    backgroundColor: theme.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  metaTitle: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  metaSubtitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 2 },
  metaWorkout: { color: theme.muted, marginTop: 4 },
  banner: {
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#0b0f19',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
  },
  timer: {
    color: theme.text,
    fontSize: 80,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: theme.muted,
    textAlign: 'center',
    marginTop: -8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
  },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  segWrap: { marginTop: 4 },
  controls: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.accentInk, fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: theme.text, fontWeight: '700', fontSize: 16 },
  dangerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerBtnText: { color: theme.danger, fontWeight: '700', fontSize: 16 },
  logCard: {
    marginTop: 8,
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  logTitle: { color: theme.text, fontSize: 18, fontWeight: '700' },
  logBody: { color: theme.muted, fontSize: 13 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 4 },
  fieldLabel: {
    color: theme.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 16,
  },
  footer: {
    color: theme.subtle,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
