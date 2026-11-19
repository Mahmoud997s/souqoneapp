import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native'
import { usePathname } from 'expo-router'
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
  resolveToastDuration,
  type ToastItem,
  type ToastKind,
} from '../../store/toastStore'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { GlassSurface } from '../navigation/GlassSurface'
import { DecisionToastCard } from './DecisionToastCard'
import { GlassActionSheetHost } from './GlassActionSheet'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import { computeGlobalToastBottomOffset } from '../../constants/toastLayout'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAX_TOAST_WIDTH = Math.min(SCREEN_WIDTH - Spacing.space4 * 2, 360)
export const TOAST_ENTER_OFFSET_Y = 28
export const TOAST_EXIT_OFFSET_Y = 20
const TOAST_EXIT_DURATION_MS = 180

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const DEFAULT_ICON_BY_KIND: Record<ToastKind, IoniconName> = {
  success: 'checkmark-circle-outline',
  info: 'information-circle-outline',
  warning: 'warning-outline',
  neutral: 'information-circle-outline',
  error: 'alert-circle-outline',
}

interface ToastVisualTheme {
  tintOverlayColor?: string
  borderColor: string
  borderWidth: number
  iconBgColor: string
  iconColor: string
  titleColor: string
  messageColor: string
}

function isFavoriteToast(toast: ToastItem): boolean {
  return (
    toast.icon === 'heart' ||
    toast.icon === 'heart-dislike-outline' ||
    toast.title === 'تمت إضافة الإعلان إلى المفضلة' ||
    toast.title === 'تمت إزالة الإعلان من المفضلة'
  )
}

function resolveToastVisualTheme(toast: ToastItem): ToastVisualTheme {
  if (isFavoriteToast(toast)) {
    const isAlert = toast.icon === 'heart'
    return {
      tintOverlayColor: undefined,
      borderColor: Colors.whiteAlpha72,
      borderWidth: StyleSheet.hairlineWidth,
      iconBgColor: isAlert ? Colors.errorSoft12 : Colors.mutedSoft12,
      iconColor: isAlert ? Colors.error : Colors.textMuted,
      titleColor: Colors.text,
      messageColor: Colors.textMuted,
    }
  }

  switch (toast.kind) {
    case 'success':
      return {
        tintOverlayColor: Colors.emeraldBrightSoft10,
        borderColor: Colors.emeraldBrightSoft25,
        borderWidth: 0.5,
        iconBgColor: Colors.emeraldBright,
        iconColor: Colors.white,
        titleColor: Colors.emeraldDeepText,
        messageColor: Colors.emeraldDeepText,
      }
    case 'error':
      return {
        tintOverlayColor: Colors.errorSoft10,
        borderColor: Colors.errorBorder40,
        borderWidth: 0.5,
        iconBgColor: Colors.error,
        iconColor: Colors.white,
        titleColor: Colors.dangerDarkText,
        messageColor: Colors.dangerDarkText,
      }
    case 'warning':
      return {
        tintOverlayColor: Colors.warningSoft16,
        borderColor: Colors.warningBorder45,
        borderWidth: 0.5,
        iconBgColor: Colors.warning,
        iconColor: Colors.white,
        titleColor: Colors.warningText,
        messageColor: Colors.warningText,
      }
    case 'info':
      return {
        tintOverlayColor: Colors.primarySoft12,
        borderColor: Colors.primarySoft30,
        borderWidth: 0.5,
        iconBgColor: Colors.primary,
        iconColor: Colors.white,
        titleColor: Colors.primaryDeep,
        messageColor: Colors.primaryDeep,
      }
    case 'neutral':
    default:
      return {
        tintOverlayColor: Colors.mutedSoft12,
        borderColor: Colors.slateBorder,
        borderWidth: 0.5,
        iconBgColor: Colors.slateSecondary,
        iconColor: Colors.white,
        titleColor: Colors.text,
        messageColor: Colors.textMuted,
      }
  }
}

function ToastNoticeBanner() {
  const insets = useSafeAreaInsets()
  const current = useToastStore((s) => s.current)
  const pathname = typeof usePathname === 'function' ? usePathname() : ''
  const shouldReduceMotion = useAppReducedMotion()
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0)
    })
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const currentRef = useRef<ToastItem | null>(current)
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

  const clearAutoDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
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
    clearAutoDismissTimer()

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
  }, [clearAutoDismissTimer, finalizeHide, opacity, shouldReduceMotion, translateY])

  const toastId = current?.id
  const toastRevision = current?.revision ?? 0
  const resolvedDuration = current
    ? current.durationMs !== undefined
      ? current.durationMs
      : resolveToastDuration(current)
    : null

  // Run entry animation only when toastId changes (coalesced updates keep id & skip re-animation)
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
    } else {
      translateY.value = TOAST_ENTER_OFFSET_Y
      opacity.value = 0
    }

    return () => {
      clearTimers()
    }
  }, [clearTimers, opacity, shouldReduceMotion, toastId, translateY])

  // Refresh auto-dismiss timer when toastId, coalesced revision, or durationMs changes
  useEffect(() => {
    clearAutoDismissTimer()
    if (!toastId || resolvedDuration === null || resolvedDuration <= 0) {
      return
    }
    timerRef.current = setTimeout(() => {
      dismiss()
    }, resolvedDuration)

    return () => {
      clearAutoDismissTimer()
    }
  }, [clearAutoDismissTimer, dismiss, resolvedDuration, toastId, toastRevision])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }
  })

  if (!current) {
    return null
  }

  const iconName = (current.icon ?? DEFAULT_ICON_BY_KIND[current.kind] ?? 'information-circle-outline') as IoniconName
  const visual = resolveToastVisualTheme(current)
  const isErrorSticky = current.kind === 'error' && !isFavoriteToast(current)

  const fullAccessibilityLabel = current.message
    ? `${current.title}: ${current.message}`
    : current.title

  const bottomOffset = computeGlobalToastBottomOffset({
    pathname,
    bottomInset: insets.bottom,
    keyboardHeight,
  })

  return (
    <View
      testID="global-toast-host"
      style={[
        styles.host,
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: visual.borderColor,
            borderWidth: visual.borderWidth,
          },
          animatedStyle,
        ]}
        testID="global-toast-container"
      >
        <GlassSurface
          testID="global-toast"
          variant="capsule"
          borderRadius={Radius.pill}
          noBorder
          tintOverlayColor={visual.tintOverlayColor}
        />
        {!isFavoriteToast(current) && (
          <View pointerEvents="none" style={styles.innerTopHighlight} />
        )}
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
            style={[styles.iconChip, { backgroundColor: visual.iconBgColor }]}
            testID="global-toast-icon-chip"
          >
            <Ionicons name={iconName} size={17} color={visual.iconColor} />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: visual.titleColor }]}
              numberOfLines={2}
            >
              {current.title}
            </Text>
            {Boolean(current.message) && (
              <Text
                style={[styles.message, { color: visual.messageColor }]}
                numberOfLines={2}
              >
                {current.message}
              </Text>
            )}
          </View>

          {isErrorSticky && (
            <TouchableOpacity
              testID="global-toast-close-btn"
              onPress={dismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="إغلاق التنبيه"
              style={styles.closeAffordance}
            >
              <Text style={[styles.closeAffordanceTxt, { color: visual.titleColor }]}>
                {'\u00D7'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

function FeedbackOverlayHost() {
  return (
    <>
      <ToastNoticeBanner />
      <DecisionToastCard />
      <GlassActionSheetHost />
    </>
  )
}

export function GlobalToast() {
  const hasModalHost = useToastStore((s) => s.modalHostIds.length > 0)
  if (hasModalHost) {
    return null
  }
  return <FeedbackOverlayHost />
}

let modalHostCounter = 0

export function ModalToastHost() {
  const hostIdRef = useRef<string | null>(null)
  if (!hostIdRef.current) {
    hostIdRef.current = `modal-toast-host-${++modalHostCounter}`
  }
  const hostId = hostIdRef.current

  useEffect(() => {
    const store = useToastStore.getState()
    store.registerModalHost(hostId)
    return () => {
      useToastStore.getState().unregisterModalHost(hostId)
    }
  }, [hostId])

  const isTopModalHost = useToastStore(
    (s) => s.modalHostIds[s.modalHostIds.length - 1] === hostId
  )
  if (!isTopModalHost) {
    return null
  }
  return <FeedbackOverlayHost />
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
    borderColor: Colors.whiteAlpha72,
    ...Shadows.card,
  },
  innerTopHighlight: {
    position: 'absolute',
    top: 0,
    left: Spacing.space4,
    right: Spacing.space4,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.whiteAlpha75,
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
  closeAffordance: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeAffordanceTxt: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Almarai_700Bold',
    textAlign: 'center',
  },
})
