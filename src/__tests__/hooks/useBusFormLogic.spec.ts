import { renderHook, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import { useBusFormLogic } from '../../hooks/useBusFormLogic'
import { useBusWizardStore, BusWizardData } from '../../store/busWizardStore'
import { dialogService } from '../../store/dialogStore'
import * as requestPermissionModule from '../../utils/requestPermission'

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

const sampleBusData: BusWizardData = {
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  make: 'Toyota',
  model: 'Coaster',
  manufacturerId: null,
  modelId: null,
  year: '2022',
  capacity: '30',
  condition: 'EXCELLENT',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '50000',
  plateNumber: '1234',
  features: [],
  price: '15000',
  currency: 'OMR',
  isPriceNegotiable: false,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: '',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: 'حافلة كوستر للبيع',
  description: 'حالة ممتازة بحالة الوكالة',
  governorateId: 1,
  wilayaId: 10,
  governorateNameAr: 'مسقط',
  wilayaNameAr: 'السيب',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  whatsappEnabled: true,
}

describe('useBusFormLogic — S4 Permissions, Error Formatting & Image Removal (D-284 / Wave 8)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useBusWizardStore.setState({
      data: {
        ...sampleBusData,
        images: [],
        existingImages: [],
        removedImageIds: [],
      },
    })
  })

  describe('S4 Image Picker Permission Handling', () => {
    it('requests media permission via requestPermission and stops if denied', async () => {
      const spyRequest = jest
        .spyOn(requestPermissionModule, 'requestPermission')
        .mockResolvedValueOnce({
          status: 'denied-can-ask-again',
          granted: false,
          canAskAgain: true,
        })

      const onUpdateField = jest.fn()
      const { result } = await renderHook(() =>
        useBusFormLogic(sampleBusData, onUpdateField)
      )

      await act(async () => {
        await result.current.handlePickImages()
      })

      expect(spyRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'mediaLibrary',
        })
      )
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
    })

    it('launches image library when requestPermission is granted', async () => {
      jest.spyOn(requestPermissionModule, 'requestPermission').mockResolvedValueOnce({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      })

      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://bus_photo1.jpg' }],
      })

      const onUpdateField = jest.fn()
      const { result } = await renderHook(() =>
        useBusFormLogic(sampleBusData, onUpdateField)
      )

      await act(async () => {
        await result.current.handlePickImages()
      })

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled()
      expect(onUpdateField).toHaveBeenCalledWith('images', ['file://bus_photo1.jpg'])
    })

    it('formats catch error via getMutationErrorMessage when image picker throws', async () => {
      jest.spyOn(requestPermissionModule, 'requestPermission').mockResolvedValueOnce({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      })

      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Device out of memory')
      )

      const onUpdateField = jest.fn()
      const { result } = await renderHook(() =>
        useBusFormLogic(sampleBusData, onUpdateField)
      )

      await act(async () => {
        await result.current.handlePickImages()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        expect.any(String)
      )
    })
  })

  describe('Race Condition Fix in handleRemoveExistingImage', () => {
    it('reads latest removedImageIds from useBusWizardStore instead of stale closure', async () => {
      const initialData: BusWizardData = {
        ...sampleBusData,
        existingImages: [
          { id: 'img-1', url: 'https://example.com/1.jpg' },
          { id: 'img-2', url: 'https://example.com/2.jpg' },
        ],
        removedImageIds: [],
      }

      useBusWizardStore.setState({ data: initialData })

      const onUpdateField = jest.fn((field, value) => {
        useBusWizardStore.setState((prev) => ({
          data: { ...prev.data, [field]: value },
        }))
      })

      // The hook is rendered with the initialData closure
      const { result } = await renderHook(() => useBusFormLogic(initialData, onUpdateField))

      // First removal: remove img-1
      act(() => {
        result.current.handleRemoveExistingImage('img-1')
      })

      expect(useBusWizardStore.getState().data.removedImageIds).toEqual(['img-1'])

      // Second removal: remove img-2 using the same hook instance
      act(() => {
        result.current.handleRemoveExistingImage('img-2')
      })

      // Both IDs must be recorded in removedImageIds without img-1 being overwritten!
      expect(useBusWizardStore.getState().data.removedImageIds).toEqual(['img-1', 'img-2'])
    })
  })
})
