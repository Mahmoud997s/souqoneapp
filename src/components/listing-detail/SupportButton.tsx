import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SupportHelpButton } from '../ui/SupportHelpButton'
import { Spacing } from '../../constants/spacing'

export interface SupportButtonProps {
  onPress: () => void
}

/**
 * SupportButton
 * Contextual help and customer support button for listing detail.
 * Wraps existing SupportHelpButton primitive.
 */
export function SupportButton({ onPress }: SupportButtonProps) {
  return (
    <View style={s.container}>
      <SupportHelpButton
        variant="subtle"
        title="تحتاج للمساعدة؟ تواصل مع الدعم الفني"
        onPress={onPress}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
  },
})
