import { Linking } from 'react-native'
import { renderHook, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import { useServiceFormLogic } from '../../hooks/useServiceFormLogic'
import { defaultServiceFormData } from '../../store/serviceWizardStore'
import { dialogService } from '../../store/dialogStore'
import * as requestPermissionModule from '../../utils/requestPermission'

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('useServiceFormLogic S4 requestPermission integration (D-262)', () => {
  const setField = jest.fn()
  const setLocation = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('delegates media permission to central requestPermission with service Arabic copy and blocks picker on denial', async () => {
    const requestPermissionSpy = jest
      .spyOn(requestPermissionModule, 'requestPermission')
      .mockResolvedValueOnce({
        status: 'denied-can-ask-again',
        granted: false,
        canAskAgain: true,
      })
    const launchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync')

    const { result } = await renderHook(() =>
      useServiceFormLogic({ ...defaultServiceFormData }, setField, setLocation)
    )

    await act(async () => {
      await result.current.handlePickImages()
    })

    expect(requestPermissionSpy).toHaveBeenCalledTimes(1)
    const adapterArg = requestPermissionSpy.mock.calls[0][0]
    expect(adapterArg.kind).toBe('mediaLibrary')
    expect(adapterArg.deniedMessageAr).toContain('صور الخدمة')
    expect(launchSpy).not.toHaveBeenCalled()

    requestPermissionSpy.mockRestore()
    launchSpy.mockRestore()
  })

  it('opens phone settings automatically when permission is permanently denied (canAskAgain: false)', async () => {
    const permSpy = jest
      .spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync')
      .mockResolvedValueOnce({
        granted: false,
        status: 'denied',
        canAskAgain: false,
      } as never)
    const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValueOnce(undefined)
    const launchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync')

    const { result } = await renderHook(() =>
      useServiceFormLogic({ ...defaultServiceFormData }, setField, setLocation)
    )

    await act(async () => {
      await result.current.handlePickImages()
    })

    expect(permSpy).toHaveBeenCalledTimes(1)
    expect(dialogService.confirm).toHaveBeenCalledWith(
      'إذن الوصول مطلوب',
      expect.stringContaining('إعدادات الهاتف'),
      expect.any(Function),
      'فتح الإعدادات',
      'إلغاء'
    )
    const confirmAction = (dialogService.confirm as jest.Mock).mock.calls[0][2]
    confirmAction()
    expect(openSettingsSpy).toHaveBeenCalledTimes(1)
    expect(launchSpy).not.toHaveBeenCalled()

    permSpy.mockRestore()
    openSettingsSpy.mockRestore()
    launchSpy.mockRestore()
  })

  it('picks images and updates formData.images when permission is granted', async () => {
    const permSpy = jest
      .spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync')
      .mockResolvedValueOnce({
        granted: true,
        status: 'granted',
        canAskAgain: true,
      } as never)
    const launchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///service-1.jpg' }],
    } as never)

    const { result } = await renderHook(() =>
      useServiceFormLogic({ ...defaultServiceFormData }, setField, setLocation)
    )

    await act(async () => {
      await result.current.handlePickImages()
    })

    expect(launchSpy).toHaveBeenCalledTimes(1)
    expect(setField).toHaveBeenCalledWith('images', [
      { uri: 'file:///service-1.jpg', isPrimary: false },
    ])

    permSpy.mockRestore()
    launchSpy.mockRestore()
  })
})
