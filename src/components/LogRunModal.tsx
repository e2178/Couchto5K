import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';
import { addRun, settings } from '../store';
import { computePace } from '../utils/pace';
import { formatTimeLoose } from '../utils/time';

type Props = {
  visible: boolean;
  durationSeconds: number;
  weekLabel?: string;
  partial?: boolean;
  onClose: (saved: boolean) => void;
};

export const LogRunModal: React.FC<Props> = ({
  visible,
  durationSeconds,
  weekLabel,
  partial,
  onClose,
}) => {
  const [distance, setDistance] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const km = parseFloat(distance.replace(',', '.'));
    if (!km || km <= 0) {
      setError('Enter a distance greater than 0.');
      return;
    }
    addRun({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      weekLabel,
      distanceKm: km,
      durationSeconds,
      paceSecondsPerKm: computePace(durationSeconds, km),
      source: 'auto',
    });
    setDistance('');
    setError('');
    onClose(true);
  };

  const handleSkip = () => {
    setDistance('');
    setError('');
    onClose(false);
  };

  if (!settings.get().autoLogEnabled) {
    if (visible) onClose(false);
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{partial ? 'Log partial run?' : 'Log this run?'}</Text>
          <Text style={styles.body}>
            {partial
              ? 'You finished early. Enter the distance you covered.'
              : 'Nice work. Enter the distance you covered.'}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.duration}>{formatTimeLoose(durationSeconds)}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Distance (km)</Text>
            <TextInput
              value={distance}
              onChangeText={(v) => { setDistance(v); setError(''); }}
              placeholder="e.g. 2.5"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              style={styles.input}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Button label="Skip" variant="secondary" onPress={handleSkip} block style={{ flex: 1 }} />
            <Button label="Save"  variant="primary"   onPress={handleSave} block style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  body:  { ...typography.body, color: colors.textSecondary },
  field: { gap: 6 },
  label: { ...typography.tiny, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  duration: { ...typography.h2, color: colors.textPrimary },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    ...typography.body,
  },
  error: { color: colors.danger, ...typography.small },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
