import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import { BusContractView } from '../../../types/busDetailViewModel.types'

export type BusContractLockedView = Extract<BusContractView, { access: 'locked' }>

export interface BusContractLockedCardProps {
  contract: BusContractLockedView
  onRequireLogin: () => void
}

export function BusContractLockedCard({
  contract,
  onRequireLogin,
}: BusContractLockedCardProps) {
  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={s.iconBadge}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
            عقد التشغيل
          </Text>
          {contract.typeLabel ? (
            <Text style={s.cardSub} maxFontSizeMultiplier={1.3}>
              {contract.typeLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={s.lockedContent}>
        <Text style={s.lockedNotice} maxFontSizeMultiplier={1.3}>
          سجّل الدخول لعرض تفاصيل عقد التشغيل
        </Text>
        <TouchableOpacity
          style={s.loginButton}
          onPress={onRequireLogin}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="تسجيل الدخول"
        >
          <Ionicons name="log-in-outline" size={18} color={Colors.white} />
          <Text style={s.loginButtonText} maxFontSizeMultiplier={1.3}>
            تسجيل الدخول
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    marginBottom: Spacing.space4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardTitle: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
  },
  cardSub: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
    marginTop: 2,
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: Spacing.space4,
    gap: Spacing.space3,
  },
  lockedNotice: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space5,
    minHeight: Spacing.touch,
  },
  loginButtonText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.white,
  },
})
