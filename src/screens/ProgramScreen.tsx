import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { PROGRAM, dayId, dayLabel, totalSeconds } from '../data/program';
import { findNextSession, weekStatus, useCompletionVersion } from '../stores/program';
import { isDone } from '../stores/completion';
import { SegmentBar } from '../components/SegmentBar';
import { Button } from '../components/Button';
import { IconCheck, IconChevDown, IconChevUp } from '../components/Icons';
import { formatTimeLoose } from '../utils/time';
import type { SessionContext } from '../types';

type Props = {
  onStart: (ctx: SessionContext) => void;
};

export const ProgramScreen: React.FC<Props> = ({ onStart }) => {
  useCompletionVersion();
  const [override, setOverride] = useState<Record<number, boolean>>({});
  const next = findNextSession();
  const nextId = next?.dayId;
  const defaultExpandedWeek = next?.week;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {PROGRAM.map((phase) => (
        <View key={phase.name} style={styles.phaseGroup}>
          <View style={styles.phaseHeader}>
            <Text style={styles.phaseName}>{phase.name}</Text>
            <Text style={styles.phaseRange}>{phase.range}</Text>
          </View>

          {phase.weeks.map((weekObj) => {
            const status = weekStatus(weekObj);
            const isComplete = status.done === status.total;
            const defaultExpanded = !isComplete && weekObj.week === defaultExpandedWeek;
            const expanded = weekObj.week in override
              ? override[weekObj.week]
              : defaultExpanded;

            return (
              <View
                key={weekObj.week}
                style={[styles.weekCard, isComplete && styles.weekCardComplete]}
              >
                <Pressable
                  onPress={() => setOverride((p) => ({ ...p, [weekObj.week]: !expanded }))}
                  style={styles.weekHeader}
                >
                  <View>
                    <Text style={styles.weekTitle}>Week {weekObj.week}</Text>
                    <Text style={styles.weekMeta}>
                      {status.done} / {status.total} runs complete
                    </Text>
                  </View>
                  {isComplete ? (
                    <View style={styles.checkBadge}>
                      <IconCheck size={14} color={colors.bg} />
                    </View>
                  ) : (
                    <Text style={styles.chev}>{expanded ? '⌃' : '⌄'}</Text>
                  )}
                </Pressable>

                {expanded ? (
                  <View style={styles.weekBody}>
                    {weekObj.days.map((day, di) => {
                      const id = dayId(weekObj.week, di);
                      const done = isDone(id);
                      const isNext = id === nextId;
                      const total = totalSeconds(day.segments);

                      return (
                        <View key={di} style={styles.dayRow}>
                          <View style={styles.dayHeader}>
                            <View style={{ flex: 1 }}>
                              <View style={styles.dayTitleRow}>
                                <Text style={styles.dayTitle}>{dayLabel(weekObj.week, di)}</Text>
                                <Text style={styles.dayTotal}>total {formatTimeLoose(total)}</Text>
                              </View>
                              <Text style={styles.dayDesc}>{day.desc}</Text>
                            </View>
                            {done ? (
                              <View style={styles.doneBadge}>
                                <IconCheck size={14} color={colors.success} />
                                <Text style={styles.doneText}>Done</Text>
                              </View>
                            ) : (
                              <Button
                                label="Start"
                                size="sm"
                                variant={isNext ? 'primary' : 'ghost'}
                                onPress={() =>
                                  onStart({
                                    week: weekObj.week,
                                    dayIndex: di,
                                    day,
                                    dayId: id,
                                  })
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
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  phaseGroup: {
    gap: spacing.sm,
  },
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
  phaseRange: {
    color: colors.textSecondary,
    ...typography.small,
  },
  weekCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    overflow: 'hidden',
  },
  weekCardComplete: { opacity: 0.45 },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  weekTitle: { ...typography.h2, color: colors.textPrimary, fontSize: 16 },
  weekMeta:  { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  chev: { fontSize: 20, color: colors.textSecondary },
  checkBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  weekBody: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  dayRow: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  dayTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  dayTotal: { ...typography.tiny, color: colors.textTertiary },
  dayDesc:  { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText:  { color: colors.success, ...typography.smallStrong },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel:  { ...typography.tiny, color: colors.textSecondary },
});
