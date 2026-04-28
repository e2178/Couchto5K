import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { PROGRAM, dayId, dayLabel, totalSeconds } from '../data/program';
import {
  completion, findNextSession, isDone, setDayDone, setWeekDone, weekStatus,
} from '../store';
import { SegmentBar } from '../components/SegmentBar';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { formatTimeLoose } from '../utils/time';
import type { SessionContext } from '../types';

type Props = { onStart: (ctx: SessionContext) => void };

export const ProgramScreen: React.FC<Props> = ({ onStart }) => {
  completion.use();                                 // re-render on completion change
  const [override, setOverride] = useState<Record<number, boolean>>({});
  const next = findNextSession();
  const nextWeek = next?.week;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {PROGRAM.map((phase) => (
        <View key={phase.name} style={{ gap: spacing.sm }}>
          <View style={styles.phaseHeader}>
            <Text style={styles.phaseName}>{phase.name}</Text>
            <Text style={styles.phaseRange}>{phase.range}</Text>
          </View>

          {phase.weeks.map((w) => {
            const status = weekStatus(w);
            const allDone = status.done === status.total;
            const someDone = status.done > 0 && !allDone;
            const expanded =
              w.week in override ? override[w.week] : !allDone && w.week === nextWeek;

            return (
              <View key={w.week} style={[styles.weekCard, allDone && { opacity: 0.55 }]}>
                <View style={styles.weekHeader}>
                  <View style={styles.weekHeaderLeft}>
                    <Checkbox
                      value={allDone}
                      partial={someDone}
                      onChange={(v) => setWeekDone(w, v)}
                    />
                  </View>
                  <Pressable
                    onPress={() => setOverride((p) => ({ ...p, [w.week]: !expanded }))}
                    style={styles.weekHeaderTap}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.weekTitle}>Week {w.week}</Text>
                      <Text style={styles.weekMeta}>
                        {status.done} / {status.total} runs complete
                      </Text>
                    </View>
                    <Text style={styles.chev}>{expanded ? '⌃' : '⌄'}</Text>
                  </Pressable>
                </View>

                {expanded && (
                  <View style={styles.weekBody}>
                    {w.days.map((day, di) => {
                      const id = dayId(w.week, di);
                      const dayDone = isDone(id);
                      const isNext = id === next?.dayId;
                      return (
                        <View key={di} style={styles.dayRow}>
                          <View style={styles.dayHeader}>
                            <Checkbox
                              value={dayDone}
                              onChange={(v) => setDayDone(id, v)}
                            />
                            <View style={{ flex: 1 }}>
                              <View style={styles.dayTitleRow}>
                                <Text style={styles.dayTitle}>
                                  {dayLabel(w.week, di)}
                                </Text>
                                <Text style={styles.dayTotal}>
                                  total {formatTimeLoose(totalSeconds(day.segments))}
                                </Text>
                              </View>
                              <Text style={styles.dayDesc}>{day.desc}</Text>
                            </View>
                            {!dayDone && (
                              <Button
                                label="Start"
                                size="sm"
                                variant={isNext ? 'primary' : 'ghost'}
                                onPress={() =>
                                  onStart({ week: w.week, dayIndex: di, day, dayId: id })
                                }
                              />
                            )}
                          </View>
                          <SegmentBar segments={day.segments} height={10} />
                        </View>
                      );
                    })}

                    <View style={styles.legend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: colors.run }]} />
                        <Text style={styles.legendLabel}>Run</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: colors.walk }]} />
                        <Text style={styles.legendLabel}>Walk</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  phaseName: {
    color: colors.run,
    ...typography.smallStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  phaseRange: { color: colors.textSecondary, ...typography.small },
  weekCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  weekHeaderLeft: { paddingRight: spacing.md },
  weekHeaderTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  weekTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  weekMeta: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  chev: { fontSize: 20, color: colors.textSecondary, marginLeft: spacing.sm },
  weekBody: { padding: spacing.md, paddingTop: 0, gap: spacing.sm },
  dayRow: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  dayTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  dayTotal: { ...typography.tiny, color: colors.textTertiary },
  dayDesc: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  legend: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { ...typography.tiny, color: colors.textSecondary },
});
