import { Linking } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {
  requestPermission,
  mediaLibraryAdapter,
  PermissionAdapter,
} from '../requestPermission'
import { dialogService } from '../../store/dialogStore'

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('requestPermission utility (D-237)', () => {
  let openSettingsSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    if (!Linking.openSettings) {
      ;(Linking as any).openSettings = jest.fn()
    }
    openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockImplementation(() => Promise.resolve() as any)
  })

  afterEach(() => {
    openSettingsSpy.mockRestore()
  })

  const testAdapter: PermissionAdapter = {
    kind: 'mediaLibrary',
    titleAr: 'إذن الوصول مطلوب',
    deniedMessageAr: 'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة',
    blockedMessageAr: 'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور القطعة',
    request: jest.fn(),
  }

  it('1. granted -> proceeds without showing any dialog', async () => {
    ;(testAdapter.request as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    })

    const result = await requestPermission(testAdapter)

    expect(result.status).toBe('granted')
    expect(result.granted).toBe(true)
    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(dialogService.confirm).not.toHaveBeenCalled()
  })

  it('2. denied + canAskAgain=true -> plain message alert, no settings button', async () => {
    ;(testAdapter.request as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    })

    const result = await requestPermission(testAdapter)

    expect(result.status).toBe('denied-can-ask-again')
    expect(result.granted).toBe(false)
    expect(result.canAskAgain).toBe(true)

    // Displays standard alert
    expect(dialogService.alert).toHaveBeenCalledTimes(1)
    expect(dialogService.alert).toHaveBeenCalledWith(
      'إذن الوصول مطلوب',
      'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة'
    )
    // No confirm with settings button
    expect(dialogService.confirm).not.toHaveBeenCalled()
  })

  it('3. denied + canAskAgain=false -> settings button (confirm), press calls Linking.openSettings once', async () => {
    ;(testAdapter.request as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    })

    const result = await requestPermission(testAdapter)

    expect(result.status).toBe('denied-blocked')
    expect(result.granted).toBe(false)
    expect(result.canAskAgain).toBe(false)

    // No standard alert
    expect(dialogService.alert).not.toHaveBeenCalled()

    // Confirm dialog shown with settings button
    expect(dialogService.confirm).toHaveBeenCalledTimes(1)
    const [title, message, onConfirm, confirmText, cancelText] = (
      dialogService.confirm as jest.Mock
    ).mock.calls[0]

    expect(title).toBe('إذن الوصول مطلوب')
    expect(message).toBe(
      'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور القطعة'
    )
    expect(confirmText).toBe('فتح الإعدادات')
    expect(cancelText).toBe('إلغاء')

    // Calling the onConfirm callback triggers Linking.openSettings
    expect(openSettingsSpy).not.toHaveBeenCalled()
    onConfirm()
    expect(openSettingsSpy).toHaveBeenCalledTimes(1)
  })

  it('4. request throws -> handled safely (no crash, message displayed)', async () => {
    ;(testAdapter.request as jest.Mock).mockRejectedValueOnce(
      new Error('OS media framework unavailable')
    )

    const result = await requestPermission(testAdapter)

    expect(result.status).toBe('denied-can-ask-again')
    expect(result.granted).toBe(false)
    expect(result.canAskAgain).toBe(true)

    // Safe fallback alert
    expect(dialogService.alert).toHaveBeenCalledTimes(1)
    expect(dialogService.alert).toHaveBeenCalledWith(
      'إذن الوصول مطلوب',
      'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة'
    )
    expect(dialogService.confirm).not.toHaveBeenCalled()
  })

  it('5. limited access (iOS accessPrivileges: "limited") is still treated as granted', async () => {
    ;(testAdapter.request as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
      granted: false,
      canAskAgain: true,
      accessPrivileges: 'limited',
    })

    const result = await requestPermission(testAdapter)

    expect(result.status).toBe('granted')
    expect(result.granted).toBe(true)
    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(dialogService.confirm).not.toHaveBeenCalled()
  })

  it('6. mediaLibraryAdapter delegates to ImagePicker.requestMediaLibraryPermissionsAsync', async () => {
    const pickerSpy = jest
      .spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync')
      .mockResolvedValueOnce({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      })

    const response = await mediaLibraryAdapter.request()

    expect(pickerSpy).toHaveBeenCalledTimes(1)
    expect(response.granted).toBe(true)
    pickerSpy.mockRestore()
  })
})
