import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { useSocketStore } from '../../store/socketStore'

export interface ChatConnectionBannerProps {
  isConnected?: boolean
  message?: string
}

/**
 * Slim 36px offline / cached-data banner rendered directly below the header.
 */
export function ChatConnectionBanner({
  isConnected: propIsConnected,
  message = 'لا يوجد اتصال، يتم عرض آخر نسخة محفوظة',
}: ChatConnectionBannerProps) {
  const storeIsConnected = useSocketStore((s) => s.isConnected)
  const isConnected = propIsConnected !== undefined ? propIsConnected : storeIsConnected

  if (isConnected) {
    return null
  }

  return (
    <View style={s.container} testID="chat-connection-banner" accessibilityRole="alert">
      <View style={s.contentRow}>
        <Ionicons
          name="cloud-offline-outline"
          size={16}
          color={Colors.warning}
          style={s.icon}
        />
        <Text style={s.messageText} numberOfLines={1} ellipsizeMode="tail">
          {message}
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    minHeight: 36,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.warningBorder,
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  icon: {
    flexShrink: 0,
  },
  messageText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.warningText,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
