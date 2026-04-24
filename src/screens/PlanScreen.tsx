import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

import { plan, totalSecondsFor } from '../data/plan';
import { theme } from '../theme';
import { useCompletion } from '../context/Completion';
import { useSelectedRun } from '../context/SelectedRun';
import { RootTabs } from '../../App';
import SegmentBar from '../components/SegmentBar';
import { formatDuration } from '../lib/format';
import { Week } from '../types';

type Nav = BottomTabNavigationProp<RootTabs, 'Plan'>;

export default function PlanScreen() {
  const navigation = useNavigation<Nav>();
  const { setSelected } = useSelectedRun();
  const { completion, isRunComplete, toggle } = useCompletion();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });

  const toggleExpanded = (week: number) =>
    setExpanded((prev) => ({ ...prev, [week]: !prev[week] }));

  const startRun = (week: number, run: number) => {
    setSelected({ week, run });
    navigation.navigate('Workout');
  };

  const weekIsComplete = (week: Week) =>
    week.runs.every((r) => isRunComplete(week.week, r.run));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{plan.name}</Text>
          <Text style={styles.subtitle}>
            {plan.durationWeeks} weeks · {plan.daysPerWeek} days/week · goal {plan.goalDistance}
          </Text>
        </View>

        {plan.phases.map((phase) => {
          const weeks = plan.weeks.filter((w) => w.phase === phase.phase);
          return (
            <View key={phase.phase} style={styles.phaseSection}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseLabel}>
                  Phase {phase.phase} · {phase.name}
                </Text>
                <Text style={styles.phaseRange}>
                  Weeks {phase.weeks[0]}–{phase.weeks[phase.weeks.length - 1]}
                </Text>
              </View>
              <Text style={styles.phaseDesc}>{phase.description}</Text>

              {weeks.map((week) => {
                const open = !!expanded[week.week];
                const done = weekIsComplete(week);
                return (
                  <View
                    key={week.week}
                    style={[styles.weekCard, done && styles.weekCardDone]}
                  >
                    <Pressable
                      onPress={() => toggleExpanded(week.week)}
                      style={styles.weekHeader}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.weekTitle,
                            done && styles.textMuted,
                          ]}
                        >
                          Week {week.week} · {week.title}
                        </Text>
                        <Text style={styles.weekMeta}>
                          {week.runs.filter((r) =>
                            isRunComplete(week.week, r.run)
                          ).length}{' '}
                          / {week.runs.length} runs complete
                        </Text>
                      </View>
                      <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
                    </Pressable>

                    {open && (
                      <View style={styles.weekBody}>
                        <Text style={styles.notes}>{week.notes}</Text>

                        {week.runs.map((run) => {
                          const ck = isRunComplete(week.week, run.run);
                          const secs = totalSecondsFor(run.segments);
                          const isDistance = run.segments.some(
                            (s) => s.kind === 'distance'
                          );
                          return (
                            <View key={run.run} style={styles.runRow}>
                              <View style={styles.runHeader}>
                                <Pressable
                                  onPress={() =>
                                    toggle(week.week, run.run)
                                  }
                                  style={[
                                    styles.checkbox,
                                    ck && styles.checkboxChecked,
                                  ]}
                                >
                                  <Text style={styles.checkboxMark}>
                                    {ck ? '✓' : ''}
                                  </Text>
                                </Pressable>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.runTitle}>
                                    Day {run.run}
                                  </Text>
                                  <Text style={styles.runWorkout}>
                                    {run.workout}
                                  </Text>
                                  <Text style={styles.runMeta}>
                                    {isDistance
                                      ? 'distance-based'
                                      : `total ${formatDuration(secs)}`}
                                  </Text>
                                </View>
                                <Pressable
                                  onPress={() => startRun(week.week, run.run)}
                                  style={styles.startBtn}
                                >
                                  <Text style={styles.startBtnText}>Start</Text>
                                </Pressable>
                              </View>
                              <View style={styles.segmentBarWrap}>
                                <SegmentBar segments={run.segments} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.tipsSection}>
          <Text style={styles.phaseLabel}>Tips</Text>
          {plan.tips.map((tip) => (
            <View key={tip.key} style={styles.tip}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.description}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 16, paddingTop: 12 },
  header: { marginBottom: 16 },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: theme.muted, marginTop: 4 },
  phaseSection: { marginBottom: 18 },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  phaseLabel: { color: theme.accent, fontWeight: '700', letterSpacing: 0.5 },
  phaseRange: { color: theme.muted, fontSize: 12 },
  phaseDesc: { color: theme.muted, fontSize: 13, marginTop: 2, marginBottom: 10 },
  weekCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  weekCardDone: { opacity: 0.55 },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  weekTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  weekMeta: { color: theme.muted, fontSize: 12, marginTop: 2 },
  textMuted: { color: theme.muted },
  chevron: { color: theme.muted, fontSize: 18, marginLeft: 8 },
  weekBody: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    padding: 14,
    gap: 14,
  },
  notes: {
    color: theme.muted,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  runRow: { gap: 8 },
  runHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  checkboxMark: { color: '#052e16', fontWeight: '900', fontSize: 14 },
  runTitle: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  runWorkout: { color: theme.text, fontSize: 14, marginTop: 1 },
  runMeta: { color: theme.subtle, fontSize: 11, marginTop: 2 },
  startBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startBtnText: { color: theme.accentInk, fontWeight: '700' },
  segmentBarWrap: { paddingLeft: 34 },
  tipsSection: { marginTop: 6 },
  tip: {
    backgroundColor: theme.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginTop: 8,
  },
  tipTitle: { color: theme.text, fontWeight: '700', marginBottom: 2 },
  tipDesc: { color: theme.muted, fontSize: 13, lineHeight: 18 },
});
