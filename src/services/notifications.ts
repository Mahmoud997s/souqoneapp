import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { Colors } from '../../src/constants/colors'
import { useChatStore } from '../store/chatStore'

export function shouldShowNotificationInForeground(
  data: Record<string, unknown> | undefined | null,
  activeRoomId: string | null | undefined
): boolean {
  if (!data || !activeRoomId) return true
  const conversationId =
    typeof data.conversationId === 'string'
      ? data.conversationId
      : typeof data.roomId === 'string'
        ? data.roomId
        : undefined
  if (!conversationId) return true
  return conversationId !== activeRoomId
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification?.request?.content?.data as Record<string, unknown> | undefined
    const activeRoomId = useChatStore.getState().activeRoomId
    const shouldShow = shouldShowNotificationInForeground(data, activeRoomId)
    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: shouldShow,
      shouldShowBanner: shouldShow,
      shouldShowList: shouldShow,
    }
  },
})

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SouqOne',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: Colors.primary,
    })
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync()
    return token
  } catch {
    return null
  }
}
