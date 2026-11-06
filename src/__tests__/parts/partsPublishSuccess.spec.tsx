import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NewPartListingScreen from '../../../app/parts/new'
import { partsApi } from '../../api/parts'
import { carsApi } from '../../api/cars'
import { router } from 'expo-router'
import { usePartWizardStore, defaultPartFormData } from '../../store/partWizardStore'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import * as partQueryKeysModule from '../../screens/parts/hooks/partQueryKeys'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('../../api/parts')
jest.mock('../../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    addPartImage: jest.fn().mockResolvedValue({}),
    removePartImage: jest.fn().mockResolvedValue({}),
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

describe('Parts Publish Success and Rate Limiting Flow (D-238)', () => {
  let queryClient: QueryClient
  let invalidateSpy: jest.SpyInstance

  const baseValidFormData = {
    ...defaultPartFormData,
    listingType: 'SPARE_PART_SALE' as const,
    partCategory: 'ENGINE' as const,
    condition: 'USED' as const,
    isOriginal: true,
    title: 'محرك لاندكروزر V8 أصلي',
    description: 'محرك أصلي بحالة ممتازة ومفحوص بالكامل مع ضمان 6 أشهر',
    partNumber: '1GR-FE',
    price: 850,
    governorateId: 1,
    wilayaId: 10,
    governorateNameAr: 'مسقط',
    wilayaNameAr: 'السيب',
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
      .spyOn(partQueryKeysModule, 'invalidatePartListingQueries')
      .mockResolvedValue(undefined)

    useAuthStore.setState({
      user: { id: 'u1', phone: '+96891234567' } as any,
    })
  })

  afterEach(async () => {
    invalidateSpy.mockRestore()
    cleanup()
    await new Promise((r) => setTimeout(r, 100))
    await AsyncStorage.clear()
  })

  async function renderScreen() {
    return render(
      <QueryClientProvider client={queryClient}>
        <NewPartListingScreen />
      </QueryClientProvider>
    )
  }

  it('1. create success renders PublishSuccessView, invalidates queries, and navigates to part detail on primary action', async () => {
    ;(partsApi.create as jest.Mock).mockResolvedValueOnce({
      id: 'part-created-123',
    })

    const statePayload = {
      currentStep: 6,
      formData: { ...baseValidFormData },
    }
    await AsyncStorage.setItem(
      'part-wizard-draft',
      JSON.stringify({ state: statePayload, version: 0 })
    )
    usePartWizardStore.setState(statePayload)

    await renderScreen()

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    expect(submitBtn).toBeTruthy()

    await act(async () => {
      fireEvent.press(submitBtn)
    })

    // 1. Success view must be displayed
    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })
    expect(screen.getByText('تم نشر إعلانك بنجاح!')).toBeTruthy()

    // 2. Query cache invalidation must be called with the new partId
    expect(invalidateSpy).toHaveBeenCalledWith(expect.any(QueryClient), 'part-created-123')

    // 3. Pressing primary action ("عرض إعلانك") replaces route and resets store
    const primaryBtn = await screen.findByTestId('publish-success-primary-btn')
    expect(primaryBtn).toBeTruthy()

    await act(async () => {
      fireEvent.press(primaryBtn)
    })

    expect(router.replace).toHaveBeenCalledWith('/parts/part-created-123')
    expect(usePartWizardStore.getState().formData.title).toBe('')
    expect(usePartWizardStore.getState().currentStep).toBe(1)
  })

  it('2. create success: pressing secondary action ("إضافة إعلان آخر") resets store and stays in wizard at step 1', async () => {
    ;(partsApi.create as jest.Mock).mockResolvedValueOnce({
      id: 'part-created-456',
    })

    const statePayload = {
      currentStep: 6,
      formData: {
        ...baseValidFormData,
        partCategory: 'BRAKES' as const,
        title: 'سفايف فرامل هايلوكس أصلية',
        description: 'سفايف أمامية وخلفية جديدة بالكرتون أصلي وكالة تويوتا',
        price: 45,
      },
    }
    await AsyncStorage.setItem(
      'part-wizard-draft',
      JSON.stringify({ state: statePayload, version: 0 })
    )
    usePartWizardStore.setState(statePayload)

    await renderScreen()

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    // Press secondary action
    const secondaryBtn = screen.getByTestId('publish-success-secondary-btn')
    expect(screen.getByText('إضافة إعلان آخر')).toBeTruthy()

    await act(async () => {
      fireEvent.press(secondaryBtn)
    })

    // Success view dismissed, wizard back to step 1 with empty store
    await waitFor(() => {
      expect(screen.queryByTestId('publish-success-view')).toBeNull()
    })
    expect(usePartWizardStore.getState().currentStep).toBe(1)
    expect(usePartWizardStore.getState().formData.title).toBe('')
  })

  it('3. edit success renders PublishSuccessView with edit title and secondary action calls router.back()', async () => {
    ;(partsApi.update as jest.Mock).mockResolvedValueOnce({
      id: 'part-edit-789',
    })

    const statePayload = {
      currentStep: 6,
      formData: {
        ...baseValidFormData,
        editMode: true,
        editListingId: 'part-edit-789',
        partCategory: 'OTHER' as const,
        title: 'جير أوتوماتيك كامري مستورد',
        description: 'جير مستورد نظيف جداً ومفحوص بالكامل مع تركيب وضمان',
        price: 320,
      },
    }
    await AsyncStorage.setItem(
      'part-wizard-draft',
      JSON.stringify({ state: statePayload, version: 0 })
    )
    usePartWizardStore.setState(statePayload)

    await renderScreen()

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('تم حفظ التعديلات بنجاح!')).toBeTruthy()
    expect(invalidateSpy).toHaveBeenCalledWith(expect.any(QueryClient), 'part-edit-789')

    const secondaryBtn = screen.getByTestId('publish-success-secondary-btn')
    expect(screen.getByText('الرجوع')).toBeTruthy()

    await act(async () => {
      fireEvent.press(secondaryBtn)
    })

    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it('4. 429 with structured backend body shows informative Arabic message with daily/monthly limit and resetsAt', async () => {
    const error429 = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          code: 'DAILY_LIMIT_EXCEEDED',
          window: 'day',
          vertical: 'parts',
          limit: 3,
          resetsAt: '2026-11-07T00:00:00.000Z',
        },
      },
    }
    ;(partsApi.create as jest.Mock).mockRejectedValueOnce(error429)

    const statePayload = {
      currentStep: 6,
      formData: { ...baseValidFormData },
    }
    await AsyncStorage.setItem(
      'part-wizard-draft',
      JSON.stringify({ state: statePayload, version: 0 })
    )
    usePartWizardStore.setState(statePayload)

    await renderScreen()

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        expect.stringContaining('لقد وصلت للحد اليومي لنشر الإعلانات (3 إعلانات في اليوم)')
      )
    })
  })

  it('5. 429 without structured body falls back to legacy Arabic retry message', async () => {
    const legacyError429 = {
      response: {
        status: 429,
      },
    }
    ;(partsApi.create as jest.Mock).mockRejectedValueOnce(legacyError429)

    const statePayload = {
      currentStep: 6,
      formData: { ...baseValidFormData },
    }
    await AsyncStorage.setItem(
      'part-wizard-draft',
      JSON.stringify({ state: statePayload, version: 0 })
    )
    usePartWizardStore.setState(statePayload)

    await renderScreen()

    const submitBtn = await screen.findByTestId('wizard-submit-btn')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
      )
    })
  })
})
