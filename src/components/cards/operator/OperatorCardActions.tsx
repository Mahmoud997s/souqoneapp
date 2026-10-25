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
  isWhatsappEnabled: boolean
}

/**
 * OperatorCardActions
 * Contact action buttons row (Call & WhatsApp) with 44pt touch targets
 * and clean semantic tokens.
 */
export function OperatorCardActions({
  onCall,
  onWhatsApp,
  isWhatsappEnabled,
}: OperatorCardActionsProps) {
  return (
    <View style={s.actionRow}>
      <TouchableOpacity
        style={s.callBtn}
        onPress={onCall}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="اتصال بالمشغل"
      >
        <Ionicons name="call" size={14} color={Colors.primary} />
        <Text style={s.callBtnTxt}>اتصال</Text>
      </TouchableOpacity>

      {isWhatsappEnabled && (
        <TouchableOpacity
          style={s.whatsappBtn}
          onPress={onWhatsApp}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="تواصل عبر واتساب"
        >
          <Ionicons name="logo-whatsapp" size={15} color={Colors.primary} />
          <Text style={s.whatsappBtnTxt}>واتساب</Text>
        </TouchableOpacity>
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
    backgroundColor: Colors.paleMint,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  callBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primaryDark,
  },
  whatsappBtn: {
    flex: 1,
    minHeight: Spacing.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  whatsappBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primaryDark,
  },
})
