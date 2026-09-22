import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native'
import { Image } from 'expo-image'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import type { GalleryImage } from '../../types/carDetailViewModel.types'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export interface ImageViewerModalProps {
  visible: boolean
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
}

/**
 * ImageViewerModal
 * Fullscreen photo viewer modal.
 * - Double-tap to zoom (1x <-> 2x).
 * - Horizontal swipe gesture between photos when not zoomed.
 * - Clean close button and image index counter.
 */
export function ImageViewerModal({
  visible,
  images,
  initialIndex,
  onClose,
}: ImageViewerModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const count = images.length

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex)
    }
  }, [visible, initialIndex])

  const scale = useSharedValue(1)
  const translateX = useSharedValue(0)

  // Reset scale when index changes
  const changeIndex = (newIdx: number) => {
    setActiveIndex(newIdx)
    scale.value = withTiming(1)
  }

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.2) {
        scale.value = withTiming(1)
      } else {
        scale.value = withTiming(2)
      }
    })

  // Horizontal pan for paging
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      if (scale.value <= 1.1) {
        translateX.value = e.translationX
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1.1) {
        const THRESHOLD = 60
        if (e.translationX < -THRESHOLD && activeIndex < count - 1) {
          runOnJS(changeIndex)(activeIndex + 1)
        } else if (e.translationX > THRESHOLD && activeIndex > 0) {
          runOnJS(changeIndex)(activeIndex - 1)
        }
        translateX.value = withSpring(0)
      }
    })

  const composedGestures = Gesture.Simultaneous(doubleTapGesture, panGesture)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }))

  if (!visible || count === 0) return null

  const currentImage = images[activeIndex] || images[0]

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={s.container}>
        {/* Top Bar with Close & Counter */}
        <View style={s.topBar}>
          <TouchableOpacity
            onPress={onClose}
            style={s.closeButton}
            activeOpacity={0.7}
            testID="btn-close-viewer"
            accessibilityLabel="إغلاق"
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>

          <Text style={s.counterText}>
            {activeIndex + 1} / {count}
          </Text>

          <View style={s.placeholderRight} />
        </View>

        {/* Image Canvas with Double-Tap Zoom & Pan */}
        <View style={s.canvas}>
          <GestureDetector gesture={composedGestures}>
            <Animated.View style={[s.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: currentImage.url }}
                style={s.image}
                contentFit="contain"
                transition={150}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Bottom Tip */}
        <View style={s.bottomBar}>
          <Text style={s.tipText}>اضغط مرتين للتكبير / التصغير</Text>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space8,
    paddingBottom: Spacing.space3,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.white,
  },
  placeholderRight: {
    width: 44,
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    paddingVertical: Spacing.space4,
    alignItems: 'center',
  },
  tipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
})
