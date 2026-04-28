import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { ManualLogModal } from '../components/ManualLogModal';
import { history, settings } from '../store';
import {
  formatPace, formatPaceShort, formatDistance, totalDistance,
} from '../utils/pace';
import { formatTimeLoose, relativeDate } from '../utils/time';
import type { Run } from '../types';

export const HistoryScreen: React.FC = () => {
  const runs = history.use();
  const s = settings.use();
  const [editing, setEditing] = useState<Run | null>(null);
  const [creating, setCreating] = useState(false);

  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);
  const avgPace = runs.length
    ? Math.round(runs.reduce((acc, r) => acc + r.paceSecondsPerKm, 0) / runs.length)
    : 0;
  const unit = s.units === 'mi' ? 'mi' : 'km';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsRow}>
        <Tile value={String(runs.length)} label="Runs" />
        <Tile
          value={avgPace ? formatPaceShort(avgPace, s.units) : '—'}
          label={`Avg /${unit}`}
        />
        <Tile value={totalDistance(totalKm, s.units)} label={`Total ${unit}`} />
      </View>

      {runs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No runs logged yet.</Text>
          <Text style={styles.emptyBody}>
            Complete a session or log one manually below.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {runs.map((r) => {
            const label = r.title
              ? `${r.weekLabel ? r.weekLabel + ' · ' : ''}${r.title}`
              : r.weekLabel || (r.source === 'manual' ? 'Manual run' : 'Run');
            return (
              <Pressable
                key={r.id}
                onPress={() => setEditing(r)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.rowPace}>{formatPace(r.paceSecondsPerKm, s.units)}</Text>
                </View>
                <Text style={styles.rowSub}>
                  {formatDistance(r.distanceKm, s.units)} · {formatTimeLoose(r.durationSeconds)} · {relativeDate(r.date)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button
        label="+ Log run manually"
        variant="secondary"
        onPress={() => setCreating(true)}
        block
        style={{ marginTop: spacing.md }}
      />

      <ManualLogModal visible={creating} onClose={() => setCreating(false)} />
      <ManualLogModal
        visible={!!editing}
        existingRun={editing}
        onClose={() => setEditing(null)}
      />
    </ScrollView>
  );
};

const Tile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.tile}>
    <Text style={styles.tileValue}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1, backgroundColor: colors.bgElevated,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md, alignItems: 'center',
  },
  tileValue: { ...typography.h2, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  tileLabel: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4,
  },
  empty: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.xl, alignItems: 'center',
  },
  emptyTitle: { ...typography.body, color: colors.textPrimary, marginBottom: 4 },
  emptyBody: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  row: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md, gap: 4,
  },
  rowPressed: { opacity: 0.6 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowLabel: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  rowPace: { ...typography.bodyStrong, color: colors.run, fontVariant: ['tabular-nums'] },
  rowSub: { ...typography.tiny, color: colors.textSecondary },
});
