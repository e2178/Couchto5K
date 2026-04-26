import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export const Toggle: React.FC<Props> = ({ value, onChange, disabled }) => (
  <Pressable
    onPress={() => !disabled && onChange(!value)}
    style={[
      styles.track,
      value && styles.trackOn,
      disabled && styles.disabled,
    ]}
    accessibilityRole="switch"
    accessibilityState={{ checked: value, disabled }}
  >
    <View style={[styles.thumb, value && styles.thumbOn]} />
  </Pressable>
);

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.bgSubtle,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.run,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textPrimary,
  },
  thumbOn: {
    transform: [{ translateX: 20 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
