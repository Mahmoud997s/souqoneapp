import { useEffect, useRef } from 'react'
import { View, ViewStyle, StyleSheet, Animated } from 'react-native'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'

export interface SkeletonCardProps {
  style?: ViewStyle
  fullWidth?: boolean
}

export function SkeletonCard({ style, fullWidth = false }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.45)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  const imageHeight = fullWidth
    ? CardSystem.fullWidthHeight
    : CardSystem.aspectRatioHeight

  return (
    <View style={[s.card, fullWidth && { width: '100%' }, style]}>
      <Animated.View style={{ opacity }}>
        {/* Image — matches UnifiedCard aspectRatio 4/3 */}
        <View style={[s.image, { height: imageHeight }, s.placeholder]} />

        <View style={s.body}>
          {/* Title row */}
          <View style={s.row}>
            <View style={[s.titleLine, s.placeholder]} />
            <View style={[s.badge, s.placeholder]} />
          </View>

          {/* Location row */}
          <View style={s.locationRow}>
            <View style={[s.locLine, s.placeholder]} />
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Chips row */}
          <View style={s.chipsRow}>
            <View style={[s.chip, s.placeholder]} />
            <View style={[s.chip, s.placeholder]} />
            <View style={[s.chip, s.placeholder]} />
          </View>

          {/* Footer divider */}
          <View style={s.divider} />

          {/* Footer */}
          <View style={s.footer}>
            <View style={[s.timeLine, s.placeholder]} />
            <View style={[s.priceLine, s.placeholder]} />
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CardSystem.gap.primary,
  },
  titleLine: {
    flex: 1,
    height: 14,
    borderRadius: 7,
  },
  badge: {
    width: 44,
    height: 18,
    borderRadius: CardSystem.radius.badge,
  },
  locationRow: {
    marginTop: 3,
    marginBottom: 5,
  },
  locLine: {
    width: 75,
    height: 11,
    borderRadius: 5.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 1,
    marginBottom: 5,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  chip: {
    width: 48,
    height: 20,
    borderRadius: CardSystem.radius.inner,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLine: {
    width: 55,
    height: 11,
    borderRadius: 5.5,
  },
  priceLine: {
    width: 75,
    height: 18,
    borderRadius: 9,
  },
})
