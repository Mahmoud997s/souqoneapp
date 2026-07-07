import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'

type BadgeVariant = 'premium' | 'featured' | 'category' | 'neutral'

interface StatusBadgeProps {
  label: string
  variant?: BadgeVariant
  icon?: string
  style?: ViewStyle
}

const VARIANTS: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  premium:  { bg: Colors.accent,    text: Colors.white },
  featured: { bg: 'rgba(0,74,198,0.1)', text: Colors.primary },
  category: { bg: Colors.inputBg,    text: Colors.text2 },
  neutral:  { bg: Colors.surface,    text: Colors.text2 },
}

export function StatusBadge({
  label,
  variant = 'neutral',
  icon,
  style,
}: StatusBadgeProps) {
  const v = VARIANTS[variant]
  return (
    <View style={[s.base, { backgroundColor: v.bg }, style]}>
      {icon ? (
        <Ionicons name={icon as any} size={12} color={v.text} />
      ) : null}
      <Text style={[s.text, { color: v.text }]}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
})
