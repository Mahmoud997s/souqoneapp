import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

interface InlineErrorProps {
  message?: string
}

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null
  
  return (
    <View style={s.capsule}>
      <Ionicons name="alert-circle" size={14} color={Colors.error} />
      <Text style={s.text}>{message}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.error + '12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginBottom: Spacing.space2,
    marginTop: 2,
    gap: 6,
  },
  text: {
    fontFamily: 'Almarai_400Regular',
    
    fontSize: 12,
    color: Colors.error,
    writingDirection: 'rtl',
  },
})
