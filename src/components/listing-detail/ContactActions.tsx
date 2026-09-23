import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'

export type ContactAvailability =
  | { mode: 'full' }
  | { mode: 'noWhatsapp' }
  | { mode: 'chatOnly' }
  | { mode: 'hidden' }

export interface ContactActionsProps {
  variant: 'inline' | 'sticky'
  availability: ContactAvailability
  busy: boolean
  onCall: () => void
  onWhatsApp: () => void
  onChat: () => void
  scrollY?: SharedValue<number>
  threshold?: number
}

/**
 * ContactActions
 * Presentational contact action buttons.
 * Supports inline card layout and sticky glassmorphic floating bar layout.
 * Supports four availability modes: full, noWhatsapp, chatOnly, and hidden.
 * When variant='sticky' and scrollY is passed, smoothly fades & slides in
 * only after the user scrolls past the main inline contact card (threshold).
 */
export function ContactActions({
  variant,
  availability,
  busy,
  onCall,
  onWhatsApp,
  onChat,
  scrollY,
  threshold = 300,
}: ContactActionsProps) {
  const insets = useSafeAreaInsets()

  if (availability.mode === 'hidden') {
    return null
  }

  const isSticky = variant === 'sticky'

  const animatedStickyStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: 1, transform: [{ translateY: 0 }] }
    }
    const opacity = interpolate(
      scrollY.value,
      [threshold - 50, threshold],
      [0, 1],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      scrollY.value,
      [threshold - 50, threshold],
      [24, 0],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [{ translateY }],
      pointerEvents: scrollY.value >= threshold - 30 ? 'auto' : 'none',
    }
  })

  const content = (
    <View style={s.buttonsRow}>
      {/* Chat Action (available in all non-hidden modes) */}
      <TouchableOpacity
        style={[
          s.button,
          s.chatButton,
          availability.mode === 'chatOnly' && s.fullWidthButton,
        ]}
        onPress={onChat}
        disabled={busy}
        activeOpacity={0.8}
        testID="btn-contact-chat"
      >
        {busy ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={17}
              color={Colors.primary}
            />
            <Text style={s.chatButtonText}>محادثة</Text>
          </>
        )}
      </TouchableOpacity>

      {/* WhatsApp Action (only in full mode) */}
      {availability.mode === 'full' ? (
        <TouchableOpacity
          style={[s.button, s.whatsappButton]}
          onPress={onWhatsApp}
          disabled={busy}
          activeOpacity={0.8}
          testID="btn-contact-whatsapp"
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={17} color={Colors.white} />
              <Text style={s.whatsappButtonText}>واتساب</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {/* Call Action (in full & noWhatsapp modes) */}
      {availability.mode === 'full' || availability.mode === 'noWhatsapp' ? (
        <TouchableOpacity
          style={[s.button, s.callButton]}
          onPress={onCall}
          disabled={busy}
          activeOpacity={0.8}
          testID="btn-contact-call"
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="call-outline" size={17} color={Colors.white} />
              <Text style={s.callButtonText}>اتصال</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  )

  if (isSticky) {
    return (
      <Animated.View
        style={[
          s.stickyWrapper,
          { bottom: Math.max(insets.bottom, 12) },
          animatedStickyStyle,
        ]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={70}
          tint="light"
          blurMethod="dimezisBlurView"
          style={s.stickyCard}
        >
          {content}
        </BlurView>
      </Animated.View>
    )
  }

  return <View style={s.inlineContainer}>{content}</View>
}

const s = StyleSheet.create({
  inlineContainer: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
  },
  stickyWrapper: {
    position: 'absolute',
    left: Spacing.space4,
    right: Spacing.space4,
    zIndex: 90,
  },
  stickyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2 + 2,
    borderRadius: Radius.xl,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
    ...Shadows.floating,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  button: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 6,
  },
  fullWidthButton: {
    flex: 1,
  },
  callButton: {
    backgroundColor: Colors.primary,
  },
  callButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.white,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  whatsappButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.white,
  },
  chatButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  chatButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.primary,
  },
})
