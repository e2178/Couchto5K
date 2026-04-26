import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal: React.FC<Props> = ({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        <View style={styles.actions}>
          <Button label={cancelLabel} variant="secondary" onPress={onCancel} block style={{ flex: 1 }} />
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            block
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  </Modal>
);

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
  body: { ...typography.body, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
