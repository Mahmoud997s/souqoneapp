import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated'
import {
  physicalRightStyle,
  physicalRowDirection,
  getGestureDirectionMultiplier,
} from '../../utils/physicalDirection'
import {
  computeHorizontalSnapStops,
  findNearestScrollStop,
} from '../../utils/horizontalTrackSnap'

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

  useEffect(() => {
    setContentHeight(minHeight)
  }, [minHeight])

  const maxScroll = Math.max(0, contentWidth - containerWidth)
  const directionMultiplier = getGestureDirectionMultiplier()

  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)
  const snapStopsShared = useSharedValue<number[]>([0])

  const childWidthsRef = useRef<number[]>([])
  const [measuredWidthsVersion, setMeasuredWidthsVersion] = useState(0)

  const childArray = useMemo(() => React.Children.toArray(children), [children])

  // Extract a stable fingerprint from children keys and count
  const childrenCount = childArray.length
  const childrenFingerprint = useMemo(() => {
    let keys = ''
    childArray.forEach((child) => {
      if (React.isValidElement(child) && child.key != null) {
        keys += `${child.key}:`
      }
    })
    return keys || `${childrenCount}`
  }, [childArray, childrenCount])

  // Composite fingerprint for reset (tab change, data length change, or items replacement)
  const resetFingerprint = useMemo(
    () => computeTrackResetFingerprint(resetKey, dataLength, childrenFingerprint),
    [resetKey, dataLength, childrenFingerprint]
  )

  // Reset scroll to beginning (physical right) whenever reset fingerprint changes
  useEffect(() => {
    cancelAnimation(translateX)
    translateX.value = 0
    childWidthsRef.current = new Array(childrenCount).fill(0)
    setMeasuredWidthsVersion((v) => v + 1)
  }, [resetFingerprint, childrenCount])

  const recordChildWidth = useCallback((index: number, width: number) => {
    if (width <= 0) return
    if (Math.abs((childWidthsRef.current[index] ?? 0) - width) > 0.5) {
      childWidthsRef.current[index] = width
      setMeasuredWidthsVersion((v) => v + 1)
    }
  }, [])

  const trackLayoutMetrics = useMemo(() => {
    const flat = StyleSheet.flatten(contentContainerStyle) || {}
    const gap = typeof flat.gap === 'number' ? flat.gap : typeof flat.columnGap === 'number' ? flat.columnGap : 0
    const padH = typeof flat.paddingHorizontal === 'number' ? flat.paddingHorizontal : 0
    const paddingStart =
      typeof flat.paddingStart === 'number'
        ? flat.paddingStart
        : typeof flat.paddingRight === 'number'
          ? flat.paddingRight
          : padH
    const paddingEnd =
      typeof flat.paddingEnd === 'number'
        ? flat.paddingEnd
        : typeof flat.paddingLeft === 'number'
          ? flat.paddingLeft
          : padH
    return { gap, paddingStart, paddingEnd }
  }, [contentContainerStyle])

  const snapStops = useMemo(() => {
    const widths = childWidthsRef.current.slice(0, childrenCount)
    if (widths.length === 0 || widths.some((w) => !w || w <= 0)) {
      return [0]
    }
    return computeHorizontalSnapStops({
      itemWidths: widths,
      gap: trackLayoutMetrics.gap,
      paddingStart: trackLayoutMetrics.paddingStart,
      paddingEnd: trackLayoutMetrics.paddingEnd,
      containerWidth,
    })
  }, [childrenCount, measuredWidthsVersion, trackLayoutMetrics, containerWidth])

  useEffect(() => {
    snapStopsShared.value = snapStops
  }, [snapStops])

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

        // Momentum projection based on velocity flick, settled on nearest whole-chip boundary
        const projectedX = currentX + vx * 0.25
        const clampedTarget = Math.max(0, Math.min(maxScroll, projectedX))
        const snapTarget = findNearestScrollStop(clampedTarget, snapStopsShared.value, maxScroll)

        translateX.value = withSpring(snapTarget, {
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
            {childArray.map((child, idx) => {
              const itemKey =
                React.isValidElement(child) && child.key != null
                  ? String(child.key)
                  : `track-item-${idx}`
              return (
                <View
                  key={itemKey}
                  onLayout={(e) => recordChildWidth(idx, e.nativeEvent.layout.width)}
                >
                  {child}
                </View>
              )
            })}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  gestureArea: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
})
