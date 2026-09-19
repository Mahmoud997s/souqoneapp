# تقرير المرحلة A: إصلاح باجات `PhysicalHorizontalTrack`

**تاريخ التقرير:** 19 سبتمبر 2026  
**الملفات المعدلة:**
- `src/components/ui/PhysicalHorizontalTrack.tsx`
- `src/__tests__/PhysicalHorizontalTrack.spec.ts`

---

## 1. ملخص المشكلتين والحل الجذري

### أ) باج الـ Reset الناقص (Data change without tab change):
- **المشكلة**: كان المكون يعتمد فقط على `resetKey` (الذي كان يمرر له `activeTab`). إذا بقي المستخدم داخل نفس التاب (مثلاً تاب "الموديلات" أو "الماركات") وتغيرت الداتا كلياً نتيجة لاختيار ماركة جديدة أو وصول قائمة مختلفة، لم يكن السكرول يعود إلى اليمين الفيزيائي تلقائياً لأن `resetKey` لم يتغير.
- **الحل**:
  1. تم إنشاء دالة نقية `computeTrackResetFingerprint(resetKey, dataLength, childrenFingerprint)` تحسب بصمة مركبة تشمل: المفتاح الصريح، طول الداتا، ومفاتيح العناصر الفرعية `children`.
  2. يتم استخراج بصمة المفاتيح `childrenFingerprint` من الـ keys والعدد تلقائياً عبر `React.Children`.
  3. عند أي تغيير في البصمة المركبة، يُطلق `useEffect` أمر تصفير فوري للمسافة `translateX.value = 0`.
  4. تمت إضافة حارس إضافي: إذا تقلص محتوى القائمة وأصبحت نقطة التوقف الحالية أكبر من `maxScroll` الجديد، يتم تقييد الموضع فوراً بسلاسة `translateX.value = maxScroll`.

### ب) باج الـ Race Condition في `onLayout`:
- **المشكلة**: عند أول تحميل للمكون، تكون قيمة `contentWidth = 0` مؤقتاً حتى يكتمل حدث `onLayout` للمسار الداخلي. إذا بدأ المستخدم في السحب السريع خلال أجزاء من الثانية الأولى، كانت تُحسب `maxScroll = 0` ويتم تجاهل السحبة بصمت وابتلاع الإيماءة.
- **الحل**:
  1. إضافة حالة صريحة `const [isMeasured, setIsMeasured] = useState(false)` تُفعّل فور التقاط أول قياس فعلي `w > 0` من `onLayout`.
  2. إنشاء دالة التحقق `isPanGestureEnabled(isMeasured, maxScroll)` التي تشترط اكتمال القياس الأولي مع وجود فائض محتوى قابل للسكرول `maxScroll > 0`.
  3. ربط خاصية `.enabled(gestureEnabled)` في `Gesture.Pan()`، مما يمنع تنشيط الإيماءة أو ابتلاع السحب الخاطئ قبل اكتمال القياس، ويمنع اعتراض السكرول العمودي للصفحة في حال كانت العناصر كلها ظاهرة على الشاشة دون حاجة للسكرول الأفقي.

---

## 2. الكود الفعلي الكامل قبل وبعد (Before & After)

### أ) `src/components/ui/PhysicalHorizontalTrack.tsx`

#### الكود قبل التعديل:
```tsx
export interface PhysicalHorizontalTrackProps {
  children: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  resetKey?: string | number
  minHeight?: number
}

export function PhysicalHorizontalTrack({
  children,
  containerStyle,
  contentContainerStyle,
  resetKey,
  minHeight = 88,
}: PhysicalHorizontalTrackProps) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH)
  const [contentWidth, setContentWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState<number>(minHeight)

  const maxScroll = Math.max(0, contentWidth - containerWidth)
  const directionMultiplier = getGestureDirectionMultiplier()

  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)

  // Reset scroll to beginning when resetKey changes (e.g., activeTab changes)
  useEffect(() => {
    cancelAnimation(translateX)
    translateX.value = 0
  }, [resetKey])

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-15, 15])
      .onStart(() => {
        cancelAnimation(translateX)
        startX.value = translateX.value
      })
      .onUpdate((event) => {
        if (maxScroll <= 0) return
        const dx = event.translationX * directionMultiplier
        const rawX = startX.value + dx

        if (rawX < 0) {
          translateX.value = rawX * 0.25
        } else if (rawX > maxScroll) {
          const over = rawX - maxScroll
          translateX.value = maxScroll + over * 0.25
        } else {
          translateX.value = rawX
        }
      })
      .onEnd((event) => {
        if (maxScroll <= 0) return
        const vx = event.velocityX * directionMultiplier
        const currentX = translateX.value

        if (currentX < 0) {
          translateX.value = withSpring(0, { damping: 22, stiffness: 200 })
          return
        }
        if (currentX > maxScroll) {
          translateX.value = withSpring(maxScroll, { damping: 22, stiffness: 200 })
          return
        }

        // Momentum projection based on velocity flick
        const projectedX = currentX + vx * 0.25
        const clampedTarget = Math.max(0, Math.min(maxScroll, projectedX))

        translateX.value = withSpring(clampedTarget, {
          damping: 24,
          stiffness: 180,
          velocity: Math.abs(vx) > 150 ? vx * 0.5 : 0,
        })
      })
  }, [maxScroll, directionMultiplier])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return (
    <View
      style={[
        styles.container,
        { minHeight: contentHeight },
        containerStyle,
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) {
          setContainerWidth(w)
        }
      }}
    >
      <GestureDetector gesture={panGesture}>
        <View style={[styles.gestureArea, { minHeight: contentHeight }]}>
          <Animated.View
            style={[
              styles.track,
              {
                flexDirection: physicalRowDirection(),
                ...physicalRightStyle(0),
              },
              animatedTrackStyle,
              contentContainerStyle,
            ]}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout
              if (w > 0 && w !== contentWidth) {
                setContentWidth(w)
              }
              if (h > 0 && h !== contentHeight) {
                setContentHeight(h)
              }
            }}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  )
}
```

#### الكود بعد التعديل:
```tsx
export interface PhysicalHorizontalTrackProps {
  children: React.ReactNode
  containerStyle?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  resetKey?: string | number
  dataLength?: number
  minHeight?: number
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

/**
 * Calculates a composite reset fingerprint to trigger scroll reset whenever
 * either the explicit resetKey, data length, or children keys change.
 */
export function computeTrackResetFingerprint(
  resetKey?: string | number,
  dataLength?: number,
  childrenFingerprint?: string
): string {
  const rk = resetKey != null ? String(resetKey) : ''
  const dl = dataLength != null ? String(dataLength) : ''
  const cf = childrenFingerprint != null ? String(childrenFingerprint) : ''
  return `${rk}__${dl}__${cf}`
}

/**
 * Determines whether horizontal pan gesture should be enabled.
 * Prevents race condition during initial render when content is not yet measured (contentWidth = 0).
 * Also avoids intercepting touches when content fits without overflowing (maxScroll <= 0).
 */
export function isPanGestureEnabled(isMeasured: boolean, maxScroll: number): boolean {
  return isMeasured && maxScroll > 0
}

/**
 * PhysicalHorizontalTrack
 *
 * A reusable physical swipe container built on Gesture.Pan() and Reanimated.
 * - Replaces native ScrollView horizontal with direct physical touch tracking.
 * - Zero-RTL-dependent: anchored to physical right and flows from right to left.
 * - Rubber-band overscroll resistance and velocity-based flick momentum.
 * - Seamless gesture arbitration with parent vertical FlatLists (failOffsetY).
 */
export function PhysicalHorizontalTrack({
  children,
  containerStyle,
  contentContainerStyle,
  resetKey,
  dataLength,
  minHeight = 88,
}: PhysicalHorizontalTrackProps) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH)
  const [contentWidth, setContentWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState<number>(minHeight)
  const [isMeasured, setIsMeasured] = useState(false)

  const maxScroll = Math.max(0, contentWidth - containerWidth)
  const directionMultiplier = getGestureDirectionMultiplier()

  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)

  // Extract a stable fingerprint from children keys and count
  const childrenCount = React.Children.count(children)
  const childrenFingerprint = useMemo(() => {
    let keys = ''
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.key != null) {
        keys += `${child.key}:`
      }
    })
    return keys || `${childrenCount}`
  }, [children, childrenCount])

  // Composite fingerprint for reset (tab change, data length change, or items replacement)
  const resetFingerprint = useMemo(
    () => computeTrackResetFingerprint(resetKey, dataLength, childrenFingerprint),
    [resetKey, dataLength, childrenFingerprint]
  )

  // Reset scroll to beginning (physical right) whenever reset fingerprint changes
  useEffect(() => {
    cancelAnimation(translateX)
    translateX.value = 0
  }, [resetFingerprint])

  // Guard: if content shrinks dynamically and maxScroll < current position, clamp it smoothly
  useEffect(() => {
    if (isMeasured && contentWidth > 0 && translateX.value > maxScroll) {
      cancelAnimation(translateX)
      translateX.value = maxScroll
    }
  }, [isMeasured, contentWidth, maxScroll])

  const gestureEnabled = isPanGestureEnabled(isMeasured, maxScroll)

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(gestureEnabled)
      .activeOffsetX([-10, 10])
      .failOffsetY([-15, 15])
      .onStart(() => {
        cancelAnimation(translateX)
        startX.value = translateX.value
      })
      .onUpdate((event) => {
        if (maxScroll <= 0) return
        const dx = event.translationX * directionMultiplier
        const rawX = startX.value + dx

        if (rawX < 0) {
          translateX.value = rawX * 0.25
        } else if (rawX > maxScroll) {
          const over = rawX - maxScroll
          translateX.value = maxScroll + over * 0.25
        } else {
          translateX.value = rawX
        }
      })
      .onEnd((event) => {
        if (maxScroll <= 0) return
        const vx = event.velocityX * directionMultiplier
        const currentX = translateX.value

        if (currentX < 0) {
          translateX.value = withSpring(0, { damping: 22, stiffness: 200 })
          return
        }
        if (currentX > maxScroll) {
          translateX.value = withSpring(maxScroll, { damping: 22, stiffness: 200 })
          return
        }

        // Momentum projection based on velocity flick
        const projectedX = currentX + vx * 0.25
        const clampedTarget = Math.max(0, Math.min(maxScroll, projectedX))

        translateX.value = withSpring(clampedTarget, {
          damping: 24,
          stiffness: 180,
          velocity: Math.abs(vx) > 150 ? vx * 0.5 : 0,
        })
      })
  }, [gestureEnabled, maxScroll, directionMultiplier])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return (
    <View
      style={[
        styles.container,
        { minHeight: contentHeight },
        containerStyle,
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) {
          setContainerWidth(w)
        }
      }}
    >
      <GestureDetector gesture={panGesture}>
        <View style={[styles.gestureArea, { minHeight: contentHeight }]}>
          <Animated.View
            style={[
              styles.track,
              {
                flexDirection: physicalRowDirection(),
                ...physicalRightStyle(0),
              },
              animatedTrackStyle,
              contentContainerStyle,
            ]}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout
              if (w > 0) {
                if (w !== contentWidth) {
                  setContentWidth(w)
                }
                if (!isMeasured) {
                  setIsMeasured(true)
                }
              }
              if (h > 0 && h !== contentHeight) {
                setContentHeight(h)
              }
            }}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  )
}
```

---

## 3. الفحوصات الآلية ونواتج الاختبارات الخام (Raw Results)

### ناتج تشغيل Jest:
```text
PASS src/__tests__/physicalDirection.spec.ts
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/PhysicalHorizontalTrack.spec.ts (7.011 s)

Test Suites: 3 passed, 3 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        8.351 s
Ran all test suites matching /src\__tests__\physicalDirection.spec.ts|src\__tests__\useGestureSwiper.spec.ts|src\__tests__\PhysicalHorizontalTrack.spec.ts/i.
```
