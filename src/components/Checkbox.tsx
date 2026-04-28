import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  size?: number;
  hitSlop?: number;
  partial?: boolean;       // shows a dash (week with some-but-not-all done)
};

export const Checkbox: React.FC<Props> = ({
  value,
  onChange,
  size = 22,
  hitSlop = 10,
  partial,
}) => {
  const filled = value || partial;
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={hitSlop}
      style={[
        styles.box,
        { width: size, height: size, borderRadius: radii.sm },
        filled && styles.boxFilled,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      {value ? (
        <Text style={[styles.check, { fontSize: size * 0.65 }]}>✓</Text>
      ) : partial ? (
        <View style={styles.dash} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: colors.bgSubtle,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  check: {
    color: colors.bg,
    fontWeight: '900',
    lineHeight: undefined,
  },
  dash: {
    width: 10,
    height: 2,
    backgroundColor: colors.bg,
    borderRadius: 1,
  },
});
