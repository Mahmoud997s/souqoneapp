import React from 'react'
import { BackHandler } from 'react-native'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AxiosError, AxiosHeaders } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewEquipmentListingScreen from '../../../app/equipment/new'
import { equipmentApi } from '../../api/equipment'
import { router } from 'expo-router'
import { useEquipmentWizardStore } from '../../store/equipmentWizardStore'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import * as equipmentQueryKeysModule from '../../utils/listing-detail/equipmentQueryKeys'
import { getPublishRateLimitErrorMessage } from '../../utils/publishRateLimitError'

jest.mock('../../api/equipment')

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
  },
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: () => null,
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('Equipment Publish Success, 429 Rate Limit, and Mutation Errors (D-268 / R2-3)', () => {
  let queryClient: QueryClient
  let invalidateSpy: jest.SpyInstance

  function buildValidFormData(overrides: Record<string, any> = {}) {
    return {
      listingType: 'EQUIPMENT_SALE' as const,
      equipmentType: 'EXCAVATOR',
      title: 'حفار كاتربيلر 320 بحالة ممتازة',
      description: 'حفار كاتربيلر نظيف جدا ساعات عمل قليلة جاهز للعمل مباشرة',
      make: 'Caterpillar',
      model: '320D',
      year: '2020',
      condition: 'USED',
      capacity: '',
      power: '',
      weight: '',
      hoursUsed: '',
      features: [],
      price: '28000',
      dailyPrice: '',
      monthlyPrice: '',
      isPriceNegotiable: false,
      withOperator: false,
      deliveryAvailable: false,
      budgetMin: '',
      budgetMax: '',
      rentalDuration: '',
      quantity: '1',
      siteDetails: '',
      governorateId: 1,
      wilayaId: 10,
      governorate: 'مسقط',
      city: 'السيب',
      latitude: null,
      longitude: null,
      whatsappEnabled: false,
      existingImages: [{ id: 'img-1', url: 'https://cdn.example.com/eq1.jpg' }],
      images: [],
      removedImageIds: [],
      editMode: false,
      editListingId: undefined,
      ...overrides,
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    invalidateSpy = jest
      .spyOn(equipmentQueryKeysModule, 'invalidateEquipmentListingQueries')
      .mockResolvedValue(undefined)

    useAuthStore.setState({
      user: { id: 'u-equip-1', phone: '+96891234567' } as any,
    })

    // Confirm dialog invokes the confirmation callback in create mode
    ;(dialogService.confirm as jest.Mock).mockImplementation(
      (_title: string, _msg: string, onConfirm?: () => void) => {
        if (onConfirm) onConfirm()
      }
    )
  })

  afterEach(async () => {
    invalidateSpy.mockRestore()
    await cleanup()
    queryClient?.clear()
    await AsyncStorage.clear()
  })

  async function renderScreenAtStep5(formOverrides: Record<string, any> = {}) {
    const formData = buildValidFormData(formOverrides)
    const statePayload = {
      currentStep: 5,
      formData,
      errors: {},
    }
    await AsyncStorage.setItem(
      'souqone_equipment_wizard_draft',
      JSON.stringify({ state: { formData, currentStep: 5 }, version: 0 })
    )
    useEquipmentWizardStore.setState(statePayload)

    return await render(
      <QueryClientProvider client={queryClient}>
        <NewEquipmentListingScreen />
      </QueryClientProvider>
    )
  }

  it('1. create success renders PublishSuccessView, invalidates queries, resets draft, and handles all 3 actions', async () => {
    ;(equipmentApi.create as jest.Mock).mockResolvedValueOnce({
      data: { id: 'eq-created-123' },
    })

    await renderScreenAtStep5()

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
      expect(screen.getByText('تم نشر معدتك بنجاح!')).toBeTruthy()
    })

    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith(expect.any(QueryClient), 'eq-created-123')
    expect(useEquipmentWizardStore.getState().formData.title).toBe('')

    // Primary action: عرض المعدة -> /equipment/eq-created-123
    await fireEvent.press(screen.getByTestId('publish-success-primary-btn'))
    expect(screen.getByText('عرض المعدة')).toBeTruthy()
    expect(router.replace).toHaveBeenCalledWith('/equipment/eq-created-123')

    // Tertiary action: العودة للرئيسية -> /
    await fireEvent.press(screen.getByTestId('publish-success-tertiary-btn'))
    expect(screen.getByText('العودة للرئيسية')).toBeTruthy()
    expect(router.replace).toHaveBeenCalledWith('/')

    // Secondary action: إضافة معدة أخرى -> resets to wizard form
    expect(screen.getByText('إضافة معدة أخرى')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('publish-success-secondary-btn'))

    await waitFor(() => {
      expect(screen.queryByTestId('publish-success-view')).toBeNull()
    })
    expect(useEquipmentWizardStore.getState().currentStep).toBe(1)
  })

  it('2. edit success renders PublishSuccessView with edit title, invalidates queries, and secondary goes to /equipment', async () => {
    ;(equipmentApi.update as jest.Mock).mockResolvedValueOnce({ data: { id: 'eq-edit-789' } })
    ;(equipmentApi.removeImage as jest.Mock).mockResolvedValue({})

    await renderScreenAtStep5({
      editMode: true,
      editListingId: 'eq-edit-789',
      removedImageIds: ['old-img-1', 'old-img-2'],
    })

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
      expect(screen.getByText('تم حفظ تعديلات المعدة بنجاح!')).toBeTruthy()
    })

    expect(equipmentApi.removeImage).toHaveBeenCalledTimes(2)
    expect(equipmentApi.removeImage).toHaveBeenCalledWith('old-img-1')
    expect(equipmentApi.removeImage).toHaveBeenCalledWith('old-img-2')
    expect(invalidateSpy).toHaveBeenCalledWith(expect.any(QueryClient), 'eq-edit-789')
    expect(dialogService.alert).not.toHaveBeenCalled()

    // Primary -> /equipment/eq-edit-789
    await fireEvent.press(screen.getByTestId('publish-success-primary-btn'))
    expect(router.replace).toHaveBeenCalledWith('/equipment/eq-edit-789')

    // Secondary -> الرجوع للمعدات (/equipment)
    expect(screen.getByText('الرجوع للمعدات')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('publish-success-secondary-btn'))
    expect(router.replace).toHaveBeenCalledWith('/equipment')
  })

  it('3. handles structured 429 daily and monthly rate-limit responses via getPublishRateLimitErrorMessage', async () => {
    const dailyErr = {
      response: {
        status: 429,
        data: {
          code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
          limit: 3,
          resetsAt: '2026-11-11T22:00:00.000Z',
        },
      },
    }
    ;(equipmentApi.create as jest.Mock).mockRejectedValueOnce(dailyErr)

    await renderScreenAtStep5()
    const dailySubmitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(dailySubmitBtn)

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        getPublishRateLimitErrorMessage(dailyErr)
      )
    })

    jest.clearAllMocks()
    await cleanup()

    const monthlyErr = {
      response: {
        status: 429,
        data: {
          code: 'PUBLISH_RATE_LIMIT_MONTHLY_REACHED',
          limit: 10,
          resetsAt: '2026-12-01T00:00:00.000Z',
        },
      },
    }
    ;(equipmentApi.update as jest.Mock).mockRejectedValueOnce(monthlyErr)

    await renderScreenAtStep5({
      editMode: true,
      editListingId: 'eq-edit-789',
    })
    const monthlySubmitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(monthlySubmitBtn)

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        getPublishRateLimitErrorMessage(monthlyErr)
      )
    })
  })

  it('4. handles 409 conflict and ERR_NETWORK offline errors via getMutationErrorMessage', async () => {
    const conflictErr = new AxiosError(
      'Conflict',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: {},
      }
    )
    ;(equipmentApi.update as jest.Mock).mockRejectedValueOnce(conflictErr)

    await renderScreenAtStep5({
      editMode: true,
      editListingId: 'eq-edit-789',
    })
    const conflictSubmitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(conflictSubmitBtn)

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تم تعديل البيانات من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
      )
    })

    jest.clearAllMocks()
    await cleanup()

    const offlineErr = new AxiosError('Network Error', 'ERR_NETWORK')
    ;(equipmentApi.create as jest.Mock).mockRejectedValueOnce(offlineErr)

    await renderScreenAtStep5()
    const offlineSubmitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(offlineSubmitBtn)

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.'
      )
    })
  })

  it('5. intercepts Android hardware BackHandler press on PublishSuccessView and navigates to /equipment', async () => {
    const capturedListeners: Array<() => boolean> = []
    const removeMock = jest.fn()
    const addListenerSpy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((eventName, handler) => {
        if (eventName === 'hardwareBackPress') {
          capturedListeners.push(handler as () => boolean)
        }
        return { remove: removeMock } as any
      })

    ;(equipmentApi.create as jest.Mock).mockResolvedValueOnce({
      data: { id: 'eq-created-hw' },
    })

    await renderScreenAtStep5()
    const hwSubmitBtn = await screen.findByTestId('wizard-submit-btn')
    await fireEvent.press(hwSubmitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
      expect(capturedListeners.length).toBeGreaterThan(0)
    })

    const handler = capturedListeners[capturedListeners.length - 1]
    let handled = false
    await act(async () => {
      handled = handler()
    })
    expect(handled).toBe(true)
    expect(router.replace).toHaveBeenCalledWith('/equipment')
    expect(useEquipmentWizardStore.getState().formData.title).toBe('')

    addListenerSpy.mockRestore()
  })
})
