import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface ChangePasswordNavBarProps {
  paddingTop: number
  onBackPress: () => void
}

export function ChangePasswordNavBar({ paddingTop, onBackPress }: ChangePasswordNavBarProps) {
  return (
    <View style={[s.navBarFixed, { paddingTop }]}>
      <View style={s.navBarRow}>
        {/* Back Button (physical right in RTL) */}
        <TouchableOpacity
          style={s.navBtn}
          activeOpacity={0.75}
          onPress={onBackPress}
          accessibilityLabel="رجوع"
        >
          <Ionicons name="arrow-forward-outline" size={18} color="#1E293B" />
        </TouchableOpacity>

        {/* Title Badge */}
        <View style={s.navTitleBadge}>
          <Text style={s.navTitle} numberOfLines={1}>تغيير كلمة المرور</Text>
        </View>

        {/* Action Buttons (physical left in RTL) */}
        <View style={s.navActions}>
          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/chat' as any)}
            accessibilityLabel="الرسائل"
          >
            <Ionicons name="chatbubble-outline" size={17} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/profile/notifications' as any)}
            accessibilityLabel="الإشعارات"
          >
            <Ionicons name="notifications-outline" size={17} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

const s = StyleSheet.create({
  navBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
    height: 44,
    gap: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitleBadge: {
    flex: 1,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
})
