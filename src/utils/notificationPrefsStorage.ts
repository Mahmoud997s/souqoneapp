import AsyncStorage from '@react-native-async-storage/async-storage'
import { logWarn } from './safeLog'

export const NOTIFICATION_PREFS_PREFIX = '@souqone_notification_prefs:'

export interface NotificationPrefs {
  msgNotif: boolean
  adNotif: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  msgNotif: true,
  adNotif: false,
}

export function getNotificationPrefsKey(userId: string): string {
  return `${NOTIFICATION_PREFS_PREFIX}${userId}`
}

export async function loadNotificationPrefs(userId?: string | null): Promise<NotificationPrefs> {
  if (!userId) {
    return { ...DEFAULT_NOTIFICATION_PREFS }
  }
  try {
    const raw = await AsyncStorage.getItem(getNotificationPrefsKey(userId))
    if (!raw) {
      return { ...DEFAULT_NOTIFICATION_PREFS }
    }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs> | null
    return {
      msgNotif: typeof parsed?.msgNotif === 'boolean' ? parsed.msgNotif : DEFAULT_NOTIFICATION_PREFS.msgNotif,
      adNotif: typeof parsed?.adNotif === 'boolean' ? parsed.adNotif : DEFAULT_NOTIFICATION_PREFS.adNotif,
    }
  } catch (error) {
    logWarn('notificationPrefsStorage:load', error)
    return { ...DEFAULT_NOTIFICATION_PREFS }
  }
}

export async function saveNotificationPrefs(userId: string, prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(getNotificationPrefsKey(userId), JSON.stringify(prefs))
}

export async function clearAllNotificationPrefs(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys()
  const prefKeys = allKeys.filter((key) => key.startsWith(NOTIFICATION_PREFS_PREFIX))
  if (prefKeys.length > 0) {
    await AsyncStorage.multiRemove(prefKeys)
  }
}
