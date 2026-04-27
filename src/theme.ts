export const colors = {
  bg: '#111827',
  bgElevated: '#1f2937',
  bgSubtle: '#374151',

  run: '#a78bfa',
  runDark: '#8b5cf6',
  runOutline: '#c4b5fd',
  walk: '#f472b6',
  walkDark: '#ec4899',

  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',

  success: '#34d399',
  danger: '#ef4444',

  white: '#ffffff',
} as const;

export const radii = { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const typography = {
  h1: { fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  smallStrong: { fontSize: 13, fontWeight: '600' as const },
  tiny: { fontSize: 10, fontWeight: '400' as const },
};
