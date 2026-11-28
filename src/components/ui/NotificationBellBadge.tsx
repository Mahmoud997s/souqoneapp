import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Typography } from '../../constants/typography'

export interface NotificationBellBadgeProps {
  count: number
  testID?: string
}

export function formatNotificationBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}

/**
 * Shared unread notification count badge rendered on top of header bell buttons.
 * Hidden when count <= 0; caps display at "99+".
 */
export function NotificationBellBadge({
  count,
  testID = 'notification-bell-badge',
}: NotificationBellBadgeProps) {
  if (!Number.isFinite(count) || count <= 0) {
    return null
  }

  return (
    <View pointerEvents="none" style={s.badge} testID={testID}>
      <Text style={s.badgeText} numberOfLines={1}>
        {formatNotificationBadgeCount(Math.floor(count))}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -3,
    end: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.primaryStrong,
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    color: Colors.white,
    textAlign: 'center',
  },
})
