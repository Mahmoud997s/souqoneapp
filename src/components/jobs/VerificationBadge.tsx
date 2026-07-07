import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { View, StyleSheet, Text } from 'react-native'
import { STRINGS } from '../../constants/jobs'

interface VerificationBadgeProps {
  size?: number
  showText?: boolean
}

export function VerificationBadge({ size = 14, showText = false }: VerificationBadgeProps) {
  if (showText) {
    return (
      <View style={s.textBadge}>
        <Ionicons name="checkmark-circle" size={10} color="#2563eb" />
        <Text style={s.badgeText}>{STRINGS.VERIFIED}</Text>
      </View>
    )
  }
  
  return (
    <Ionicons name="checkmark-circle" size={size} color={Colors.primary} style={s.icon} />
  )
}

const s = StyleSheet.create({
  icon: {
    alignSelf: 'center',
  },
  textBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF', // bg-blue-50
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#2563eb', // text-blue-600
    fontSize: 10,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, }
})
