import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';
import { addRun } from '../store';
import { computePace } from '../utils/pace';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ManualLogModal: React.FC<Props> = ({ visible, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState('');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setLabel('');
    setDistance('');
    setMinutes('');
    setSeconds('');
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    const km = parseFloat(distance.replace(',', '.'));
    const min = parseInt(minutes, 10) || 0;
    const sec = parseInt(seconds, 10) || 0;
    const duration = min * 60 + sec;
    if (!km || km <= 0 || duration <= 0) {
      setError('Enter both distance and duration.');
      return;
    }
    let iso: string;
    try {
      iso = new Date(date + 'T12:00:00').toISOString();
    } catch {
      iso = new Date().toISOString();
    }
    addRun({
      id: Date.now().toString(36),
      date: iso,
      weekLabel: label.trim() || undefined,
      distanceKm: km,
      durationSeconds: duration,
      paceSecondsPerKm: computePace(duration, km),
      source: 'manual',
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Log a run</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholder="2026-04-26"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Label (optional)</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              style={styles.input}
              placeholder="e.g. lunchtime jog"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Distance (km)</Text>
            <TextInput
              value={distance}
              onChangeText={(v) => { setDistance(v); setError(''); }}
              keyboardType="decimal-pad"
              placeholder="3.5"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationRow}>
              <TextInput
                value={minutes}
                onChangeText={(v) => { setMinutes(v); setError(''); }}
                keyboardType="number-pad"
                placeholder="min"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, styles.durationInput]}
              />
              <Text style={styles.durationSep}>min</Text>
              <TextInput
                value={seconds}
                onChangeText={(v) => { setSeconds(v); setError(''); }}
                keyboardType="number-pad"
                placeholder="sec"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, styles.durationInput]}
              />
              <Text style={styles.durationSep}>sec</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={handleClose} block style={{ flex: 1 }} />
            <Button label="Save"   variant="primary"   onPress={handleSave}  block style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modal: {
    width: '100%', maxWidth: 420,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.lg, gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  field: { gap: 6 },
  label: { ...typography.tiny, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.bgSubtle,
    borderRadius: radii.md,
    paddingVertical: 10, paddingHorizontal: 12,
    color: colors.textPrimary,
    ...typography.body,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  durationInput: { flex: 1 },
  durationSep: { ...typography.small, color: colors.textSecondary },
  error: { color: colors.danger, ...typography.small },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
