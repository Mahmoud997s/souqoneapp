import { renderHook, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import {
  useEquipmentFormLogic,
  equipmentMediaAdapter,
} from '../../hooks/useEquipmentFormLogic'
import { dialogService } from '../../store/dialogStore'
import * as requestPermissionModule from '../../utils/requestPermission'

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('Equipment Form Logic Permissions & Unified Errors (D-283 / S4)', () => {
  const onUpdateImagesMock = jest.fn()
  const onClearFieldErrorMock = jest.fn()
  const onUpdateFeaturesMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('equipmentMediaAdapter configuration', () => {
    it('has correct kind, title, and Arabic messages for equipment', () => {
      expect(equipmentMediaAdapter.kind).toBe('equipmentMediaLibrary')
      expect(equipmentMediaAdapter.titleAr).toBe('إذن الوصول مطلوب')
      expect(equipmentMediaAdapter.deniedMessageAr).toBe(
        'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور المعدة'
      )
      expect(equipmentMediaAdapter.blockedMessageAr).toBe(
        'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور المعدة'
      )
    })

    it('delegates request call to ImagePicker.requestMediaLibraryPermissionsAsync', async () => {
      ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
        status: 'granted',
      })

      const res = await equipmentMediaAdapter.request()
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(res.granted).toBe(true)
    })
  })

  describe('handlePickImages with requestPermission and getMutationErrorMessage', () => {
    it('does not launch image library when requestPermission is denied', async () => {
      const requestPermissionSpy = jest
        .spyOn(requestPermissionModule, 'requestPermission')
        .mockResolvedValueOnce({
          status: 'denied-can-ask-again',
          granted: false,
          canAskAgain: true,
        })

      const { result } = await renderHook(() =>
        useEquipmentFormLogic({
          images: [],
          existingImages: [],
          features: [],
          onUpdateImages: onUpdateImagesMock,
          onUpdateFeatures: onUpdateFeaturesMock,
          onClearFieldError: onClearFieldErrorMock,
        })
      )

      await act(async () => {
        await result.current.handlePickImages()
      })

      expect(requestPermissionSpy).toHaveBeenCalledWith(equipmentMediaAdapter)
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
      expect(onUpdateImagesMock).not.toHaveBeenCalled()
      expect(result.current.isUploading).toBe(false)
    })

    it('launches image library and updates images when permission is granted', async () => {
      jest
        .spyOn(requestPermissionModule, 'requestPermission')
        .mockResolvedValueOnce({
          status: 'granted',
          granted: true,
          canAskAgain: true,
        })

      const pickedAssets = [{ uri: 'file://picked-1.jpg', width: 800, height: 600 }]
      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: pickedAssets,
      })

      const initialImages = [{ uri: 'file://initial-1.jpg' }]

      const { result } = await renderHook(() =>
        useEquipmentFormLogic({
          images: initialImages,
          existingImages: [],
          features: [],
          onUpdateImages: onUpdateImagesMock,
          onUpdateFeatures: onUpdateFeaturesMock,
          onClearFieldError: onClearFieldErrorMock,
        })
      )

      await act(async () => {
        await result.current.handlePickImages()
      })

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 9, // 10 - 1 initial
      })
      expect(onUpdateImagesMock).toHaveBeenCalledWith([...initialImages, ...pickedAssets])
      expect(onClearFieldErrorMock).toHaveBeenCalledWith('images')
      expect(result.current.isUploading).toBe(false)
    })

    it('catches image library error and displays formatted message via getMutationErrorMessage', async () => {
      jest
        .spyOn(requestPermissionModule, 'requestPermission')
        .mockResolvedValueOnce({
          status: 'granted',
          granted: true,
          canAskAgain: true,
        })

      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to open photo picker')
      )

      const { result } = await renderHook(() =>
        useEquipmentFormLogic({
          images: [],
          existingImages: [],
          features: [],
          onUpdateImages: onUpdateImagesMock,
          onUpdateFeatures: onUpdateFeaturesMock,
          onClearFieldError: onClearFieldErrorMock,
        })
      )

      await act(async () => {
        await result.current.handlePickImages()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تعذر اختيار الصور، يرجى المحاولة مجدداً'
      )
      expect(result.current.isUploading).toBe(false)
    })
  })
})
