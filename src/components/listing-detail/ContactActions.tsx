import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
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
}

/**
 * ContactActions
 * Presentational contact action buttons.
 * Supports inline card layout and sticky bottom bar layout.
 * Supports four availability modes: full, noWhatsapp, chatOnly, and hidden.
 */
export function ContactActions({
  variant,
  availability,
  busy,
  onCall,
  onWhatsApp,
  onChat,
}: ContactActionsProps) {
  if (availability.mode === 'hidden') {
    return null
  }

  const isSticky = variant === 'sticky'

  return (
    <View style={[isSticky ? s.stickyContainer : s.inlineContainer]}>
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
                size={18}
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
                <Ionicons name="logo-whatsapp" size={18} color={Colors.white} />
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
                <Ionicons name="call-outline" size={18} color={Colors.white} />
                <Text style={s.callButtonText}>اتصال</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  inlineContainer: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
  },
  stickyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space5,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    zIndex: 90,
    ...Shadows.floating,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  button: {
    flex: 1,
    height: 46,
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
    fontSize: 14,
    lineHeight: 18,
    color: Colors.white,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  whatsappButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.white,
  },
  chatButton: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.primary,
  },
})
