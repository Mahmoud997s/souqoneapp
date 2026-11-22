import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { usePathname } from 'expo-router'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useToastStore } from '../../store/toastStore'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import { computeGlobalToastBottomOffset } from '../../constants/toastLayout'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAX_DECISION_WIDTH = Math.min(SCREEN_WIDTH - Spacing.space4 * 2, 380)
const CAPSULE_HEIGHT = 30
const CAPSULE_RADIUS = CAPSULE_HEIGHT / 2
const HAPTIC_DEBOUNCE_MS = 400
const CAPSULE_HIT_SLOP = { top: 7, bottom: 7, left: 6, right: 6 }

export function DecisionToastCard() {
  const decision = useToastStore((s) => s.activeDecision)
  const resolveDecision = useToastStore((s) => s.resolveDecision)
  const insets = useSafeAreaInsets()
  const pathname = typeof usePathname === 'function' ? usePathname() : ''
  const shouldReduceMotion = useAppReducedMotion()
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const translateY = useSharedValue(28)
  const translateX = useSharedValue(0)
  const lastWarningHapticRef = useRef(0)

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

  const decisionId = decision?.id

  useEffect(() => {
    if (!decisionId) {
      translateY.value = 28
      translateX.value = 0
      return
    }

    translateX.value = 0
    if (shouldReduceMotion) {
      translateY.value = 0
    } else {
      translateY.value = 28
      translateY.value = withSpring(0, { damping: 22, stiffness: 180 })
    }
  }, [decisionId, shouldReduceMotion, translateX, translateY])

  useEffect(() => {
    if (!decisionId) return
    const sub = BackHandler?.addEventListener?.('hardwareBackPress', () => {
      resolveDecision('cancel')
      return true
    })
    return () => {
      sub?.remove?.()
    }
  }, [decisionId, resolveDecision])

  const handleOutsidePress = useCallback(() => {
    if (!shouldReduceMotion) {
      translateX.value = withSequence(
        withTiming(-7, { duration: 55 }),
        withTiming(7, { duration: 65 }),
        withTiming(-5, { duration: 65 }),
        withTiming(5, { duration: 65 }),
        withTiming(-2, { duration: 65 }),
        withTiming(0, { duration: 65 })
      )
    }

    const now = Date.now()
    if (now - lastWarningHapticRef.current >= HAPTIC_DEBOUNCE_MS) {
      lastWarningHapticRef.current = now
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      } catch {
        // Ignore haptics errors on unsupported devices/environments
      }
    }
  }, [shouldReduceMotion, translateX])

  const handleActionPress = useCallback(
    (outcome: 'confirm' | 'cancel') => {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } catch {
        // Ignore haptics errors on unsupported devices/environments
      }
      resolveDecision(outcome)
    },
    [resolveDecision]
  )

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }))

  if (!decision) {
    return null
  }

  const isDanger = decision.intent === 'danger'
  const bottomOffset = computeGlobalToastBottomOffset({
    pathname,
    bottomInset: insets.bottom,
    keyboardHeight,
  })
  const combinedLabel = decision.message
    ? `${decision.title}: ${decision.message}`
    : decision.title

  return (
    <View
      testID="decision-toast-overlay"
      accessibilityViewIsModal
      style={s.overlay}
      pointerEvents="box-none"
    >
      <Pressable
        testID="decision-toast-scrim"
        style={s.scrim}
        onPress={handleOutsidePress}
        accessibilityLabel="تأكيد الاختيار"
      />

      <View
        testID="decision-toast-host"
        style={[s.host, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <Animated.View
          testID="decision-toast-card"
          accessibilityRole="alert"
          accessibilityLabel={combinedLabel}
          style={[
            s.card,
            {
              borderColor: isDanger ? Colors.errorBorder40 : Colors.primarySoft30,
            },
            cardAnimatedStyle,
          ]}
        >
          <TopBarGlassSurface
            testID="decision-toast-glass"
            kind="ice-control"
            borderRadius={Radius.xl}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDanger ? Colors.errorSoft10 : Colors.primarySoft12,
                borderRadius: Radius.xl,
              },
            ]}
          />
          <View pointerEvents="none" style={s.innerTopHighlight} />

          <View style={s.row}>
            <View
              testID="decision-toast-icon"
              style={[
                s.iconCircle,
                { backgroundColor: isDanger ? Colors.error : Colors.primary },
              ]}
            >
              <Ionicons
                name={isDanger ? 'alert-circle-outline' : 'help-circle-outline'}
                size={15}
                color={Colors.white}
              />
            </View>

            <View style={s.textCol}>
              <Text
                testID="decision-toast-title"
                style={[
                  s.title,
                  { color: isDanger ? Colors.dangerDarkText : Colors.primaryDeep },
                ]}
                numberOfLines={2}
              >
                {decision.title}
              </Text>
              {Boolean(decision.message) && (
                <Text
                  testID="decision-toast-message"
                  style={[
                    s.message,
                    { color: isDanger ? Colors.dangerDarkText : Colors.primaryDeep },
                  ]}
                  numberOfLines={2}
                >
                  {decision.message}
                </Text>
              )}
            </View>

            <View style={s.actionsRow}>
              <TouchableOpacity
                testID="decision-toast-confirm-btn"
                accessibilityRole="button"
                accessibilityLabel={decision.confirmLabel}
                activeOpacity={0.8}
                hitSlop={CAPSULE_HIT_SLOP}
                onPress={() => handleActionPress('confirm')}
                style={[
                  s.capsuleBtn,
                  { backgroundColor: isDanger ? Colors.error : Colors.primary },
                ]}
              >
                <Text style={s.confirmTxt} numberOfLines={1}>
                  {decision.confirmLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="decision-toast-cancel-btn"
                accessibilityRole="button"
                accessibilityLabel={decision.cancelLabel}
                activeOpacity={0.8}
                hitSlop={CAPSULE_HIT_SLOP}
                onPress={() => handleActionPress('cancel')}
                style={[s.capsuleBtn, s.cancelBtn]}
              >
                <Text style={s.cancelTxt} numberOfLines={1}>
                  {decision.cancelLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100000,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.scrimDark10,
  },
  host: {
    position: 'absolute',
    left: Spacing.space4,
    right: Spacing.space4,
    alignItems: 'center',
  },
  card: {
    width: MAX_DECISION_WIDTH,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.transparent,
    borderWidth: 0.5,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space3,
    gap: Spacing.space2,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Almarai_400Regular',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  capsuleBtn: {
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_RADIUS,
    paddingHorizontal: Spacing.space3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.primarySoft14,
    borderWidth: 0.5,
    borderColor: Colors.primarySoft30,
  },
  confirmTxt: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cancelTxt: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryDeep,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
