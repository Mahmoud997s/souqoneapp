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
  runOnJS,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useToastStore, TOAST_DURATION_MS, type ToastKind } from '../../store/toastStore'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAX_TOAST_WIDTH = Math.min(SCREEN_WIDTH - Spacing.space4 * 2, 420)

export function GlobalToast() {
  const insets = useSafeAreaInsets()
  const current = useToastStore((s) => s.current)
  const hide = useToastStore((s) => s.hide)
  const shouldReduceMotion = useAppReducedMotion()

  const translateY = useSharedValue(-100)
  const opacity = useSharedValue(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    useToastStore.getState().hide()
    translateY.value = withTiming(-100, { duration: 200 })
    opacity.value = withTiming(0, { duration: 150 })
  }, [opacity, translateY])

  const currentRef = useRef(current)
  currentRef.current = current

  const toastId = current?.id

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const activeToast = currentRef.current
    if (activeToast) {
      if (shouldReduceMotion) {
        translateY.value = 0
        opacity.value = 1
      } else {
        translateY.value = withSpring(0, {
          damping: 18,
          stiffness: 140,
        })
        opacity.value = withTiming(1, { duration: 200 })
      }

      const duration = activeToast.durationMs ?? TOAST_DURATION_MS
      timerRef.current = setTimeout(() => {
        dismiss()
      }, duration)
    } else {
      translateY.value = -100
      opacity.value = 0
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [toastId, dismiss, opacity, shouldReduceMotion, translateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }
  })

  if (!current) {
    return null
  }

  const renderIcon = (kind: ToastKind) => {
    if (kind === 'success') {
      return <Ionicons name="heart" size={20} color={Colors.error} />
    }
    if (kind === 'neutral') {
      return <Ionicons name="heart-dislike-outline" size={20} color={Colors.textMuted} />
    }
    return <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
  }

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
        <TouchableOpacity
          style={styles.touchable}
          activeOpacity={0.85}
          onPress={dismiss}
          testID="global-toast-card"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={fullAccessibilityLabel}
        >
          <View style={styles.iconChip}>{renderIcon(current.kind)}</View>

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {current.title}
            </Text>
            {Boolean(current.message) && (
              <Text style={styles.message} numberOfLines={1}>
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
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  card: {
    width: MAX_TOAST_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card2,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space4,
    gap: Spacing.space3,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Almarai_700Bold',
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 12,
    fontFamily: 'Almarai_400Regular',
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
})
