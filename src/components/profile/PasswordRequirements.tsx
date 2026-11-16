import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'

interface PasswordRequirementsProps {
  newPassword: string
  confirmPassword: string
}

export function PasswordRequirements({ newPassword, confirmPassword }: PasswordRequirementsProps) {
  const isLengthValid = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword

  const requirements = [
    { key: 'length', label: '٨ أحرف على الأقل', met: isLengthValid },
    { key: 'uppercase', label: 'حرف كبير واحد على الأقل (A-Z)', met: hasUppercase },
    { key: 'number', label: 'رقم واحد على الأقل (0-9)', met: hasNumber },
    { key: 'match', label: 'كلمتا المرور متطابقتان', met: isMatch },
  ]

  return (
    <View style={s.container}>
      <Text style={s.header}>شروط كلمة المرور:</Text>
      <View style={s.list}>
        {requirements.map((req) => (
          <View key={req.key} style={s.itemRow}>
            <Ionicons
              name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
              size={15}
              color={req.met ? Colors.emeraldBright : Colors.slateMuted}
              style={s.icon}
            />
            <Text style={[s.label, req.met && s.labelMet]}>
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.slateSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    padding: 12,
    marginVertical: 4,
    gap: 8,
  },
  header: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.slateText,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  list: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginEnd: 8,
  },
  label: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.slateText,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  labelMet: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.emeraldBright,
  },
})
