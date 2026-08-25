import * as SecureStore from 'expo-secure-store'
import { disconnectSocket } from '../services/socket'
import { usersApi } from '../api/users'
// Use dynamic imports for stores to avoid circular dependencies during initial load
import { queryClient } from '../../app/_layout'

export const clearAllUserData = async () => {
  // 1. Unregister Push Token from Backend (best effort, fail silently)
  try {
    const token = await SecureStore.getItemAsync('accessToken')
    if (token) {
      await usersApi.unregisterPushToken().catch(() => {})
    }
  } catch (error) {
    console.warn('[clearUserData] Failed to unregister push token:', error)
  }

  // 2. Clear Local Tokens (MUST SUCCEED)
  try {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
  } catch (error) {
    console.error('[clearUserData] Failed to delete tokens from SecureStore:', error)
  }

  // 3. Disconnect Socket
  try {
    disconnectSocket()
  } catch (error) {
    console.warn('[clearUserData] Failed to disconnect socket:', error)
  }

  // 4. Reset All Stores safely
  const resetPromises = [
    import('../store/equipmentWizardStore').then(m => m.useEquipmentWizardStore.getState().resetDraft?.()),
    import('../store/operatorWizardStore').then(m => m.useOperatorWizardStore.getState().resetDraft?.()),
    import('../store/busWizardStore').then(m => m.useBusWizardStore.getState().reset?.()),
    import('../store/carrierWizardStore').then(m => m.useCarrierWizardStore.getState().reset?.()),
    import('../store/transportWizardStore').then(m => m.useTransportWizardStore.getState().reset?.()),
    import('../store/jobProfileStore').then(m => m.useJobProfileStore.getState().reset?.()),
    import('../store/jobPostStore').then(m => m.useJobPostStore.getState().reset?.()),
    import('../store/postStore').then(m => m.usePostStore.getState().reset?.()),
    import('../store/pinStore').then(m => m.usePinStore.getState().reset?.()),
    import('../store/chatMessagesStore').then(m => m.useChatMessagesStore.getState().reset?.()),
    import('../store/archiveStore').then(m => m.useArchiveStore.getState().reset?.()),
  ]

  await Promise.allSettled(resetPromises)

  // 5. Clear React Query Cache
  try {
    if (queryClient) {
      queryClient.clear()
    }
  } catch (error) {
    console.warn('[clearUserData] Failed to clear React Query cache:', error)
  }
}
