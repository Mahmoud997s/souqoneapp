import React, { useMemo } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Image } from 'expo-image'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { CardSystem } from '../../constants/cardSystem'
import { physicalRightStyle, physicalRowDirection } from '../../utils/physicalDirection'
import { useGestureSwiper } from '../../hooks/useGestureSwiper'

export interface CardImageSwiperProps {
  /** Array of image URLs to display */
  images: string[]
  /** Optional total count of images when images array is truncated */
  imageCount?: number
  /** Measured width of the card container in pixels */
  cardWidth: number
  /** Optional custom image height */
  imageHeight?: number
  /** Whether the card is rendered in full-width mode */
  fullWidth?: boolean
  /** When true, disables multi-image swiping and shows a static primary image */
  disableImageSwipe?: boolean
  /** Optional manual gesture direction override */
  invertedGesture?: boolean
  /** Callback fired when the card/image is tapped without panning */
  onPress?: () => void
  /** Callback fired when the active image index changes */
  onActiveIndexChange?: (index: number) => void
  /** Additional container style */
  style?: StyleProp<ViewStyle>
}

/**
 * CardImageSwiper
 *
 * Zero-RTL-dependent image swiper for listing cards.
 * Replaces native ScrollView horizontal pagingEnabled with Gesture.Pan() and Reanimated.
 *
 * - Direct physical touch tracking: swiping right pulls right, swiping left pulls left.
 * - Paging snap: snaps cleanly to each image page.
 * - Physical pagination dots: aligned to physical right-to-left layout matching the images.
 * - Tap support: taps trigger onPress without conflicting with the swipe gesture.
 */
export function CardImageSwiper({
  images,
  imageCount,
  cardWidth,
  imageHeight,
  fullWidth,
  disableImageSwipe = false,
  invertedGesture,
  onPress,
  onActiveIndexChange,
  style,
}: CardImageSwiperProps) {
  const count = imageCount !== undefined ? imageCount : images.length

  const containerHeightStyle = useMemo(() => {
    if (imageHeight) return { height: imageHeight, aspectRatio: undefined }
    if (fullWidth) return { height: CardSystem.fullWidthHeight, aspectRatio: undefined }
    return { height: CardSystem.aspectRatioHeight, aspectRatio: undefined }
  }, [imageHeight, fullWidth])

  const { panGesture, animatedTrackStyle, activeIndex } = useGestureSwiper({
    count,
    step: cardWidth,
    invertedGesture,
    onActiveIndexChange,
    paging: true,
  })

  // Tap gesture composed exclusively with pan gesture:
  // If user drags, pan wins. If user taps (< 250ms, < 10px movement), tap wins.
  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(250)
      .runOnJS(true)
      .onEnd(() => {
        onPress?.()
      })
  }, [onPress])

  const composedGesture = useMemo(() => {
    if (!onPress) return panGesture
    return Gesture.Exclusive(panGesture, tapGesture)
  }, [panGesture, tapGesture, onPress])

  // Case 1: Swipe disabled, single image, or container width not yet measured
  if (disableImageSwipe || count <= 1 || cardWidth <= 0) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.container, containerHeightStyle, style]}
      >
        <Image
          source={{ uri: images[0] }}
          style={styles.imageFill}
          contentFit="cover"
        />
        {count > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={11} color={Colors.white} />
            <Text style={styles.imageCountText}>{count}</Text>
          </View>
        )}
      </Pressable>
    )
  }

  // Case 2: Multi-image swipeable with Gesture.Pan() and Reanimated
  return (
    <GestureDetector gesture={composedGesture}>
      <View style={[styles.container, containerHeightStyle, style]}>
        <Animated.View style={[styles.track, animatedTrackStyle]}>
          {images.map((img, i) => (
            <View
              key={i}
              style={[
                styles.imageSlide,
                {
                  width: cardWidth,
                  ...physicalRightStyle(i * cardWidth),
                },
              ]}
            >
              <Image
                source={{ uri: img }}
                style={styles.imageFill}
                contentFit="cover"
              />
            </View>
          ))}
        </Animated.View>

        {/* Pagination Dots */}
        <View
          pointerEvents="none"
          style={[styles.dotsWrapper, { flexDirection: physicalRowDirection() }]}
        >
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, activeIndex === i && styles.activeDot]}
            />
          ))}
        </View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
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
  imageFill: {
    width: '100%',
    height: '100%',
  },
  dotsWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 14,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: Colors.white,
    fontSize: 10.5,
    fontFamily: 'Almarai_700Bold',
    lineHeight: 14,
  },
})
