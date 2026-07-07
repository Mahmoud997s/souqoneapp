import { useEffect, useRef } from 'react'
import { View, ViewStyle, StyleSheet, Animated } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start()
  }, [])

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.surface, Colors.border] })

  return (
    <View style={[s.card, style]}>
      {/* Image — matches UnifiedCard aspectRatio 4/3 */}
      <Animated.View style={[s.image, { backgroundColor: bg }]} />

      <View style={s.body}>
        {/* Title row */}
        <View style={s.row}>
          <Animated.View style={[s.titleLine, { backgroundColor: bg }]} />
          <Animated.View style={[s.badge, { backgroundColor: bg }]} />
        </View>
        {/* Chips row */}
        <View style={s.row}>
          <Animated.View style={[s.chip, { backgroundColor: bg }]} />
          <Animated.View style={[s.chip, { backgroundColor: bg }]} />
          <Animated.View style={[s.chip, { backgroundColor: bg }]} />
        </View>
        {/* Divider */}
        <Animated.View style={[s.divider, { backgroundColor: bg }]} />
        {/* Footer */}
        <View style={s.footer}>
          <Animated.View style={[s.locLine, { backgroundColor: bg }]} />
          <Animated.View style={[s.priceLine, { backgroundColor: bg }]} />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  body: {
    padding: Spacing.space3,
    gap: Spacing.space3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  titleLine: {
    flex: 1,
    height: 14,
    borderRadius: 7,
  },
  badge: {
    width: 52,
    height: 20,
    borderRadius: 10,
  },
  chip: {
    width: 64,
    height: 24,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    borderRadius: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locLine: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  priceLine: {
    width: 90,
    height: 20,
    borderRadius: 10,
  },
})
