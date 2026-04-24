import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Segment } from '../types';
import { theme } from '../theme';
import { formatTime } from '../lib/format';

type Props = {
  segments: Segment[];
  activeIndex?: number;
};

export default function SegmentBar({ segments, activeIndex }: Props) {
  const timedTotal = segments.reduce(
    (acc, s) => acc + (s.kind === 'distance' ? 0 : s.seconds),
    0
  );

  if (timedTotal === 0 && segments.some((s) => s.kind === 'distance')) {
    const seg = segments[0];
    return (
      <View style={styles.distanceRow}>
        <View
          style={[
            styles.distancePill,
            activeIndex === 0 && styles.distancePillActive,
          ]}
        >
          <Text style={styles.distanceText}>
            {seg.kind === 'distance' ? `${seg.distanceKm} km` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      {segments.map((s, i) => {
        if (s.kind === 'distance') return null;
        const flex = s.seconds;
        const active = activeIndex === i;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              { flex },
              s.kind === 'run' ? styles.run : styles.walk,
              active && styles.active,
            ]}
          >
            {flex >= 90 ? (
              <Text style={styles.segmentLabel}>{formatTime(flex)}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 26,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.bgMuted,
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.bg,
  },
  run: { backgroundColor: theme.run },
  walk: { backgroundColor: theme.walk },
  active: {
    borderWidth: 2,
    borderColor: theme.accent,
  },
  segmentLabel: {
    fontSize: 10,
    color: '#0b0f19',
    fontWeight: '700',
  },
  distanceRow: {
    flexDirection: 'row',
  },
  distancePill: {
    backgroundColor: theme.distance,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distancePillActive: {
    borderWidth: 2,
    borderColor: theme.accent,
  },
  distanceText: {
    color: '#140020',
    fontWeight: '700',
    fontSize: 13,
  },
});
