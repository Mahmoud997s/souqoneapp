import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'
import { CarDetailScreen } from './CarDetailScreen'

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'car-search-101' }),
}))

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: any) => <View {...props} /> }
})

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: any) => <View {...props} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: any) => <View {...props} /> }
})

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'visitor-1' },
  }),
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

jest.mock('../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({ isFavorite: false, isBusy: false, toggle: jest.fn() }),
}))

jest.mock('../../hooks/listing-detail/useShareListing', () => ({
  useShareListing: () => ({ share: jest.fn() }),
}))

jest.mock('../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    call: jest.fn(),
    whatsApp: jest.fn(),
    chat: jest.fn(),
    busy: false,
  }),
}))

jest.mock('../../hooks/listing-detail/useOwnerActions', () => ({
  useOwnerActions: () => ({
    actions: [],
    run: jest.fn(),
    busy: false,
    viewCount: 10,
  }),
}))

jest.mock('../../hooks/listing-detail/useSimilarListings', () => ({
  useSimilarListings: () => ({
    items: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))

const sampleCarVm: CarDetailViewModel = {
  id: 'car-search-101',
  version: 1,
  title: 'تويوتا لاندكروزر 2024 VXR',
  make: 'تويوتا',
  model: 'لاندكروزر',
  price: {
    amount: 35000,
    formattedAmount: '35,000',
    currency: 'OMR',
    fullPriceLabel: '35,000 ر.ع',
    isNegotiable: false,
    listingType: 'SALE',
  },
  status: 'ACTIVE',
  description: 'سيارة بحالة الوكالة بدون حوادث صيانة شاملة',
  images: [{ id: 'img-1', url: 'https://example.com/car.jpg', order: 0, isPrimary: true }],
  location: {
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    fullLocationText: 'مسقط، السيب',
    hasCoordinates: false,
  },
  seller: {
    id: 'seller-land-1',
    name: 'معرض النخبة',
    username: 'elite_cars',
    isVerified: true,
    memberSinceLabel: 'عضو منذ 2021',
  },
  listingType: 'SALE',
  whatsappEnabled: true,
  postedAtLabel: 'منذ ساعتين',
  viewCount: 120,
  keySpecs: [],
  specsSections: [
    {
      title: 'المواصفات الفنية',
      items: [
        { key: 'year', label: 'سنة الصنع', value: '2024' },
        { key: 'transmission', label: 'ناقل الحركة', value: 'أوتوماتيك' },
        { key: 'fuel', label: 'نوع الوقود', value: 'بنزين' },
      ],
    },
    {
      title: 'الراحة والترفيه',
      items: [
        { key: 'sunroof', label: 'فتحة سقف بانوراما', value: '' },
        { key: 'audio', label: 'نظام صوتي فاخر', value: '' },
      ],
    },
  ],
  features: ['فتحة سقف بانوراما', 'نظام صوتي فاخر'],
}

const mockCarRefetch = jest.fn()
jest.mock('../../hooks/listing-detail/useCarDetail', () => ({
  useCarDetail: () => ({
    state: 'ready',
    vm: sampleCarVm,
    raw: null,
    refetch: mockCarRefetch,
    error: null,
  }),
}))

describe('CarDetailScreen in-page search filtering (D-093 Item 3)', () => {
  it('renders all specification and feature items when search query is empty', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    expect(screen.getByText('سنة الصنع')).toBeTruthy()
    expect(screen.getByText('ناقل الحركة')).toBeTruthy()
    expect(screen.getByText('نوع الوقود')).toBeTruthy()
    expect(screen.getByText('فتحة سقف بانوراما')).toBeTruthy()
    expect(screen.getByText('نظام صوتي فاخر')).toBeTruthy()
    expect(screen.queryByTestId('specs-no-match')).toBeNull()
  })

  it('filters specification rows when typing matching query into search input', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل السيارة...')
    await act(async () => {
      fireEvent.changeText(searchInput, 'بنزين')
    })

    // Matching item remains
    expect(screen.getByText('نوع الوقود')).toBeTruthy()
    expect(screen.getByText('بنزين')).toBeTruthy()

    // Non-matching items are filtered out
    expect(screen.queryByText('سنة الصنع')).toBeNull()
    expect(screen.queryByText('ناقل الحركة')).toBeNull()
    expect(screen.queryByText('فتحة سقف بانوراما')).toBeNull()
    expect(screen.queryByTestId('specs-no-match')).toBeNull()
  })

  it('filters feature chips by label substring', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل السيارة...')
    await act(async () => {
      fireEvent.changeText(searchInput, 'بانوراما')
    })

    expect(screen.getByText('فتحة سقف بانوراما')).toBeTruthy()
    expect(screen.queryByText('سنة الصنع')).toBeNull()
    expect(screen.queryByText('نظام صوتي فاخر')).toBeNull()
  })

  it('displays Arabic no-match message when no specifications match the search query', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل السيارة...')
    await act(async () => {
      fireEvent.changeText(searchInput, 'مصطلح غير موجود نهائيا')
    })

    expect(screen.getByTestId('specs-no-match')).toBeTruthy()
    expect(screen.getByText('لا توجد نتائج مطابقة')).toBeTruthy()
    expect(screen.queryByText('سنة الصنع')).toBeNull()
    expect(screen.queryByText('نوع الوقود')).toBeNull()
  })

  it('restores all specifications when search query is cleared', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل السيارة...')
    await act(async () => {
      fireEvent.changeText(searchInput, 'بنزين')
    })
    expect(screen.queryByText('سنة الصنع')).toBeNull()

    // Clear search
    await act(async () => {
      fireEvent.changeText(searchInput, '')
    })

    expect(screen.getByText('سنة الصنع')).toBeTruthy()
    expect(screen.getByText('ناقل الحركة')).toBeTruthy()
    expect(screen.getByText('نوع الوقود')).toBeTruthy()
    expect(screen.queryByTestId('specs-no-match')).toBeNull()
  })

  it('renders fixed top bar before scroll content and search input is reachable without scrolling (D-095)', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    const topBar = screen.getByTestId('detail-top-bar')
    const backBtn = screen.getByTestId('nav-back-button')
    const searchInput = screen.getByTestId('nav-search-input')

    expect(topBar).toBeTruthy()
    expect(backBtn).toBeTruthy()
    expect(searchInput).toBeTruthy()
    expect(searchInput.props.textAlign).toBe('right')
  })

  it('triggers refetch when pull-to-refresh is executed on scroll view', async () => {
    await render(<CarDetailScreen id="car-search-101" />)

    const scrollView = screen.getByTestId('car-detail-scroll-view')
    const refreshControl = scrollView.props.refreshControl
    expect(refreshControl).toBeDefined()
    expect(refreshControl?.props?.onRefresh).toBeDefined()

    await act(async () => {
      refreshControl.props.onRefresh()
    })

    expect(mockCarRefetch).toHaveBeenCalled()
  })
})
