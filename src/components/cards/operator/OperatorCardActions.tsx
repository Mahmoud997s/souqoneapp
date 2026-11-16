import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { lineHeightFor } from '../../../constants/typography'

export interface OperatorCardActionsProps {
  onCall: (e: any) => void
  onWhatsApp: (e: any) => void
  onChat?: (e: any) => void
  isWhatsappEnabled: boolean
}

/**
 * OperatorCardActions
 * Contact action buttons row: primary "اتصال" and secondary "واتساب" (when enabled)
 * or "محادثة" fallback with 44pt touch targets and clean semantic tokens.
 */
export function OperatorCardActions({
  onCall,
  onWhatsApp,
  onChat,
  isWhatsappEnabled,
}: OperatorCardActionsProps) {
  return (
    <View style={s.actionRow}>
      <TouchableOpacity
        testID="operator-call-btn"
        style={s.callBtn}
        onPress={onCall}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="اتصال بالمشغل"
      >
        <Ionicons name="call" size={14} color={Colors.white} />
        <Text style={s.callBtnTxt}>اتصال</Text>
      </TouchableOpacity>

      {isWhatsappEnabled ? (
        <TouchableOpacity
          testID="operator-whatsapp-btn"
          style={s.secondaryBtn}
          onPress={onWhatsApp}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="تواصل عبر واتساب"
        >
          <Ionicons name="logo-whatsapp" size={15} color={Colors.primary} />
          <Text style={s.secondaryBtnTxt}>واتساب</Text>
        </TouchableOpacity>
      ) : (
        onChat && (
          <TouchableOpacity
            testID="operator-chat-btn"
            style={s.secondaryBtn}
            onPress={onChat}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="محادثة المشغل"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={15} color={Colors.primary} />
            <Text style={s.secondaryBtnTxt}>محادثة</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  )
}

const s = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginTop: Spacing.space3,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  callBtn: {
    flex: 1,
    minHeight: Spacing.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  callBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: Spacing.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
