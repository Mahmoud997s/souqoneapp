import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native'
import EditListingLoader from '../../app/post/edit/[id]'
import PartDetailScreen from '../../app/parts/[id]'
import { partsApi } from '../api/parts'
import { useAuthStore } from '../store/authStore'
import { usePartWizardStore } from '../store/partWizardStore'
import { validateStep } from '../hooks/usePartValidation'
import { usePart } from '../hooks/useParts'
import { usePartDetail } from '../screens/parts/hooks/usePartDetail'
import { mapPartDetailViewModel } from '../screens/parts/mappers/partDetailViewModel'
import { useLocalSearchParams } from 'expo-router'

jest.mock('../../src/hooks/useParts')
jest.mock('../../src/screens/parts/hooks/usePartDetail')
jest.mock('../../src/hooks/listing-detail/usePartDetail')
jest.mock('../../src/screens/parts/hooks/partQueryKeys', () => ({
  partQueryKeys: {
    detail: jest.fn((id: string, auth: boolean) => ['parts-detail', id, auth ? 'auth' : 'guest']),
  },
  invalidatePartListingQueries: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
      removeQueries: jest.fn(),
    }),
  }
})

jest.mock('../../src/features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))

jest.mock('../../src/hooks/listing-detail/useSimilarListings', () => ({
  useVerticalSimilarListings: () => ({
    items: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))
jest.mock('../../src/hooks/listing-detail/useSellerReviewSummary', () => ({
  useSellerReviewSummary: () => ({
    averageRating: null,
    reviewCount: 0,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('../../src/hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    call: jest.fn(),
    whatsApp: jest.fn(),
    chat: jest.fn(),
    busy: false,
  }),
}))

jest.mock('../../src/utils/assertOwnerHasPhoneForEdit', () => ({
  assertOwnerHasPhoneForEdit: jest.fn().mockResolvedValue(true),
}))

jest.mock('../../src/hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

jest.mock('../../src/api/parts', () => ({
  partsApi: {
    getById: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../../src/api/listings', () => ({
  listingsApi: { getById: jest.fn() },
}))
jest.mock('../../src/api/buses', () => ({
  busesApi: { getById: jest.fn() },
}))
jest.mock('../../src/api/equipment', () => ({
  equipmentApi: { getById: jest.fn() },
}))
jest.mock('../../src/api/services', () => ({
  servicesApi: { getById: jest.fn() },
}))
jest.mock('../../src/api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}))
jest.mock('../../src/api/chat', () => ({
  chatApi: { createRoom: jest.fn() },
}))

jest.mock('expo-image', () => {
  const ReactActual = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) => ReactActual.createElement(View, props),
  }
})

jest.mock('expo-router', () => {
  const sharedRouter = {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
  }
  return {
    useLocalSearchParams: jest.fn(),
    router: sharedRouter,
    useRouter: () => sharedRouter,
  }
})

jest.mock('../../src/store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn(),
    alert: jest.fn(),
  },
}))

function makePartPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'part-500',
    title: 'سفايف كامري أصلية',
    description: 'سفايف أمامية بحالة ممتازة',
    partCategory: 'BRAKES',
    condition: 'NEW',
    isOriginal: true,
    partNumber: '04465-33470',
    compatibleMakes: ['toyota'],
    compatibleModels: ['Camry'],
    yearFrom: 2018,
    yearTo: 2022,
    price: 45,
    currency: 'OMR',
    isPriceNegotiable: false,
    whatsappEnabled: true,
    contactPhone: '91234567',
    governorateId: 1,
    wilayaId: 10,
    governorateRef: { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
    wilayaRef: { id: 10, nameAr: 'السيب', nameEn: 'Seeb' },
    sellerId: 'user-seller-99',
    seller: {
      id: 'user-seller-99',
      username: 'ahmed_parts',
      displayName: 'أحمد لقطع الغيار',
      phone: '91234567',
    },
    images: [{ id: 'img-1', url: 'https://cdn.example.com/p1.jpg' }],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('P1-06 Spare Parts Edit Mode listingType Prefill', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePartWizardStore.getState().reset()
    useAuthStore.setState({
      user: {
        id: 'user-seller-99',
        email: 'seller@example.com',
        phone: '91234567',
      } as ReturnType<typeof useAuthStore.getState>['user'],
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('setEditMode defaults listingType to SPARE_PART_SALE when omitted and preserves SPARE_PART_WANTED when provided', () => {
    usePartWizardStore.getState().setEditMode('part-fallback', {
      title: 'بطارية سيارة',
      partCategory: 'BATTERIES',
      condition: 'NEW',
      isOriginal: true,
    })

    const defaulted = usePartWizardStore.getState().formData
    expect(defaulted.listingType).toBe('SPARE_PART_SALE')
    const step1Default = validateStep(1, defaulted)
    expect(step1Default.errors.listingType).toBeUndefined()
    expect(step1Default.isValid).toBe(true)

    usePartWizardStore.getState().reset()
    usePartWizardStore.getState().setEditMode('part-wanted', {
      listingType: 'SPARE_PART_WANTED',
      title: 'مطلوب كمبروسر مكيف',
      partCategory: 'ENGINE',
      condition: 'USED',
      isOriginal: false,
    })

    const wanted = usePartWizardStore.getState().formData
    expect(wanted.listingType).toBe('SPARE_PART_WANTED')
    const step1Wanted = validateStep(1, wanted)
    expect(step1Wanted.errors.listingType).toBeUndefined()
    expect(step1Wanted.isValid).toBe(true)
  })

  it('EditListingLoader preserves SPARE_PART_WANTED and falls back to SPARE_PART_SALE for parts', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-wanted-1',
      type: 'parts',
    })
    ;(partsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: makePartPayload({
        id: 'part-wanted-1',
        listingType: 'SPARE_PART_WANTED',
      }),
    })

    await render(React.createElement(EditListingLoader))

    await waitFor(() => {
      const formData = usePartWizardStore.getState().formData
      expect(formData.editMode).toBe(true)
      expect(formData.listingType).toBe('SPARE_PART_WANTED')
      const step1 = validateStep(1, formData)
      expect(step1.errors.listingType).toBeUndefined()
      expect(step1.isValid).toBe(true)
    })

    await cleanup()
    usePartWizardStore.getState().reset()
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-sale-2',
      type: 'parts',
    })
    ;(partsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: makePartPayload({
        id: 'part-sale-2',
        listingType: undefined,
      }),
    })

    await render(React.createElement(EditListingLoader))

    await waitFor(() => {
      const formData = usePartWizardStore.getState().formData
      expect(formData.editMode).toBe(true)
      expect(formData.listingType).toBe('SPARE_PART_SALE')
      const step1 = validateStep(1, formData)
      expect(step1.errors.listingType).toBeUndefined()
      expect(step1.isValid).toBe(true)
    })
  })

  it('PartDetailScreen passes listingType into setEditMode when owner taps edit for WANTED and omitted values', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'part-detail-1' })

    const wantedPart = makePartPayload({
      id: 'part-detail-1',
      listingType: 'SPARE_PART_WANTED',
    })
    ;(usePart as jest.Mock).mockReturnValue({
      data: wantedPart,
      isLoading: false,
      isError: false,
    })
    ;(usePartDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: mapPartDetailViewModel(wantedPart as never),
      raw: wantedPart,
      refetch: jest.fn(),
      error: null,
    })

    await render(React.createElement(PartDetailScreen))
    await fireEvent.press(screen.getByText('تعديل'))

    const wantedState = usePartWizardStore.getState().formData
    expect(wantedState.editMode).toBe(true)
    expect(wantedState.listingType).toBe('SPARE_PART_WANTED')
    expect(validateStep(1, wantedState).errors.listingType).toBeUndefined()

    await cleanup()
    usePartWizardStore.getState().reset()

    const defaultPart = makePartPayload({
      id: 'part-detail-2',
      listingType: undefined,
    })
    ;(usePart as jest.Mock).mockReturnValue({
      data: defaultPart,
      isLoading: false,
      isError: false,
    })
    ;(usePartDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: mapPartDetailViewModel(defaultPart as never),
      raw: defaultPart,
      refetch: jest.fn(),
      error: null,
    })

    await render(React.createElement(PartDetailScreen))
    await fireEvent.press(screen.getByText('تعديل'))

    const defaultState = usePartWizardStore.getState().formData
    expect(defaultState.editMode).toBe(true)
    expect(defaultState.listingType).toBe('SPARE_PART_SALE')
    expect(validateStep(1, defaultState).errors.listingType).toBeUndefined()
  })
})
