import AsyncStorage from '@react-native-async-storage/async-storage'
import { clearLocalUserDraftsAndHistory } from '../clearUserData'
import { NOTIFICATION_PREFS_PREFIX } from '../notificationPrefsStorage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('../../services/socket', () => ({
  disconnectSocket: jest.fn(),
}))

jest.mock('../../api/users', () => ({
  usersApi: { unregisterPushToken: jest.fn().mockResolvedValue(undefined) },
}))

jest.mock('../../api/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}))

describe('clearLocalUserDraftsAndHistory (D-335 notification prefs cleanup)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined)
  })

  it('removes all @souqone_notification_prefs:* keys on logout or user switch', async () => {
    ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
      `${NOTIFICATION_PREFS_PREFIX}user-1`,
      `${NOTIFICATION_PREFS_PREFIX}user-2`,
      'unrelated-key',
    ])

    await clearLocalUserDraftsAndHistory()

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(
      expect.arrayContaining([
        `${NOTIFICATION_PREFS_PREFIX}user-1`,
        `${NOTIFICATION_PREFS_PREFIX}user-2`,
      ])
    )
    const allRemovedKeys = (AsyncStorage.multiRemove as jest.Mock).mock.calls.flatMap((c) => c[0])
    expect(allRemovedKeys).not.toContain('unrelated-key')
  })
})
