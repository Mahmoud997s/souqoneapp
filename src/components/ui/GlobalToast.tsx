import React, { useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  useToastStore,
  TOAST_DURATION_MS,
  type ToastConfig,
  type ToastKind,
} from '../../store/toastStore'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { GlassSurface } from '../navigation/GlassSurface'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAX_TOAST_WIDTH = Math.min(SCREEN_WIDTH - Spacing.space4 * 2, 360)
const TOAST_ENTER_OFFSET_Y = -28
const TOAST_EXIT_OFFSET_Y = -20
const TOAST_EXIT_DURATION_MS = 180

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const DEFAULT_ICON_BY_KIND: Record<ToastKind, IoniconName> = {
  success: 'checkmark-circle-outline',
  neutral: 'information-circle-outline',
  error: 'alert-circle-outline',
}

function getIconChipStyle(toast: ToastConfig) {
  if (toast.icon === 'heart' || toast.kind === 'error') {
    return styles.iconChipAlert
  }
  if (toast.kind === 'success') {
    return styles.iconChipSuccess
  }
  return styles.iconChipNeutral
}

function resolveIconColor(toast: ToastConfig): string {
  if (toast.icon === 'heart' || toast.kind === 'error') {
    return Colors.error
  }
  if (toast.kind === 'success') {
    return Colors.primary
  }
  return Colors.textMuted
}

export function GlobalToast() {
  const insets = useSafeAreaInsets()
  const current = useToastStore((s) => s.current)
  const shouldReduceMotion = useAppReducedMotion()

  const currentRef = useRef<ToastConfig | null>(current)
  currentRef.current = current

  const isExitingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const translateY = useSharedValue(TOAST_ENTER_OFFSET_Y)
  const opacity = useSharedValue(0)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
  }, [])

  const finalizeHide = useCallback((dismissId?: string) => {
    isExitingRef.current = false
    const activeStoreToast = useToastStore.getState().current
    if (activeStoreToast && (!dismissId || activeStoreToast.id === dismissId)) {
      useToastStore.getState().hide()
    }
  }, [])

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const active = useToastStore.getState().current ?? currentRef.current
    if (!active) {
      return
    }

    if (shouldReduceMotion) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
      translateY.value = TOAST_EXIT_OFFSET_Y
      opacity.value = 0
      finalizeHide(active.id)
      return
    }

    if (isExitingRef.current) {
      return
    }

    isExitingRef.current = true
    const dismissId = active.id
    translateY.value = withTiming(TOAST_EXIT_OFFSET_Y, {
      duration: TOAST_EXIT_DURATION_MS,
    })
    opacity.value = withTiming(0, { duration: TOAST_EXIT_DURATION_MS })

    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null
      finalizeHide(dismissId)
    }, TOAST_EXIT_DURATION_MS)
  }, [finalizeHide, opacity, shouldReduceMotion, translateY])

  const toastId = current?.id

  useEffect(() => {
    clearTimers()
    isExitingRef.current = false

    const activeToast = currentRef.current
    if (activeToast) {
      if (shouldReduceMotion) {
        translateY.value = 0
        opacity.value = 1
      } else {
        translateY.value = TOAST_ENTER_OFFSET_Y
        opacity.value = 0
        translateY.value = withSpring(0, {
          damping: 22,
          stiffness: 180,
        })
        opacity.value = withTiming(1, { duration: 220 })
      }

      const duration = activeToast.durationMs ?? TOAST_DURATION_MS
      timerRef.current = setTimeout(() => {
        dismiss()
      }, duration)
    } else {
      translateY.value = TOAST_ENTER_OFFSET_Y
      opacity.value = 0
    }

    return () => {
      clearTimers()
    }
  }, [clearTimers, dismiss, opacity, shouldReduceMotion, toastId, translateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }
  })

  if (!current) {
    return null
  }

  const iconName = (current.icon ?? DEFAULT_ICON_BY_KIND[current.kind]) as IoniconName
  const iconColor = resolveIconColor(current)

  const fullAccessibilityLabel = current.message
    ? `${current.title}: ${current.message}`
    : current.title

  return (
    <View
      style={[
        styles.host,
        { top: insets.top + (Platform.OS === 'android' ? 12 : 8) },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.card, animatedStyle]}
        testID="global-toast-container"
      >
        <GlassSurface
          testID="global-toast"
          variant="capsule"
          borderRadius={Radius.pill}
          noBorder
        />
        <TouchableOpacity
          style={styles.touchable}
          activeOpacity={0.85}
          onPress={dismiss}
          testID="global-toast-card"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={fullAccessibilityLabel}
        >
          <View
            style={[styles.iconChip, getIconChipStyle(current)]}
            testID="global-toast-icon-chip"
          >
            <Ionicons name={iconName} size={17} color={iconColor} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {current.title}
            </Text>
            {Boolean(current.message) && (
              <Text style={styles.message} numberOfLines={2}>
                {current.message}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: Spacing.space4,
    right: Spacing.space4,
    alignItems: 'center',
    zIndex: 99999,
  },
  card: {
    alignSelf: 'center',
    maxWidth: MAX_TOAST_WIDTH,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    ...Shadows.card,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space3,
    gap: Spacing.space2,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChipSuccess: {
    backgroundColor: 'rgba(0, 156, 181, 0.12)',
  },
  iconChipNeutral: {
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
  },
  iconChipAlert: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  textContainer: {
    flexShrink: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Almarai_700Bold',
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 11,
    fontFamily: 'Almarai_400Regular',
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
})
