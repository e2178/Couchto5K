import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';
import { addRun, deleteRun, updateRun } from '../store';
import { computePace } from '../utils/pace';
import type { Run } from '../types';

type Props = {
  visible: boolean;
  /* If provided, the modal switches to "edit" mode for this run. */
  existingRun?: Run | null;
  onClose: () => void;
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const minutesOf = (durationSeconds: number): string =>
  String(Math.floor(durationSeconds / 60));

const secondsOf = (durationSeconds: number): string =>
  String(Math.round(durationSeconds % 60));

export const ManualLogModal: React.FC<Props> = ({ visible, existingRun, onClose }) => {
  const isEdit = !!existingRun;

  const [date, setDate] = useState(todayIso());
  const [label, setLabel] = useState('');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [error, setError] = useState('');

  /* Sync form fields when the modal opens or when the run changes. */
  useEffect(() => {
    if (!visible) return;
    if (existingRun) {
      setDate(existingRun.date.slice(0, 10));
      setLabel(existingRun.weekLabel ?? '');
      setDistance(String(existingRun.distanceKm));
      setMinutes(minutesOf(existingRun.durationSeconds));
      setSeconds(secondsOf(existingRun.durationSeconds));
    } else {
      setDate(todayIso());
      setLabel('');
      setDistance('');
      setMinutes('');
      setSeconds('');
    }
    setError('');
  }, [visible, existingRun]);

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

    if (existingRun) {
      updateRun(existingRun.id, {
        date: iso,
        weekLabel: label.trim() || undefined,
        distanceKm: km,
        durationSeconds: duration,
        paceSecondsPerKm: computePace(duration, km),
      });
    } else {
      addRun({
        id: Date.now().toString(36),
        date: iso,
        weekLabel: label.trim() || undefined,
        distanceKm: km,
        durationSeconds: duration,
        paceSecondsPerKm: computePace(duration, km),
        source: 'manual',
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!existingRun) return;
    Alert.alert('Delete run?', 'This permanently removes the run from history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => { deleteRun(existingRun.id); onClose(); },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{isEdit ? 'Edit run' : 'Log a run'}</Text>

          <Field label="Date (YYYY-MM-DD)">
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholder="2026-04-26"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
            />
          </Field>

          <Field label="Label (optional)">
            <TextInput
              value={label}
              onChangeText={setLabel}
              style={styles.input}
              placeholder="e.g. lunchtime jog"
              placeholderTextColor={colors.textTertiary}
            />
          </Field>

          <Field label="Distance (km)">
            <TextInput
              value={distance}
              onChangeText={(v) => { setDistance(v); setError(''); }}
              keyboardType="decimal-pad"
              placeholder="3.5"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
          </Field>

          <Field label="Duration">
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
          </Field>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} block style={{ flex: 1 }} />
            <Button label="Save"   variant="primary"   onPress={handleSave} block style={{ flex: 1 }} />
          </View>

          {isEdit ? (
            <Button label="Delete run" variant="danger" onPress={handleDelete} block />
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

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
