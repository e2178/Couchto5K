import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { ManualLogModal } from '../components/ManualLogModal';
import { historyStore } from '../stores/history';
import { settingsStore } from '../stores/settings';
import {
  formatPace, formatPaceShort, formatDistance, totalDistance,
} from '../utils/pace';
import { formatTimeLoose, relativeDate } from '../utils/time';

export const HistoryScreen: React.FC = () => {
  const runs = historyStore.use();
  const settings = settingsStore.use();
  const [manualOpen, setManualOpen] = useState(false);

  const totalKm = runs.reduce((s, r) => s + r.distanceKm, 0);
  const avgPace = runs.length
    ? Math.round(runs.reduce((s, r) => s + r.paceSecondsPerKm, 0) / runs.length)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{runs.length}</Text>
          <Text style={styles.tileLabel}>Runs</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>
            {avgPace ? formatPaceShort(avgPace, settings.units) : '—'}
          </Text>
          <Text style={styles.tileLabel}>
            {settings.units === 'mi' ? 'Avg /mi' : 'Avg /km'}
          </Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{totalDistance(totalKm, settings.units)}</Text>
          <Text style={styles.tileLabel}>
            {settings.units === 'mi' ? 'Total mi' : 'Total km'}
          </Text>
        </View>
      </View>

      {runs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No runs logged yet.</Text>
          <Text style={styles.emptyBody}>
            Complete a session or log one manually below.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {runs.map((run) => {
            const labelText = run.title
              ? `${run.weekLabel ? run.weekLabel + ' · ' : ''}${run.title}`
              : run.weekLabel || (run.source === 'manual' ? 'Manual run' : 'Run');
            return (
              <View key={run.id} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowLabel}>{labelText}</Text>
                  <Text style={styles.rowPace}>{formatPace(run.paceSecondsPerKm, settings.units)}</Text>
                </View>
                <Text style={styles.rowSub}>
                  {formatDistance(run.distanceKm, settings.units)} · {formatTimeLoose(run.durationSeconds)} · {relativeDate(run.date)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Button
        label="+ Log run manually"
        variant="secondary"
        onPress={() => setManualOpen(true)}
        block
        style={{ marginTop: spacing.md }}
      />

      <ManualLogModal visible={manualOpen} onClose={() => setManualOpen(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md,
    alignItems: 'center',
  },
  tileValue: { ...typography.h2, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  tileLabel: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4,
  },
  emptyCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: { ...typography.body, color: colors.textPrimary, marginBottom: 4 },
  emptyBody:  { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  list: { gap: spacing.sm },
  row: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md,
    gap: 4,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowLabel: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  rowPace:  { ...typography.bodyStrong, color: colors.run, fontVariant: ['tabular-nums'] },
  rowSub:   { ...typography.tiny, color: colors.textSecondary },
});
