import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AxiosError } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import NewCarListingScreen from '../../../app/cars/new'
import { listingsApi } from '../../api/listings'
import { carsApi } from '../../api/cars'
import { router } from 'expo-router'
import { useCarWizardStore } from '../../store/carWizardStore'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import * as listingKeysModule from '../../utils/listing-detail/queryKeys'

jest.setTimeout(30000)

jest.mock('../../api/listings')
jest.mock('../../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn().mockResolvedValue({ data: { url: 'https://cdn.souqone.om/car1.jpg' } }),
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
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
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

jest.mock('../../hooks/useProfilePhoneGuard', () => ({
  useProfilePhoneGuard: () => ({
    hasPhone: true,
    checking: false,
    checkPhone: jest.fn().mockResolvedValue(true),
  }),
}))

describe('Cars Publish Flow (K7, S5 & 429 error handling)', () => {
  let queryClient: QueryClient
  let invalidateSpy: jest.SpyInstance

  const validCarData = {
    listingType: 'SALE' as const,
    title: 'سيارة تويوتا كامري 2022 بحالة ممتازة',
    description: 'سيارة نظيفة جداً استخدام شخصي بدون حوادث',
    brandId: 'toyota',
    carModelId: 'camry',
    year: '2022',
    condition: 'USED' as const,
    mileage: '45000',
    fuelType: 'PETROL',
    bodyType: 'SEDAN',
    driveType: 'FWD',
    transmission: 'AUTOMATIC',
    exteriorColor: 'WHITE',
    governorateId: 1,
    wilayaId: 10,
    price: '8500',
    images: ['https://cdn.souqone.om/car1.jpg'] as any,
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
      .spyOn(listingKeysModule, 'invalidateCarListingQueries')
      .mockResolvedValue(undefined)

    useAuthStore.setState({
      user: { id: 'u1', phone: '+96891234567' } as any,
    })

    useCarWizardStore.getState().resetForm()
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
        <NewCarListingScreen />
      </QueryClientProvider>
    )
  }

  it('invalidates car listing queries and shows PublishSuccessView on success', async () => {
    ;(listingsApi.create as jest.Mock).mockResolvedValueOnce({
      data: { id: 'car-new-999' },
    })

    useCarWizardStore.setState({
      currentStep: 5,
      formData: {
        ...useCarWizardStore.getState().formData,
        ...validCarData,
      },
    })

    await renderScreen()

    const submitBtn = await screen.findByTestId('car-wizard-submit-btn')
    expect(submitBtn).toBeTruthy()

    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(expect.any(QueryClient), 'car-new-999')
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })
    expect(screen.getByText('تم نشر إعلانك بنجاح!')).toBeTruthy()
  })

  it('handles 429 rate limit error using getPublishRateLimitErrorMessage', async () => {
    ;(listingsApi.create as jest.Mock).mockRejectedValueOnce(
      new AxiosError('Rate limit', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 429,
        data: { code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED' },
      } as any)
    )

    useCarWizardStore.setState({
      currentStep: 5,
      formData: {
        ...useCarWizardStore.getState().formData,
        ...validCarData,
      },
    })

    await renderScreen()

    const submitBtn = await screen.findByTestId('car-wizard-submit-btn')
    expect(submitBtn).toBeTruthy()

    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'وصلت للحد اليومي للنشر، جرّب غداً.'
      )
    })
  })
})
