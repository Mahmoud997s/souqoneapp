import { useEffect, useRef } from 'react'
import { View, ViewStyle, StyleSheet, Animated } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

export function TransportSkeletonCard({ style }: { style?: ViewStyle }) {
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
      {/* Route Row Skeleton */}
      <View style={s.routeRow}>
        <Animated.View style={[s.circle, { backgroundColor: bg }]} />
        <Animated.View style={[s.line, { backgroundColor: bg }]} />
        <Animated.View style={[s.circle, { backgroundColor: bg }]} />
      </View>

      <Animated.View style={[s.divider, { backgroundColor: bg }]} />

      {/* Details Row */}
      <View style={s.detailsRow}>
        <Animated.View style={[s.textLine, { width: 100, backgroundColor: bg }]} />
        <Animated.View style={[s.textLine, { width: 80, backgroundColor: bg }]} />
      </View>

      {/* Pills Row */}
      <View style={s.pillsRow}>
        <Animated.View style={[s.pill, { width: 60, backgroundColor: bg }]} />
        <Animated.View style={[s.pill, { width: 80, backgroundColor: bg }]} />
        <Animated.View style={[s.pill, { width: 70, backgroundColor: bg }]} />
      </View>

      <Animated.View style={[s.divider, { backgroundColor: bg }]} />

      {/* Footer */}
      <View style={s.footer}>
        <Animated.View style={[s.priceBlock, { backgroundColor: bg }]} />
        <Animated.View style={[s.dateBlock, { backgroundColor: bg }]} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.space4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.space3,
    borderRadius: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.space3,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  textLine: {
    height: 16,
    borderRadius: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
  },
  pill: {
    height: 26,
    borderRadius: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.space2,
  },
  priceBlock: {
    width: 120,
    height: 28,
    borderRadius: 14,
  },
  dateBlock: {
    width: 90,
    height: 16,
    borderRadius: 8,
  },
})
