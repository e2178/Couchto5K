import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';
import type { Segment } from '../types';

type Props = {
  segments: Segment[];
  height?: number;
  activeIndex?: number;
  finished?: boolean;
};

export const SegmentBar: React.FC<Props> = ({
  segments,
  height = 10,
  activeIndex,
  finished,
}) => {
  return (
    <View style={[styles.bar, { height }]}>
      {segments.map((seg, i) => {
        const isCompleted = finished || (activeIndex != null && i < activeIndex);
        const isActive = !finished && activeIndex === i;
        return (
          <SegmentNode
            key={i}
            kind={seg.kind}
            weight={seg.sec}
            completed={isCompleted}
            active={isActive}
          />
        );
      })}
    </View>
  );
};

const SegmentNode: React.FC<{
  kind: 'run' | 'walk';
  weight: number;
  completed: boolean;
  active: boolean;
}> = ({ kind, weight, completed, active }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      opacity.stopAnimation();
      opacity.setValue(completed ? 0.3 : 1);
      return;
    }
    opacity.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, completed, opacity]);

  const baseColor = kind === 'run' ? colors.run : colors.walk;
  const borderStyle: ViewStyle = active
    ? { borderWidth: 2, borderColor: colors.runOutline }
    : {};

  return (
    <Animated.View
      style={[
        styles.seg,
        { backgroundColor: baseColor, flexGrow: weight, flexShrink: weight, opacity },
        borderStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 2,
    overflow: 'visible',
  },
  seg: {
    flexBasis: 0,
    borderRadius: radii.sm,
    minWidth: 2,
  },
});
