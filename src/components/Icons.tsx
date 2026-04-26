import React from 'react';
import { Text } from 'react-native';

/* Lightweight inline glyph "icons" via system-supported unicode characters.
 * Avoids pulling react-native-svg or vector-icons into Expo Go. */

type Props = { size?: number; color?: string };

const glyph = (char: string) => ({ size = 18, color = '#fff' }: Props) => (
  <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>{char}</Text>
);

export const IconCheck    = glyph('✓');
export const IconChevDown = glyph('⌄');
export const IconChevUp   = glyph('⌃');
export const IconGear     = glyph('⚙');
export const IconCal      = glyph('📅');
export const IconRun      = glyph('▶');
export const IconHistory  = glyph('⟳');
export const IconPlus     = glyph('＋');
