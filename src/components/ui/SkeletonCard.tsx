import { useEffect, useRef } from 'react'
import { View, ViewStyle, StyleSheet, Animated } from 'react-native'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'

export interface SkeletonCardProps {
  style?: ViewStyle
  fullWidth?: boolean
  imageHeight?: number
  compactBody?: boolean
}

export function SkeletonCard({
  style,
  fullWidth = false,
  imageHeight: imageHeightProp,
  compactBody = false,
}: SkeletonCardProps) {
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

  const imageHeight = imageHeightProp
    ? imageHeightProp
    : fullWidth
    ? CardSystem.fullWidthHeight
    : CardSystem.aspectRatioHeight

  return (
    <View style={[s.card, fullWidth && { width: '100%' }, style]}>
      <Animated.View style={{ opacity }}>
        {/* Image — aspectRatio 4/3 */}
        <View style={[s.image, { height: imageHeight }, s.placeholder]} />

        <View testID="skeleton-card-body" style={[s.body, compactBody && s.bodyCompact]}>
          {/* Title row */}
          <View style={s.row}>
            <View style={[s.titleLine, s.placeholder]} />
            <View style={[s.badge, s.placeholder]} />
          </View>

          {/* Location row */}
          <View style={[s.locationRow, compactBody && { marginTop: 2, marginBottom: 4 }]}>
            <View style={[s.locLine, s.placeholder]} />
          </View>

          {/* Divider */}
          <View style={[s.divider, compactBody && { marginTop: 1, marginBottom: 5 }]} />

          {/* Chips row */}
          <View style={s.chipsRow}>
            <View style={[s.chip, s.placeholder]} />
            <View style={[s.chip, s.placeholder]} />
            <View style={[s.chip, s.placeholder]} />
          </View>

          {/* Footer divider */}
          <View style={[s.divider, compactBody && { marginTop: 1, marginBottom: 5 }]} />

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
  bodyCompact: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
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

export const skeletonCardStyles = s

/**
 * Pure calculation helper (static estimate from styles, NOT measured on a device).
 * Derives the static vertical height of the skeleton card body by summing
 * each row's vertical padding, margin, and placeholder heights.
 */
export function computeStaticSkeletonBodyHeight(styles: typeof s = s, isCompact: boolean = false): number {
  const bodyPadding = isCompact ? styles.bodyCompact : styles.body
  const padTop = Number(bodyPadding.paddingTop ?? 0)
  const padBottom = Number(bodyPadding.paddingBottom ?? 0)

  // Title / Badge row: max of titleLine.height (14) and badge.height (18) = 18
  const rowHeight = Math.max(Number(styles.titleLine.height ?? 0), Number(styles.badge.height ?? 0))

  // Location row: marginTop (2) + marginBottom (4) + locLine.height (11)
  const locMarginTop = isCompact ? 2 : Number(styles.locationRow.marginTop ?? 3)
  const locMarginBottom = isCompact ? 4 : Number(styles.locationRow.marginBottom ?? 5)
  const locHeight = Number(styles.locLine.height ?? 11)
  const locationTotal = locMarginTop + locMarginBottom + locHeight

  // Divider 1: height (1) + marginTop (1) + marginBottom (5)
  const divHeight = Number(styles.divider.height ?? 1)
  const divMarginTop = Number(styles.divider.marginTop ?? 1)
  const divMarginBottom = isCompact ? 5 : Number(styles.divider.marginBottom ?? 5)
  const divider1Total = divHeight + divMarginTop + divMarginBottom

  // Chips row: chip.height (20) + chipsRow.marginBottom (5)
  const chipHeight = Number(styles.chip.height ?? 20)
  const chipsMarginBottom = Number(styles.chipsRow.marginBottom ?? 5)
  const chipsTotal = chipHeight + chipsMarginBottom

  // Divider 2: height (1) + marginTop (1) + marginBottom (5)
  const divider2Total = divHeight + divMarginTop + divMarginBottom

  // Footer: priceLine.height (18)
  const footerHeight = Math.max(Number(styles.timeLine.height ?? 0), Number(styles.priceLine.height ?? 0))

  return (
    padTop +
    padBottom +
    rowHeight +
    locationTotal +
    divider1Total +
    chipsTotal +
    divider2Total +
    footerHeight
  )
}
