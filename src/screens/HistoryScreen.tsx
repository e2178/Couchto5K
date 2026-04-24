import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';

import { theme } from '../theme';
import { useHistory } from '../context/History';
import { formatPace, paceMinPerKm } from '../storage/history';
import { formatDate, formatDuration } from '../lib/format';

export default function HistoryScreen() {
  const { history, addEntry, removeEntry } = useHistory();
  const [formOpen, setFormOpen] = useState(false);
  const [week, setWeek] = useState('');
  const [run, setRun] = useState('');
  const [distance, setDistance] = useState('');
  const [mins, setMins] = useState('');
  const [secs, setSecs] = useState('');
  const [notes, setNotes] = useState('');

  const sortedDesc = useMemo(
    () => [...history].sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [history]
  );

  const chartData = useMemo(() => {
    const paced = history
      .map((e) => ({ date: e.dateISO, pace: paceMinPerKm(e) }))
      .filter((e): e is { date: string; pace: number } => e.pace != null);
    return paced;
  }, [history]);

  const chartWidth = Dimensions.get('window').width - 32;

  function resetForm() {
    setWeek('');
    setRun('');
    setDistance('');
    setMins('');
    setSecs('');
    setNotes('');
  }

  async function save() {
    const w = parseInt(week || '0', 10);
    const r = parseInt(run || '0', 10);
    const dist = parseFloat(distance);
    const m = parseInt(mins || '0', 10);
    const s = parseInt(secs || '0', 10);
    const duration = m * 60 + s;
    if (
      !Number.isFinite(dist) ||
      dist <= 0 ||
      duration <= 0 ||
      w < 1 ||
      w > 12 ||
      r < 1 ||
      r > 3
    ) {
      Alert.alert(
        'Incomplete entry',
        'Enter week (1–12), day (1–3), distance (km), and time.'
      );
      return;
    }
    await addEntry({
      week: w,
      run: r,
      dateISO: new Date().toISOString(),
      durationSeconds: duration,
      distanceKm: dist,
      notes: notes.trim() || undefined,
    });
    resetForm();
    setFormOpen(false);
  }

  function confirmRemove(id: string) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeEntry(id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>
              {history.length} run{history.length === 1 ? '' : 's'} logged
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => setFormOpen((v) => !v)}
          >
            <Text style={styles.addBtnText}>{formOpen ? 'Close' : '+ Log run'}</Text>
          </Pressable>
        </View>

        {formOpen && (
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Week</Text>
                <TextInput
                  value={week}
                  onChangeText={setWeek}
                  keyboardType="number-pad"
                  placeholder="1–12"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Day</Text>
                <TextInput
                  value={run}
                  onChangeText={setRun}
                  keyboardType="number-pad"
                  placeholder="1–3"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Distance (km)</Text>
                <TextInput
                  value={distance}
                  onChangeText={setDistance}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 3.5"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Minutes</Text>
                <TextInput
                  value={mins}
                  onChangeText={setMins}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Seconds</Text>
                <TextInput
                  value={secs}
                  onChangeText={setSecs}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.subtle}
                  style={styles.input}
                />
              </View>
            </View>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              placeholderTextColor={theme.subtle}
              style={[styles.input, { minHeight: 60 }]}
              multiline
            />
            <Pressable style={styles.primaryBtn} onPress={save}>
              <Text style={styles.primaryBtnText}>Save</Text>
            </Pressable>
          </View>
        )}

        {chartData.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Pace over time (min/km)</Text>
            <LineChart
              data={{
                labels: chartData.map((_, i) =>
                  i === 0 || i === chartData.length - 1 || i % Math.max(1, Math.floor(chartData.length / 4)) === 0
                    ? formatShortDate(chartData[i].date)
                    : ''
                ),
                datasets: [{ data: chartData.map((d) => d.pace) }],
              }}
              width={chartWidth - 28}
              height={200}
              yAxisSuffix=""
              yAxisInterval={1}
              fromZero={false}
              chartConfig={{
                backgroundGradientFrom: theme.bgElevated,
                backgroundGradientTo: theme.bgElevated,
                color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                decimalPlaces: 1,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: theme.accent,
                },
                propsForBackgroundLines: {
                  stroke: theme.border,
                  strokeDasharray: '',
                },
              }}
              bezier
              style={{ borderRadius: 10 }}
            />
            <Text style={styles.chartHint}>
              Lower is faster. Expect natural variation session to session.
            </Text>
          </View>
        )}

        {sortedDesc.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No runs logged yet</Text>
            <Text style={styles.emptyBody}>
              Finish a workout on the Workout tab to log it automatically, or
              tap "+ Log run" above to enter one manually.
            </Text>
          </View>
        ) : (
          sortedDesc.map((e) => {
            const pace = paceMinPerKm(e);
            return (
              <View key={e.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryDate}>{formatDate(e.dateISO)}</Text>
                    <Text style={styles.entryTitle}>
                      Week {e.week} · Day {e.run}
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmRemove(e.id)} hitSlop={8}>
                    <Text style={styles.entryDelete}>Delete</Text>
                  </Pressable>
                </View>
                <View style={styles.entryStats}>
                  <StatCell label="Distance" value={`${e.distanceKm.toFixed(2)} km`} />
                  <StatCell
                    label="Time"
                    value={formatDuration(e.durationSeconds)}
                  />
                  <StatCell label="Pace" value={formatPace(pace)} />
                </View>
                {e.notes ? <Text style={styles.entryNotes}>{e.notes}</Text> : null}
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statCellValue}>{value}</Text>
      <Text style={styles.statCellLabel}>{label}</Text>
    </View>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 16, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: theme.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: theme.muted, marginTop: 2 },
  addBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: theme.accentInk, fontWeight: '800' },
  formCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    gap: 10,
  },
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
  primaryBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.accentInk, fontWeight: '800' },
  chartCard: {
    backgroundColor: theme.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  chartTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  chartHint: { color: theme.muted, fontSize: 12, marginTop: 6 },
  emptyCard: {
    backgroundColor: theme.bgElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: theme.muted, fontSize: 13, lineHeight: 18 },
  entry: {
    backgroundColor: theme.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    gap: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: { color: theme.muted, fontSize: 12 },
  entryTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  entryDelete: { color: theme.danger, fontSize: 12 },
  entryStats: { flexDirection: 'row', gap: 10 },
  statCell: {
    flex: 1,
    backgroundColor: theme.bg,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statCellValue: { color: theme.text, fontSize: 15, fontWeight: '700' },
  statCellLabel: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  entryNotes: {
    color: theme.muted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
