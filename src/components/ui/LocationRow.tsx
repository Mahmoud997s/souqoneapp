import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'

interface LocationRowProps {
  location: string
  pill?: boolean
  style?: ViewStyle
}

export function LocationRow({ location, pill, style }: LocationRowProps) {
  return (
    <View style={[s.row, pill ? s.pill : null, style]}>
      <Ionicons name="location-outline" size={14} color={Colors.text2} />
      <Text style={s.txt} numberOfLines={1}>
        {location}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  txt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
})
