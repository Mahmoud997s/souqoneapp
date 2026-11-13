import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { lineHeightFor } from '../../constants/typography'
import { useSocketStore } from '../../store/socketStore'

export interface ChatConnectionBannerProps {
  isConnected?: boolean
  message?: string
}

/**
 * ChatConnectionBanner
 *
 * Rendered directly below ChatRoomHeader when realtime WebSocket connection
 * is disconnected / unstable (S8b). Decoupled from S8a auth session expiry.
 */
export function ChatConnectionBanner({
  isConnected: propIsConnected,
  message = 'الاتصال الفوري غير مستقر — قد يتأخر استلام الرسائل أو تحديث حالتها',
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
          color={Colors.warning || '#D97706'}
          style={s.icon}
        />
        <Text style={s.messageText} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: Spacing.space3,
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
    lineHeight: lineHeightFor(12),
    color: '#92400E',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
