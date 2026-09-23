import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export interface SafetyTipsProps {
  role: 'buyer' | 'seller'
  title: string
  tips: readonly string[]
}

/**
 * SafetyTips
 * Informational safety guidelines card for buyers/sellers.
 */
export function SafetyTips({ role, title, tips }: SafetyTipsProps) {
  if (!tips || tips.length === 0) {
    return null
  }

  const isBuyer = role === 'buyer'

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Ionicons
          name="shield-checkmark"
          size={20}
          color={isBuyer ? Colors.primary : Colors.accent}
        />
        <Text style={s.title}>{title}</Text>
      </View>

      <View style={s.tipsList}>
        {tips.map((tip, index) => (
          <View key={index} style={s.tipRow}>
            <Text style={s.bulletPoint}>•</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FEFCE8',
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  tipsList: {
    gap: 6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletPoint: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
