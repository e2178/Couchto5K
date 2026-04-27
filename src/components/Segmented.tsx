import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
};

export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.bgSubtle,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnActive: {
    backgroundColor: colors.bgSubtle,
  },
  label: {
    ...typography.smallStrong,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
