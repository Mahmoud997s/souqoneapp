import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import type { GalleryImage } from '../../types/carDetailViewModel.types'

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
 * Pager component for car detail image showcase.
 * - Avoids native horizontal ScrollView paging to prevent RTL inverted offset bugs.
 * - Uses Gesture.Pan to smoothly handle left/right swipe gestures.
 * - Displays active dot indicators and current image counter.
 * - Gracefully renders a placeholder when images array is empty.
 */
export function ImageGallery({
  images,
  index,
  onIndexChange,
  onPressImage,
  aspectRatio = 16 / 10,
}: ImageGalleryProps) {
  const count = images.length
  const translateX = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX
    })
    .onEnd((e) => {
      const SWIPE_THRESHOLD = 50
      if (e.translationX < -SWIPE_THRESHOLD && index < count - 1) {
        runOnJS(onIndexChange)(index + 1)
      } else if (e.translationX > SWIPE_THRESHOLD && index > 0) {
        runOnJS(onIndexChange)(index - 1)
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 120 })
    })

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  if (count === 0) {
    return (
      <View style={[s.container, { aspectRatio }, s.placeholderContainer]}>
        <Ionicons name="car-sport-outline" size={64} color={Colors.borderStrong} />
        <Text style={s.placeholderText}>لا توجد صور متاحة لهذا الإعلان</Text>
      </View>
    )
  }

  const currentImage = images[index] || images[0]

  return (
    <View style={[s.container, { aspectRatio }]}>
      <GestureDetector gesture={panGesture}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => onPressImage(index)}
          style={s.imageWrapper}
          testID="gallery-image-touchable"
        >
          <Animated.View style={[s.imageWrapper, animatedImageStyle]}>
            <Image
              source={{ uri: currentImage.url }}
              style={s.image}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`صورة ${index + 1} من ${count}`}
            />
          </Animated.View>
        </TouchableOpacity>
      </GestureDetector>

      {/* Counter Badge */}
      <View style={s.counterBadge}>
        <Ionicons name="images-outline" size={13} color={Colors.white} />
        <Text style={s.counterText}>
          {index + 1} / {count}
        </Text>
      </View>

      {/* Dots Indicator */}
      {count > 1 ? (
        <View style={s.dotsContainer}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === index ? s.dotActive : s.dotInactive,
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
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
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
    lineHeight: 14,
    color: Colors.white,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: Spacing.space3,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.white,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
})
