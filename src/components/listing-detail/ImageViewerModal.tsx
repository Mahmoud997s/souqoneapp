import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { getGestureDirectionMultiplier } from '../../utils/physicalDirection'
import type { GalleryImage } from '../../types/carDetailViewModel.types'
import { Typography, lineHeightFor } from '../../constants/typography'
import { GALLERY_CATEGORY_ICONS, type GalleryCategory } from './ImageGallery'

export const TOP_BAR_SAFE_MARGIN = Spacing.space3
export const BOTTOM_BAR_SAFE_MARGIN = Spacing.space3

export interface ImageViewerModalProps {
  visible: boolean
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
  category?: GalleryCategory
  fallbackIcon?: keyof typeof Ionicons.glyphMap
}

/**
 * ImageViewerModal
 * Fullscreen photo viewer modal.
 * - Double-tap to zoom (1x <-> 2x).
 * - Horizontal swipe gesture between photos when not zoomed.
 * - Clean close button and image index counter.
 * - Category-aware fallback when image fails to load.
 */
export function ImageViewerModal({
  visible,
  images,
  initialIndex,
  onClose,
  category,
  fallbackIcon,
}: ImageViewerModalProps) {
  const insets = useSafeAreaInsets()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [modalFailedIndices, setModalFailedIndices] = useState<Record<number, boolean>>({})
  const count = images.length

  const resolvedFallbackIcon =
    fallbackIcon ||
    (category && GALLERY_CATEGORY_ICONS[category]) ||
    'car-sport-outline'

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex)
      setModalFailedIndices({})
    }
  }, [visible, initialIndex])

  const scale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  // Compute once on JS thread — safe to capture in worklet closure
  const gestureDir = getGestureDirectionMultiplier()

  // Reset scale and translation when index changes
  const changeIndex = (newIdx: number) => {
    setActiveIndex(newIdx)
    scale.value = withTiming(1)
    translateY.value = withSpring(0)
  }

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.15) {
        scale.value = withTiming(1)
      } else {
        scale.value = withTiming(1.65)
      }
    })

  // Pan gesture: horizontal swipe for paging + vertical swipe-down to dismiss
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onUpdate((e) => {
      if (scale.value <= 1.05) {
        translateX.value = e.translationX
        translateY.value = Math.max(0, e.translationY)
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1.05) {
        if (e.translationY > 80 && e.translationY > Math.abs(e.translationX)) {
          runOnJS(onClose)()
        } else {
          const dx = e.translationX * gestureDir
          const THRESHOLD = 50
          if (dx > THRESHOLD && activeIndex < count - 1) {
            runOnJS(changeIndex)(activeIndex + 1)
          } else if (dx < -THRESHOLD && activeIndex > 0) {
            runOnJS(changeIndex)(activeIndex - 1)
          }
        }
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
      }
    })

  const composedGestures = Gesture.Simultaneous(doubleTapGesture, panGesture)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  if (!visible || count === 0) return null

  const currentImage = images[activeIndex] || images[0]

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={s.container}>
        {/* Top Bar with Close & Counter */}
        <View
          style={[s.topBar, { paddingTop: insets.top + TOP_BAR_SAFE_MARGIN }]}
          testID="viewer-top-bar"
        >
          <TouchableOpacity
            onPress={onClose}
            style={s.closeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="btn-close-viewer"
            accessibilityLabel="إغلاق"
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={s.counterPill} testID="viewer-counter-pill">
            <Text style={s.counterText}>
              {activeIndex + 1} / {count}
            </Text>
          </View>

          <View style={s.placeholderRight} />
        </View>

        {/* Image Canvas with Double-Tap Zoom & Pan */}
        <View style={s.canvas}>
          <GestureDetector gesture={composedGestures}>
            <Animated.View
              style={[
                s.imageContainer,
                { width: windowWidth, height: windowHeight * 0.68 },
                animatedStyle,
              ]}
            >
              {modalFailedIndices[activeIndex] ? (
                <View
                  style={[s.image, s.fallbackContainer]}
                  testID={`viewer-image-fallback-${activeIndex}`}
                >
                  <Ionicons
                    name={resolvedFallbackIcon}
                    size={64}
                    color={Colors.borderStrong}
                    testID="viewer-image-fallback-icon"
                  />
                  <Text style={s.modalFallbackText}>تعذر تحميل الصورة</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: currentImage.url }}
                  style={s.image}
                  contentFit="contain"
                  transition={150}
                  onError={() => {
                    setModalFailedIndices((prev) =>
                      prev[activeIndex] ? prev : { ...prev, [activeIndex]: true }
                    )
                  }}
                  testID="viewer-active-image"
                />
              )}
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Bottom Tip */}
        <View
          style={[s.bottomBar, { paddingBottom: insets.bottom + BOTTOM_BAR_SAFE_MARGIN }]}
          testID="viewer-bottom-bar"
        >
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
    paddingBottom: Spacing.space2,
    zIndex: 10,
  },
  closeButton: {
    width: Spacing.touch,
    height: Spacing.touch,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterPill: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(25, 36, 53, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: lineHeightFor(15),
    color: Colors.white,
  },
  placeholderRight: {
    width: Spacing.touch,
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFallbackText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    marginTop: Spacing.space3,
  },
  bottomBar: {
    paddingTop: Spacing.space3,
    alignItems: 'center',
  },
  tipText: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: Typography.caption.fontSize,
    lineHeight: lineHeightFor(Typography.caption.fontSize),
    color: 'rgba(255, 255, 255, 0.85)',
  },
})
