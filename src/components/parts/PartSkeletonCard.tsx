import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

interface PartSkeletonCardProps {
  style?: ViewStyle;
  fullWidth?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PartSkeletonCard({ style, fullWidth = false }: PartSkeletonCardProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F1F5F9', '#E2E8F0'],
  });

  return (
    <View style={[s.card, fullWidth && { width: '100%' }, style]}>
      {/* ── Image & Top Badges Placeholder ── */}
      <View style={[s.imageBox, fullWidth && { height: 180 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />

        {/* Top Floating Badges Placeholder */}
        <View style={s.topBadges}>
          <Animated.View style={[s.badgeSkeleton, { backgroundColor: bg }]} />
          <Animated.View style={[s.badgeSkeleton, { width: 45, backgroundColor: bg }]} />
        </View>

        {/* Top Right Action Placeholder */}
        <View style={s.topAction}>
          <Animated.View style={[s.circleSkeleton, { backgroundColor: bg }]} />
        </View>
      </View>

      {/* ── Body & Details ── */}
      <View style={s.body}>
        {/* Title Line (2 lines simulation) */}
        <Animated.View style={[s.titleLine1, { backgroundColor: bg }]} />
        <Animated.View style={[s.titleLine2, { backgroundColor: bg }]} />

        {/* Location & Time Row */}
        <View style={s.locationRow}>
          <Animated.View style={[s.locLine, { backgroundColor: bg }]} />
          <Animated.View style={[s.timeLine, { backgroundColor: bg }]} />
        </View>

        <Animated.View style={[s.divider, { backgroundColor: bg }]} />

        {/* Info Chips Row */}
        <View style={s.chipsRow}>
          <Animated.View style={[s.chip, { width: 70, backgroundColor: bg }]} />
          <Animated.View style={[s.chip, { width: 90, backgroundColor: bg }]} />
          <Animated.View style={[s.chip, { width: 60, backgroundColor: bg }]} />
        </View>

        <Animated.View style={[s.divider, { backgroundColor: bg }]} />

        {/* Footer Row (Price & Badge) */}
        <View style={s.footerRow}>
          <Animated.View style={[s.priceLine, { backgroundColor: bg }]} />
          <Animated.View style={[s.negotiablePill, { backgroundColor: bg }]} />
        </View>
      </View>
    </View>
  );
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
});

const s = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.6,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    ...softShadow,
  },
  imageBox: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  topBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badgeSkeleton: {
    width: 65,
    height: 22,
    borderRadius: 100,
  },
  topAction: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  circleSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  body: {
    padding: Spacing.space3,
    gap: 8,
  },
  titleLine1: {
    width: '90%',
    height: 16,
    borderRadius: 8,
  },
  titleLine2: {
    width: '60%',
    height: 14,
    borderRadius: 7,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  locLine: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  timeLine: {
    width: 50,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    height: 24,
    borderRadius: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceLine: {
    width: 90,
    height: 20,
    borderRadius: 8,
  },
  negotiablePill: {
    width: 65,
    height: 20,
    borderRadius: 6,
  },
});
