import { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { Shadows } from '../../constants/shadows'

interface ScreenCardProps {
  children: ReactNode
  style?: ViewStyle
  noBorder?: boolean
}

export function ScreenCard({ children, style, noBorder }: ScreenCardProps) {
  return (
    <View style={[s.card, noBorder ? null : s.border, style]}>
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space6,
    ...Shadows.card,
  },
  border: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
})
