import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { physicalRightStyle, physicalRowDirection } from '../../utils/physicalDirection'
import { useGestureSwiper } from '../../hooks/useGestureSwiper'
import type { GalleryImage } from '../../types/carDetailViewModel.types'
import { lineHeightFor } from '../../constants/typography'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export interface ImageGalleryProps {
  images: GalleryImage[]
  index: number
  onIndexChange: (i: number) => void
  onPressImage: (i: number) => void
  aspectRatio?: number
}

/**
 * ImageGallery
 * High-performance image swiper for car detail image showcase.
 * - Uses the repository's standard useGestureSwiper and physicalRightStyle.
 * - Provides real physical touch tracking with continuous multi-image sliding track.
 * - Displays active dot indicators and current image counter.
 * - Composes pan and tap gestures seamlessly so tapping opens fullscreen viewer.
 */
export function ImageGallery({
  images,
  index,
  onIndexChange,
  onPressImage,
  aspectRatio = 16 / 11,
}: ImageGalleryProps) {
  const count = images.length
  const galleryWidth = SCREEN_WIDTH

  const { panGesture, animatedTrackStyle, activeIndex } = useGestureSwiper({
    count,
    step: galleryWidth,
    initialIndex: index,
    onActiveIndexChange: onIndexChange,
    paging: true,
  })

  // Tap gesture composed with pan gesture
  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(250)
      .runOnJS(true)
      .onEnd(() => {
        onPressImage(activeIndex)
      })
  }, [onPressImage, activeIndex])

  const composedGesture = useMemo(() => {
    return Gesture.Exclusive(panGesture, tapGesture)
  }, [panGesture, tapGesture])

  if (count === 0) {
    return (
      <View style={[s.container, { aspectRatio }, s.placeholderContainer]}>
        <Ionicons name="car-sport-outline" size={64} color={Colors.borderStrong} />
        <Text style={s.placeholderText}>لا توجد صور متاحة لهذا الإعلان</Text>
      </View>
    )
  }

  return (
    <View style={[s.container, { aspectRatio }]}>
      <GestureDetector gesture={composedGesture}>
        <View style={s.trackContainer}>
          <Animated.View style={[s.track, animatedTrackStyle]}>
            {images.map((img, i) => {
              const isNearby = Math.abs(i - activeIndex) <= 1
              return (
                <View
                  key={img.id || i}
                  style={[
                    s.imageSlide,
                    {
                      width: galleryWidth,
                      ...physicalRightStyle(i * galleryWidth),
                    },
                  ]}
                >
                  {isNearby ? (
                    <Image
                      source={{ uri: img.url }}
                      style={s.image}
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                      accessibilityLabel={`صورة ${i + 1} من ${count}`}
                    />
                  ) : (
                    <View style={[s.image, s.imagePlaceholder]} />
                  )}
                </View>
              )
            })}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Counter Badge */}
      <View style={s.counterBadge} pointerEvents="none">
        <Ionicons name="images-outline" size={13} color={Colors.white} />
        <Text style={s.counterText}>
          {activeIndex + 1} / {count}
        </Text>
      </View>

      {/* Dots Indicator */}
      {count > 1 ? (
        <View
          style={[s.dotsContainer, { flexDirection: physicalRowDirection() }]}
          pointerEvents="none"
        >
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === activeIndex ? s.dotActive : s.dotInactive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: Colors.inputBg,
    position: 'relative',
    overflow: 'hidden',
  },
  trackContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    ...StyleSheet.absoluteFill,
  },
  imageSlide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.inputBg,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    marginTop: Spacing.space2,
  },
  counterBadge: {
    position: 'absolute',
    bottom: Spacing.space3,
    left: Spacing.space4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 4,
  },
  counterText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.white,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: Spacing.space3,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 14,
    backgroundColor: Colors.white,
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
})
