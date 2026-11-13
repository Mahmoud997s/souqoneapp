import { renderHook, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import { useEditProfile } from '../../hooks/useEditProfile'
import { mapProfileBackendErrors } from '../../utils/profileValidation'
import { usersApi } from '../../api/users'
import { locationsApi } from '../../api/locations'
import { dialogService } from '../../store/dialogStore'
import { useAuthStore } from '../../store/authStore'
import * as requestPermissionModule from '../../utils/requestPermission'

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  }),
}))

jest.mock('../../api/users', () => ({
  usersApi: {
    updateProfile: jest.fn(),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
  },
}))

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
    getWilayas: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
    show: jest.fn(),
  },
}))

jest.mock('../../utils/profileQueryInvalidation', () => ({
  invalidateProfileQueries: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}))

describe('Profile Edit — Errors, Permissions & S7 Validation (D-284 / Wave 8)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      user: {
        id: 'u-123',
        displayName: 'أحمد العماني',
        phone: '+96891234567',
        bio: 'مطور واجهات ومحب للسيارات',
        email: 'ahmed@example.com',
        avatarUrl: null,
        avatar: null,
        governorateId: 1,
        wilayaId: 10,
        governorate: 'مسقط',
        city: 'السيب',
      } as any,
      isLoggedIn: true,
    })
  })

  describe('mapProfileBackendErrors (Pure Function)', () => {
    it('maps structured S7 fieldErrors for displayName, phone, bio and nonFieldErrors', () => {
      const backendResponse = {
        response: {
          data: {
            fieldErrors: [
              { field: 'displayName', message: 'الاسم المعروض يجب ألا يقل عن حرفين' },
              { field: 'phone', message: 'رقم الهاتف غير صالح' },
              { field: 'governorateId', message: 'المحافظة غير صالحة' },
            ],
          },
        },
      }

      const mapped = mapProfileBackendErrors(backendResponse)
      expect(mapped.fieldErrors.displayName).toBe('الاسم المعروض يجب ألا يقل عن حرفين')
      expect(mapped.fieldErrors.phone).toBe('رقم الهاتف غير صالح')
      expect(mapped.fieldErrors.bio).toBeUndefined()
      expect(mapped.nonFieldErrors).toContain('المحافظة غير صالحة')
    })

    it('maps class-validator string array message into field errors based on keyword matching', () => {
      const backendResponse = {
        response: {
          data: {
            message: [
              'الاسم المعروض لا يجب أن يحتوي على < أو >',
              'النبذة لا يجب أن تتجاوز 500 حرف',
              'رمز الدولة غير معروف',
            ],
          },
        },
      }

      const mapped = mapProfileBackendErrors(backendResponse)
      expect(mapped.fieldErrors.displayName).toBe('الاسم المعروض لا يجب أن يحتوي على < أو >')
      expect(mapped.fieldErrors.bio).toBe('النبذة لا يجب أن تتجاوز 500 حرف')
      expect(mapped.nonFieldErrors).toContain('رمز الدولة غير معروف')
    })
  })

  describe('useEditProfile — Permission Handling via requestPermission', () => {
    it('pickFromGallery requests permission via requestPermission and aborts on denial', async () => {
      const spyRequest = jest
        .spyOn(requestPermissionModule, 'requestPermission')
        .mockResolvedValueOnce({
          status: 'denied-can-ask-again',
          granted: false,
          canAskAgain: true,
        })

      const { result } = await renderHook(() => useEditProfile())

      await act(async () => {
        await result.current.pickFromGallery()
      })

      expect(spyRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'mediaLibrary',
        })
      )
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
    })

    it('pickFromCamera requests permission via requestPermission and launches camera on grant', async () => {
      const spyRequest = jest
        .spyOn(requestPermissionModule, 'requestPermission')
        .mockResolvedValueOnce({
          status: 'granted',
          granted: true,
          canAskAgain: true,
        })

      ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://camera_avatar.jpg' }],
      })

      const { result } = await renderHook(() => useEditProfile())

      await act(async () => {
        await result.current.pickFromCamera()
      })

      expect(spyRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'camera',
        })
      )
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled()
      expect(result.current.displayAvatar).toBe('file://camera_avatar.jpg')
    })
  })

  describe('useEditProfile — Location Picker Errors (F8)', () => {
    it('openGovernoratePicker displays formatted error alert if API fails', async () => {
      ;(locationsApi.getGovernorates as jest.Mock).mockRejectedValueOnce(
        new Error('Network offline')
      )

      const { result } = await renderHook(() => useEditProfile())

      await act(async () => {
        await result.current.openGovernoratePicker()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        expect.any(String)
      )
    })

    it('openWilayaPicker displays formatted error alert if API fails', async () => {
      ;(locationsApi.getWilayas as jest.Mock).mockRejectedValueOnce(
        new Error('Network offline')
      )

      const { result } = await renderHook(() => useEditProfile())

      await act(async () => {
        await result.current.openWilayaPicker()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        expect.any(String)
      )
    })
  })

  describe('useEditProfile — Error Clearing & S7 / 429 in handleSave', () => {
    it('clears field errors dynamically when user types in the input', async () => {
      const { result } = await renderHook(() => useEditProfile())

      // Manually trigger empty name validation error
      await act(async () => {
        result.current.setDisplayName('')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(result.current.errors.displayName).toBe('الاسم مطلوب')

      // Typing in displayName clears its error
      await act(async () => {
        result.current.setDisplayName('سالم')
      })

      expect(result.current.errors.displayName).toBeUndefined()
    })

    it('maps HTTP 400 S7 field errors into form error state during handleSave', async () => {
      ;(usersApi.updateProfile as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            fieldErrors: [
              { field: 'displayName', message: 'الاسم مستخدم بالفعل أو يحتوي على رموز ممنوعة' },
            ],
          },
        },
      })

      const { result } = await renderHook(() => useEditProfile())

      // Change name to create patch
      await act(async () => {
        result.current.setDisplayName('سالم الشكيلي')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(result.current.errors.displayName).toBe(
        'الاسم مستخدم بالفعل أو يحتوي على رموز ممنوعة'
      )
    })

    it('handles HTTP 429 rate limit errors with getPublishRateLimitErrorMessage', async () => {
      ;(usersApi.updateProfile as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
            window: 'DAILY',
            limit: 10,
          },
        },
      })

      const { result } = await renderHook(() => useEditProfile())

      await act(async () => {
        result.current.setDisplayName('سالم الجديد')
      })

      await act(async () => {
        await result.current.handleSave()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'محاولات كثيرة',
        expect.stringContaining('وصلت للحد اليومي')
      )
    })
  })
})
