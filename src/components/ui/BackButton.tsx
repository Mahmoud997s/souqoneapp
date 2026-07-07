import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'

interface BackButtonProps {
  onPress?: () => void
  color?: string
  bgColor?: string
  style?: ViewStyle
}

export function BackButton({
  onPress,
  color = Colors.white,
  bgColor = 'rgba(255,255,255,0.15)',
  style,
}: BackButtonProps) {
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bgColor }, style]}
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-forward-outline" size={22} color={color} />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
})
