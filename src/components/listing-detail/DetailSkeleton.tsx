import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, ScrollView } from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import { DetailTopBar } from './DetailTopBar'

export interface DetailSkeletonProps {
  onBack?: () => void
  testID?: string
  fallbackReducedMotion?: boolean
}

/**
 * DetailSkeleton
 * Shared skeleton screen imitating the listing detail layout:
 * - Gallery hero block
 * - Title, price, and location metadata lines
 * - Seller profile card placeholder
 * - Description and specifications block
 * - Bottom contact action bar placeholder
 *
 * Honors useAppReducedMotion: loops opacity shimmer when false, static when true.
 * Uses 100% Colors design tokens without raw hex values.
 */
export function DetailSkeleton({
  onBack,
  testID = 'detail-skeleton',
  fallbackReducedMotion,
}: DetailSkeletonProps) {
  const isReducedMotion = useAppReducedMotion(
    fallbackReducedMotion !== undefined ? () => fallbackReducedMotion : undefined
  )
  const opacity = useRef(new Animated.Value(isReducedMotion ? 0.7 : 0.45)).current

  useEffect(() => {
    if (isReducedMotion) {
      opacity.setValue(0.7)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity, isReducedMotion])

  return (
    <View style={s.container} testID={testID}>
      {/* Top Bar with back action */}
      {onBack && <DetailTopBar onBack={onBack} testID="detail-skeleton-top-bar" />}

      {/* Main Skeleton Content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <Animated.View style={{ opacity }} testID="detail-skeleton-animated-body">
          {/* 1. Hero Gallery Block */}
          <View style={[s.galleryBlock, s.placeholder]} testID="skeleton-gallery-block" />

          <View style={s.bodyPadding}>
            {/* 2. Header Info Block */}
            <View style={s.headerBlock}>
              <View style={[s.titleLine, s.placeholder]} testID="skeleton-title-line" />
              <View style={[s.subTitleLine, s.placeholder]} />
              <View style={[s.priceBlock, s.placeholder]} testID="skeleton-price-block" />
              <View style={[s.locationLine, s.placeholder]} />
            </View>

            <View style={s.divider} />

            {/* 3. Seller Card Block */}
            <View style={s.sellerCard} testID="skeleton-seller-card">
              <View style={[s.avatarCircle, s.placeholder]} />
              <View style={s.sellerInfoCol}>
                <View style={[s.sellerNameLine, s.placeholder]} />
                <View style={[s.sellerBadgeLine, s.placeholder]} />
              </View>
            </View>

            <View style={s.divider} />

            {/* 4. Specifications & Description Block */}
            <View style={s.specsBlock}>
              <View style={[s.sectionTitleLine, s.placeholder]} />
              <View style={[s.descLineFull, s.placeholder]} />
              <View style={[s.descLineMid, s.placeholder]} />
              <View style={[s.descLineShort, s.placeholder]} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 5. Bottom Contact Bar Placeholder */}
      <View style={s.bottomBar} testID="skeleton-bottom-bar">
        <View style={[s.bottomButton, s.placeholder]} />
        <View style={[s.bottomButton, s.placeholder]} />
        <View style={[s.bottomButton, s.placeholder]} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  placeholder: {
    backgroundColor: Colors.inputBg,
  },
  galleryBlock: {
    width: '100%',
    height: 250,
  },
  bodyPadding: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
  },
  headerBlock: {
    gap: Spacing.space2,
  },
  titleLine: {
    height: 20,
    width: '75%',
    borderRadius: Radius.sm,
  },
  subTitleLine: {
    height: 14,
    width: '45%',
    borderRadius: Radius.sm,
  },
  priceBlock: {
    height: 26,
    width: '35%',
    borderRadius: Radius.sm,
    marginTop: Spacing.space1,
  },
  locationLine: {
    height: 14,
    width: '50%',
    borderRadius: Radius.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.space4,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.space4,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.space3,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerInfoCol: {
    flex: 1,
    gap: Spacing.space2,
  },
  sellerNameLine: {
    height: 16,
    width: '60%',
    borderRadius: Radius.sm,
  },
  sellerBadgeLine: {
    height: 12,
    width: '40%',
    borderRadius: Radius.sm,
  },
  specsBlock: {
    gap: Spacing.space2,
  },
  sectionTitleLine: {
    height: 18,
    width: 110,
    borderRadius: Radius.sm,
    marginBottom: Spacing.space1,
  },
  descLineFull: {
    height: 12,
    width: '100%',
    borderRadius: Radius.sm,
  },
  descLineMid: {
    height: 12,
    width: '85%',
    borderRadius: Radius.sm,
  },
  descLineShort: {
    height: 12,
    width: '60%',
    borderRadius: Radius.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    gap: Spacing.space3,
  },
  bottomButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
  },
})
