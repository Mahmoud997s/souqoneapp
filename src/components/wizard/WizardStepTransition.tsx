import React, { useEffect, useRef, useState } from 'react'
import { I18nManager, StyleSheet, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

export const STEP_TRANSITION_OFFSET = 24
export const STEP_TRANSITION_EXIT_MS = 110
export const STEP_TRANSITION_ENTER_MS = 200

export type StepTransitionDirection = 'forward' | 'backward' | 'none'

export function getStepTransitionDirection(
  prevStep: number,
  nextStep: number
): StepTransitionDirection {
  if (nextStep > prevStep) return 'forward'
  if (nextStep < prevStep) return 'backward'
  return 'none'
}

export function getStepTransitionOffsets(
  direction: StepTransitionDirection,
  isRTL: boolean = I18nManager.isRTL
): { exitX: number; enterX: number } {
  if (direction === 'none') return { exitX: 0, enterX: 0 }
  const rtlSign = isRTL ? 1 : -1
  if (direction === 'forward') {
    return {
      exitX: -STEP_TRANSITION_OFFSET * rtlSign,
      enterX: STEP_TRANSITION_OFFSET * rtlSign,
    }
  }
  return {
    exitX: STEP_TRANSITION_OFFSET * rtlSign,
    enterX: -STEP_TRANSITION_OFFSET * rtlSign,
  }
}

export interface WizardStepTransitionProps {
  stepKey: number
  children: React.ReactNode
  testID?: string
}

const EXIT_EASING = Easing.in(Easing.cubic)
const ENTER_EASING = Easing.out(Easing.cubic)

/**
 * Shared smooth horizontal + fade transition for wizard step content.
 * - Zero delay on initial mount
 * - Renders exiting previous step in a non-blocking overlay (~110ms ease-in, 24px + fade out)
 *   while entering new step slides in immediately (~200ms ease-out, 24px -> 0 + fade in)
 * - RTL-aware via I18nManager.isRTL (app forces RTL via I18nManager.forceRTL(true))
 * - Never blocks touches; cancels in-flight timers/animations on rapid double-tap
 * - Respects reduced motion (instant swap when enabled)
 */
export function WizardStepTransition({
  stepKey,
  children,
  testID = 'wizard-step-transition',
}: WizardStepTransitionProps) {
  const reducedMotion = useAppReducedMotion()
  const [exitingChildren, setExitingChildren] = useState<React.ReactNode>(null)
  const prevStepRef = useRef<number>(stepKey)
  const prevChildrenRef = useRef<React.ReactNode>(children)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMountedRef = useRef<boolean>(false)

  const enterTranslateX = useSharedValue(0)
  const enterOpacity = useSharedValue(1)
  const exitTranslateX = useSharedValue(0)
  const exitOpacity = useSharedValue(0)

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      prevStepRef.current = stepKey
      prevChildrenRef.current = children
      return
    }

    const prevStep = prevStepRef.current
    if (prevStep === stepKey) {
      prevChildrenRef.current = children
      return
    }

    const snapshotChildren = prevChildrenRef.current
    const direction = getStepTransitionDirection(prevStep, stepKey)
    prevStepRef.current = stepKey
    prevChildrenRef.current = children

    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
    cancelAnimation(enterTranslateX)
    cancelAnimation(enterOpacity)
    cancelAnimation(exitTranslateX)
    cancelAnimation(exitOpacity)

    if (reducedMotion || direction === 'none') {
      setExitingChildren(null)
      enterTranslateX.value = 0
      enterOpacity.value = 1
      exitTranslateX.value = 0
      exitOpacity.value = 0
      return
    }

    const { exitX, enterX } = getStepTransitionOffsets(direction, I18nManager.isRTL)

    setExitingChildren(snapshotChildren)
    exitTranslateX.value = 0
    exitOpacity.value = 1
    exitTranslateX.value = withTiming(exitX, {
      duration: STEP_TRANSITION_EXIT_MS,
      easing: EXIT_EASING,
    })
    exitOpacity.value = withTiming(0, {
      duration: STEP_TRANSITION_EXIT_MS,
      easing: EXIT_EASING,
    })

    enterTranslateX.value = enterX
    enterOpacity.value = 0
    enterTranslateX.value = withTiming(0, {
      duration: STEP_TRANSITION_ENTER_MS,
      easing: ENTER_EASING,
    })
    enterOpacity.value = withTiming(1, {
      duration: STEP_TRANSITION_ENTER_MS,
      easing: ENTER_EASING,
    })

    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null
      setExitingChildren(null)
    }, STEP_TRANSITION_EXIT_MS)
  }, [stepKey, children, reducedMotion, enterTranslateX, enterOpacity, exitTranslateX, exitOpacity])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }
  }, [])

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateX: enterTranslateX.value }],
  }))

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ translateX: exitTranslateX.value }],
  }))

  return (
    <View style={s.container}>
      {exitingChildren !== null ? (
        <Animated.View
          testID={`${testID}-exiting`}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, exitStyle]}
        >
          {exitingChildren}
        </Animated.View>
      ) : null}
      <Animated.View testID={testID} style={enterStyle}>
        {children}
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'relative',
  },
})
