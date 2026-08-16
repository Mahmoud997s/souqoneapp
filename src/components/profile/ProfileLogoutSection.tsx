import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ProfileLogoutSectionProps {
  onLogout: () => void
}

export function ProfileLogoutSection({ onLogout }: ProfileLogoutSectionProps) {
  return (
    <>
      {/* ── Logout Button ── */}
      <View style={s.logoutWrap}>
        <TouchableOpacity style={s.logoutBtn} onPress={onLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={19} color="#DC2626" style={{ marginEnd: 8 }} />
          <Text style={s.logoutTxt}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      {/* ── Version Info ── */}
      <Text style={s.version}>سوق ون © الإصدار 1.0.0</Text>
    </>
  )
}

const s = StyleSheet.create({
  /* Logout */
  logoutWrap: {
    marginTop: 2,
    marginBottom: 10,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  logoutTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#DC2626',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Version */
  version: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
})
