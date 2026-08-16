import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'

export function SecurityInfoBanner() {
  return (
    <View style={s.banner}>
      <View style={s.iconWrap}>
        <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
      </View>
      <View style={s.textWrap}>
        <Text style={s.title}>احمِ حسابك</Text>
        <Text style={s.subtitle}>
          استخدم كلمة مرور قوية وغير مستخدمة في حسابات أخرى للحفاظ على أمان حسابك وبياناتك.
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E3A8A',
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 17,
    color: '#3B82F6',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
})
