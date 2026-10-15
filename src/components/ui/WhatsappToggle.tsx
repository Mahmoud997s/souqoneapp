import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  StyleProp,
  ViewStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { WizardCard } from './WizardCard'

export interface WhatsappToggleProps {
  value: boolean
  onValueChange: (val: boolean) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  variant?: 'card' | 'row'
}

export function WhatsappToggle({
  value,
  onValueChange,
  disabled = false,
  style,
  testID = 'whatsapp-enabled-switch',
  variant = 'card',
}: WhatsappToggleProps) {
  const handleChange = (newVal: boolean) => {
    if (disabled) return
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {})
    } catch {}
    onValueChange(newVal)
  }

  const rowContent = (
    <View style={s.switchRow}>
      <View style={s.iconWrap}>
        <Ionicons name="logo-whatsapp" size={22} color="#16A34A" />
      </View>
      <View style={s.textCol}>
        <Text style={s.title}>التواصل عبر واتساب</Text>
        <Text style={s.subtitle}>يظهر زر واتساب للمشتري على رقم بروفايلك</Text>
      </View>
      <Switch
        value={value === true}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{ false: '#E2E8F0', true: Colors.primary }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        testID={testID}
      />
    </View>
  )

  if (variant === 'row') {
    return <View style={[s.rowContainer, style]}>{rowContent}</View>
  }

  return (
    <WizardCard
      title="التواصل"
      subtitle="يتواصل المشترون معك عبر رقم هاتف حسابك المسجل في سوق ون"
      style={style}
    >
      <View style={s.cardInnerRow}>
        <View style={s.iconWrap}>
          <Ionicons name="logo-whatsapp" size={22} color="#16A34A" />
        </View>
        <View style={s.textCol}>
          <Text style={s.title}>التواصل عبر واتساب</Text>
          <Text style={s.subtitle}>يظهر زر واتساب للمشتري على رقم بروفايلك</Text>
        </View>
        <Switch
          value={value === true}
          onValueChange={handleChange}
          disabled={disabled}
          trackColor={{ false: '#E2E8F0', true: Colors.primary }}
          thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
          testID={testID}
        />
      </View>
    </WizardCard>
  )
}

const s = StyleSheet.create({
  rowContainer: {
    paddingVertical: Spacing.space2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.space3,
  },
  cardInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.space3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
