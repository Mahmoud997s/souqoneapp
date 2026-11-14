import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { disconnectSocket } from '../services/socket'
import { usersApi } from '../api/users'
import { queryClient } from '../api/queryClient'
import { useEquipmentWizardStore } from '../store/equipmentWizardStore'
import { useOperatorWizardStore } from '../store/operatorWizardStore'
import { useBusWizardStore } from '../store/busWizardStore'
import { usePostStore } from '../store/postStore'
import { usePinStore } from '../store/pinStore'
import { useChatMessagesStore } from '../store/chatMessagesStore'
import { useArchiveStore } from '../store/archiveStore'
import { useCarWizardStore } from '../store/carWizardStore'
import { usePartWizardStore } from '../store/partWizardStore'
import { useServiceWizardStore } from '../store/serviceWizardStore'
import { logWarn, logError } from './safeLog'

export const USER_LOCAL_DRAFT_AND_HISTORY_KEYS = [
  'part-wizard-draft',
  'service-wizard-draft',
  '@souqone_recent_searches',
  'car-wizard-storage',
  'bus-wizard-storage',
  'souqone_equipment_wizard_draft',
  'souqone_operator_wizard_draft',
  'post-draft-storage',
  'archive-storage',
  'pinned-chat-storage',
  'chat-messages-storage',
] as const

/**
 * Clears all local user drafts, chat caches, search history, and React Query cache
 * without deleting SecureStore auth tokens or unregistering push tokens.
 * Safe to call both during full logout and on cross-account login switch.
 */
export const clearLocalUserDraftsAndHistory = async (): Promise<void> => {
  // 1. Reset all 10 persisted Zustand stores safely
  const storeResetTasks: Array<() => unknown> = [
    () => useEquipmentWizardStore.getState().resetDraft?.(),
    () => useOperatorWizardStore.getState().resetDraft?.(),
    () => useBusWizardStore.getState().reset?.(),
    () => usePostStore.getState().reset?.(),
    () => usePinStore.getState().reset?.(),
    () => useChatMessagesStore.getState().reset?.(),
    () => useArchiveStore.getState().reset?.(),
    () => useCarWizardStore.getState().resetForm?.(),
    () => usePartWizardStore.getState().reset?.(),
    () => useServiceWizardStore.getState().reset?.(),
  ]
  const resetResults = await Promise.allSettled(
    storeResetTasks.map((runReset) => Promise.resolve().then(runReset))
  )

  for (const result of resetResults) {
    if (result.status === 'rejected') {
      logWarn('clearUserData:ResetStore', result.reason)
    }
  }

  // 2. Directly wipe AsyncStorage keys to prevent zustand/persist async race on rapid account switch
  try {
    await AsyncStorage.multiRemove([...USER_LOCAL_DRAFT_AND_HISTORY_KEYS])
  } catch (error) {
    logWarn('clearUserData:ClearAsyncStorage', error)
  }

  // 3. Clear React Query Cache
  try {
    if (queryClient) {
      queryClient.clear()
    }
  } catch (error) {
    logWarn('clearUserData:ClearQueryCache', error)
  }
}

export const clearAllUserData = async () => {
  // 1. Unregister Push Token from Backend (best effort, fail silently)
  try {
    const token = await SecureStore.getItemAsync('accessToken')
    if (token) {
      await usersApi.unregisterPushToken().catch(() => {})
    }
  } catch (error) {
    logWarn('clearUserData:PushToken', error)
  }

  // 2. Clear Local Tokens (MUST SUCCEED)
  try {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
  } catch (error) {
    logError('clearUserData:DeleteTokens', error)
  }

  // 3. Disconnect Socket
  try {
    disconnectSocket()
  } catch (error) {
    logWarn('clearUserData:DisconnectSocket', error)
  }

  // 4. Clear all local user drafts, search history, and query cache
  await clearLocalUserDraftsAndHistory()
}
