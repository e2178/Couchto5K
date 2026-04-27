import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, typography } from '../theme';

type Variant = 'primary' | 'ghost' | 'secondary' | 'quiet' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  size?: 'sm' | 'md';
  block?: boolean;
  style?: ViewStyle;
};

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  size = 'md',
  block,
  style,
}) => {
  const containerStyles = [
    styles.base,
    size === 'sm' ? styles.sm : styles.md,
    variantContainer[variant],
    block && styles.block,
    disabled && styles.disabled,
    style,
  ];
  const textStyles = [
    styles.label,
    size === 'sm' && styles.labelSm,
    variantText[variant],
  ];
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={containerStyles}>
      <Text style={textStyles}>{label}</Text>
    </Pressable>
  );
};

const variantContainer: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.run },
  ghost:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.run },
  secondary: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.bgSubtle },
  quiet:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.bgSubtle },
  danger:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
};

const variantText = {
  primary: { color: colors.white },
  ghost: { color: colors.run },
  secondary: { color: colors.textPrimary },
  quiet: { color: colors.textSecondary },
  danger: { color: colors.danger },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  sm: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  label: {
    ...typography.bodyStrong,
  },
  labelSm: {
    ...typography.smallStrong,
  },
});
