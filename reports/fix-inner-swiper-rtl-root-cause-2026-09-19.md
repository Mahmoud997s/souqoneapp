# تقرير إصلاح العلة الجذرية: سوايبر الصور الداخلي للكروت (RTL / Fabric Root Cause Fix)

**التاريخ**: 2026-09-19  
**الملفات المعدلة والمستحدثة**:
- `src/hooks/useGestureSwiper.ts` (جديد - استخراج محرك السحب والفيزياء المشترك)
- `src/components/ui/CardImageSwiper.tsx` (جديد - سوايبر صور الكروت المبني على Gesture.Pan و Reanimated)
- `src/components/ui/ListingCardBase.tsx` (تحديث - استبدال ScrollView القديم بـ CardImageSwiper)
- `src/components/ui/HorizontalScrollCard.tsx` (تحديث - إعادة استخدام useGestureSwiper المشترك لمنع تكرار الكود)
- `src/__tests__/useGestureSwiper.spec.ts` (جديد - اختبارات شاملة لحسابات الفيزياء والإزاحة ونقاط الترقيم)

---

## 1. الملخص وجذر المشكلة (Root Cause Analysis)

### المشكلة:
- كان سوايبر الصور الداخلي في `ListingCardBase.tsx` يعتمد على `<ScrollView horizontal pagingEnabled>` الأصلي لـ React Native.
- على معمارية Fabric (New Architecture) مع تفعيل RTL الإجباري (`I18nManager.forceRTL(true)`) على أندرويد، يعاني `ScrollView horizontal` من علة جوهرية في ترجمة إحداثيات السحب:
  1. اللمس وسحب الإصبع لليمين يترجم فيزيائياً بشكل مقلوب ويحرك الصور لليسار أو يقفز بشكل عشوائي.
  2. ترتيب تقليب الصور وترقيمها ينعكس أو يتشوه.
  3. إصلاح `Math.abs()` السابق عالج فقط عدم ظهور أرقام سالبة في مؤشر النقاط (dots)، لكنه لم يعالج السحب الفيزيائي للمكون الأصلي.

### الحل الجذري:
1. **استئصال `ScrollView` بالكامل**: تم استبدال `ScrollView horizontal pagingEnabled` بمنطق سحب قائم على `Gesture.Pan()` من مكتبة `react-native-gesture-handler` ومحرك الحركة `react-native-reanimated`.
2. **الاعتماد على المرجع الموحد `physicalDirection.ts`**:
   - اتجاه السحب يحسب عبر `getGestureDirectionMultiplier()` (يعطي `1` في RTL و `-1` في LTR)، مما يضمن حركة الإصبع لليمين تحرك المسار لليمين بنسبة 1:1 فيزيائية مباشرة.
   - وضع كل صورة `i` يتم فيزيائياً عبر `...physicalRightStyle(i * cardWidth)` دون الاعتماد على محاذاة الفابريك العكسية.
   - نقاط الترقيم ترتب عبر `flexDirection: physicalRowDirection()` لتطابق تموضع الصور الفيزيائي من اليمين لليسار تماماً.
3. **تطبيق قاعدة Clean Code واستخراج المحرك المشترك**:
   - تم استخراج كل معادلات الحركة، ونوابض الارتداد (Springs)، وحدود السحب والمقاومة المطاطية (Rubber-banding)، وسرعة النقر السريع (Velocity flick > 400 px/s) في هوك مشترك مستقل: `src/hooks/useGestureSwiper.ts`.
   - تم ربط كل من `HorizontalScrollCard` وقوائم الكروت، وسوايبر الصور الداخلي `CardImageSwiper` بنفس الهوك لمنع تكرار كود الـ Gestures مرتين.
4. **دعم النقر السلس بدون تعارض (Exclusive Tap)**:
   - تم دمج إيماءة النقر `Gesture.Tap()` مع `Gesture.Pan()` عبر `Gesture.Exclusive(panGesture, tapGesture)` بحيث يفتح الكارت تفاصيل الإعلان عند النقر دون أي تعارض مع سحب الصور، مع إعطاء أولوية السكرول الرأسي للصفحة عبر `failOffsetY([-15, 15])`.

---

## 2. الكود الفعلي الكامل قبل وبعد (Before & After)

### أ) سوايبر الصور في `ListingCardBase.tsx`

#### الكود قبل التعديل:
```tsx
        {displayImages.length > 0 ? (
          disableImageSwipe ? (
            <Pressable
              onPress={onPress}
              style={[
                s.swiperScrollView,
                imageHeight ? { height: imageHeight, aspectRatio: undefined } : undefined,
                fullWidth && { height: CardSystem.fullWidthHeight, aspectRatio: undefined },
              ]}
            >
              <Image
                source={{ uri: displayImages[0] }}
                style={s.imageFill}
                contentFit="cover"
              />
              {displayImages.length > 1 && (
                <View style={s.imageCountBadge}>
                  <Ionicons name="images-outline" size={11} color={Colors.white} />
                  <Text style={s.imageCountText}>{displayImages.length}</Text>
                </View>
              )}
            </Pressable>
          ) : cardWidth > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={[
                  s.swiperScrollView,
                  imageHeight ? { height: imageHeight, aspectRatio: undefined } : undefined,
                  fullWidth && { height: CardSystem.fullWidthHeight, aspectRatio: undefined },
                ]}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(Math.abs(e.nativeEvent.contentOffset.x) / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
              >
                {displayImages.map((img, i) => (
                  <Pressable
                    key={i}
                    onPress={onPress}
                    style={{ width: cardWidth, height: '100%' }}
                  >
                    <Image
                      source={{ uri: img }}
                      style={s.imageFill}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {displayImages.length > 1 && (
                <View style={s.dotsWrapper}>
                  {displayImages.map((_, i) => (
                    <View
                      key={i}
                      style={[s.dot, activeImgIdx === i && s.activeDot]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : null
        ) : (
```

#### الكود بعد التعديل:
```tsx
        {displayImages.length > 0 ? (
          <CardImageSwiper
            images={displayImages}
            cardWidth={cardWidth}
            imageHeight={imageHeight}
            fullWidth={fullWidth}
            disableImageSwipe={disableImageSwipe}
            onPress={onPress}
          />
        ) : (
```

---

### ب) المكون الجديد `src/components/ui/CardImageSwiper.tsx` (الكود الكامل)

```tsx
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
  cardWidth,
  imageHeight,
  fullWidth,
  disableImageSwipe = false,
  invertedGesture,
  onPress,
  onActiveIndexChange,
  style,
}: CardImageSwiperProps) {
  const count = images.length

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
```

---

### ج) الهوك المشترك الجديد `src/hooks/useGestureSwiper.ts` (الكود الكامل)

```tsx
import { useState, useCallback, useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated'
import { getGestureDirectionMultiplier } from '../utils/physicalDirection'

export interface UseGestureSwiperOptions {
  /** Total number of items/pages to swipe through */
  count: number
  /** Step distance in pixels for each snap point (cardWidth + gap, or cardWidth) */
  step: number
  /** Optional initial active index (default: 0) */
  initialIndex?: number
  /**
   * Optional manual override for gesture direction inversion.
   * When omitted (default), direction is automatically computed via getGestureDirectionMultiplier().
   */
  invertedGesture?: boolean
  /** Callback fired when snap animation completes with the new index */
  onActiveIndexChange?: (index: number) => void
  /** Sensitivity threshold for velocity flicks in px/s (default: 400) */
  velocityThreshold?: number
  /** Resistance factor when dragging past bounds (default: 0.25) */
  rubberBandFactor?: number
}

/**
 * useGestureSwiper
 *
 * Shared hook extracting the zero-RTL-dependent gesture and Reanimated physics engine
 * used by HorizontalScrollCard and CardImageSwiper.
 *
 * Features:
 * - Direct 1:1 physical touch tracking via getGestureDirectionMultiplier()
 * - Fail-safe offset boundaries for vertical scrolling (failOffsetY)
 * - Soft rubber-band resistance when pulling past index 0 or index (count - 1)
 * - Velocity-based flick recognition (> 400 px/s) to advance/retreat pages
 * - Smooth spring physics with spring completion callbacks
 */
export function useGestureSwiper({
  count,
  step,
  initialIndex = 0,
  invertedGesture,
  onActiveIndexChange,
  velocityThreshold = 400,
  rubberBandFactor = 0.25,
}: UseGestureSwiperOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const directionMultiplier =
    invertedGesture !== undefined
      ? invertedGesture
        ? -1
        : 1
      : getGestureDirectionMultiplier()

  const maxTranslateX = Math.max(0, (count - 1) * step)

  // Reanimated shared values
  const translateX = useSharedValue(initialIndex * step)
  const startX = useSharedValue(initialIndex * step)
  const currentIndex = useSharedValue(initialIndex)

  const handleSnapComplete = useCallback(
    (newIndex: number) => {
      setActiveIndex(newIndex)
      onActiveIndexChange?.(newIndex)
    },
    [onActiveIndexChange]
  )

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10]) // Don't trigger on tiny taps, allowing child clicks
      .failOffsetY([-15, 15])   // Fail quickly on vertical scrolls so screen ScrollView works smoothly
      .onStart(() => {
        cancelAnimation(translateX)
        startX.value = translateX.value
      })
      .onUpdate((event) => {
        if (count <= 1 || step <= 0) return

        const dx = event.translationX * directionMultiplier
        const rawX = startX.value + dx

        if (rawX < 0) {
          // Soft resistance when pulling past Item 0
          translateX.value = rawX * rubberBandFactor
        } else if (rawX > maxTranslateX) {
          // Soft resistance when pulling past the last item
          const over = rawX - maxTranslateX
          translateX.value = maxTranslateX + over * rubberBandFactor
        } else {
          translateX.value = rawX
        }
      })
      .onEnd((event) => {
        if (count <= 1 || step <= 0) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
          return
        }

        const vx = event.velocityX * directionMultiplier
        const rawIndex = step > 0 ? translateX.value / step : 0
        let targetIndex = Math.round(rawIndex)

        // Velocity flick recognition
        if (Math.abs(vx) > velocityThreshold) {
          if (vx > 0) {
            targetIndex = Math.ceil(rawIndex)
            if (targetIndex === currentIndex.value && targetIndex < count - 1) {
              targetIndex += 1
            }
          } else {
            targetIndex = Math.floor(rawIndex)
            if (targetIndex === currentIndex.value && targetIndex > 0) {
              targetIndex -= 1
            }
          }
        }

        // Clamp to valid range [0, count - 1]
        targetIndex = Math.max(0, Math.min(count - 1, targetIndex))

        const targetX = targetIndex * step
        translateX.value = withSpring(
          targetX,
          {
            damping: 22,
            stiffness: 180,
            mass: 0.8,
          },
          (finished) => {
            if (finished) {
              currentIndex.value = targetIndex
              runOnJS(handleSnapComplete)(targetIndex)
            }
          }
        )
      })
  }, [
    count,
    step,
    maxTranslateX,
    directionMultiplier,
    handleSnapComplete,
    velocityThreshold,
    rubberBandFactor,
  ])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return {
    panGesture,
    animatedTrackStyle,
    translateX,
    activeIndex,
    setActiveIndex,
    directionMultiplier,
  }
}
```

---

## 3. نتائج الفحوصات واختبارات الوحدة (Raw Verification Results)

### أ) فحص TypeScript (`npx tsc --noEmit`)
الملفات المعدلة والمستحدثة:
- `src/components/ui/CardImageSwiper.tsx`: **0 أخطاء**
- `src/hooks/useGestureSwiper.ts`: **0 أخطاء**
- `src/components/ui/ListingCardBase.tsx`: **0 أخطاء**
- `src/components/ui/HorizontalScrollCard.tsx`: **0 أخطاء**
*(الأخطاء المتبقية في المستودع وعددها 14 خطأ هي أخطاء قديمة ومعزولة داخل صفحات `app/equipment/operators/edit` و `OperatorRoleStep.tsx` ولا علاقة لها بنظام الكروت أو السحب).*

### ب) اختبارات Jest (`npx jest src/__tests__/useGestureSwiper.spec.ts src/__tests__/physicalDirection.spec.ts src/__tests__/PartCard.readPath.spec.tsx`)

```text
PASS src/__tests__/physicalDirection.spec.ts
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/PartCard.readPath.spec.tsx (8.738 s)

Test Suites: 3 passed, 3 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        9.865 s
Ran all test suites matching /src\__tests__\useGestureSwiper.spec.ts|src\__tests__\physicalDirection.spec.ts|src\__tests__\PartCard.readPath.spec.tsx/i.
```

---

## 4. خطوة الاختبار على الجهاز الفعلي
- **تنبيه وإقرار**: لم يتم ادعاء أي تجربة على جهاز فعلي من قبل الذكاء الاصطناعي — التجربة الفيزيائية الحقيقية متروكة لك على الجوال / المحاكي.
- بعد التأكد من صحة التقليب فيزيائياً وعمل النقاط وسلاسة النقر، سنكون جاهزين للانتقال لتاسك المجموعة 2 بثقة تامة.
