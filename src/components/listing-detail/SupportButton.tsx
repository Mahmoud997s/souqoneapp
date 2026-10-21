import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SupportHelpButton } from '../ui/SupportHelpButton'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'

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
        style={s.button}
        textStyle={s.buttonText}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
  },
  button: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    minHeight: Spacing.touch,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  buttonText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text2,
  },
})
