import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { Spacing } from '../../constants/spacing'
import { Colors } from '../../constants/colors'

interface SectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
  style?: ViewStyle
}

export function SectionHeader({
  title,
  actionLabel = 'عرض الكل',
  onAction,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[s.row, style]}>
      <Text style={s.title}>{title}</Text>
      {onAction ? (
        <TouchableOpacity style={s.actionBtn} onPress={onAction} activeOpacity={0.75}>
          <Text style={s.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  actionBtn: {
    backgroundColor: Colors.paleMint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(142, 182, 155, 0.35)',
  },
  action: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
})
