import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { ServiceDetailScreen } from '../ServiceDetailScreen'
import type { ServiceDetailViewModel } from '../../../types/serviceDetailViewModel.types'
import { dialogService } from '../../../store/dialogStore'
import { servicesApi } from '../../../api/services'
import { useServiceWizardStore } from '../../../store/serviceWizardStore'
import * as queryKeys from '../hooks/serviceQueryKeys'
import type { Service } from '../../../types/listing.types'

jest.setTimeout(25000)

// ── MOCKS ───────────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: () => true,
  }),
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

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: unknown) => <View {...(props as object)} /> }
})

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: unknown) => <View {...(props as object)} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: unknown) => <View {...(props as object)} /> }
})

jest.mock('../../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

jest.mock('../../../api/services', () => ({
  servicesApi: {
    remove: jest.fn().mockResolvedValue({ success: true }),
  },
}))

let mockCurrentUser: { id: string; username?: string; phone?: string } | null = null

jest.mock('../../../store/authStore', () => {
  const hook: any = (selector?: (s: unknown) => unknown) => {
    const state = {
      user: mockCurrentUser,
      isLoggedIn: Boolean(mockCurrentUser),
    }
    return selector ? selector(state) : state
  }
  hook.getState = () => ({
    user: mockCurrentUser,
    isLoggedIn: Boolean(mockCurrentUser),
  })
  return { useAuthStore: hook }
})

const mockToggleFavorite = jest.fn()
jest.mock('../../../hooks/listing-detail/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    isBusy: false,
    toggle: mockToggleFavorite,
  }),
}))

const mockContactCall = jest.fn()
const mockContactWhatsApp = jest.fn()
const mockContactChat = jest.fn()
jest.mock('../../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    busy: false,
    call: mockContactCall,
    whatsApp: mockContactWhatsApp,
    chat: mockContactChat,
  }),
}))

jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}))

let mockServiceDetailResult: {
  state: 'loading' | 'ready' | 'notFound' | 'error'
  vm: ServiceDetailViewModel | null
  raw: Service | null
  refetch: jest.Mock
  error: unknown
  errorKind?: any
  isRefetchError?: boolean
} = {
  state: 'ready',
  vm: null,
  raw: null,
  refetch: jest.fn(),
  error: null,
  isRefetchError: false,
}

jest.mock('../hooks/useServiceDetail', () => ({
  useServiceDetail: () => mockServiceDetailResult,
}))

// ── FIXTURE BUILDER ─────────────────────────────────────────────────────────

function makeSampleVm(
  overrides?: Partial<ServiceDetailViewModel>,
): ServiceDetailViewModel {
  return {
    id: 'srv-101',
    version: 1,
    status: 'ACTIVE',
    title: 'كراج النخبة لصيانة وتعديل السيارات',
    serviceType: 'MAINTENANCE',
    serviceTypeLabel: 'صيانة وإصلاح',
    providerType: 'WORKSHOP',
    providerTypeLabel: 'كراج / ورشة معتمدة',
    providerName: 'كراج النخبة ش.م.م',
    isHomeService: true,
    homeServiceLabel: 'خدمة منزلية / متنقلة متاحة',
    specializations: ['صيانة ميكانيكية', 'تغيير زيت وفلاتر', 'فحص كمبيوتر'],
    description: 'نقدم خدمات صيانة متكاملة لجميع أنواع السيارات باستخدام أحدث الأجهزة',
    price: {
      amountLabel: '15 - 45 ر.ع.',
      typeLabel: 'نطاق الأسعار المتوقع',
      isRange: true,
      formattedRange: '15 - 45 ر.ع.',
    },
    workingSchedule: {
      hasSchedule: true,
      workingDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
      workingDaysSummary: 'السبت - الأربعاء (5 أيام)',
      workingHoursLabel: '08:00 ص - 05:00 م',
      isOpenHoursProvided: true,
    },
    images: ['https://example.com/srv1.jpg', 'https://example.com/srv2.jpg'],
    location: {
      fullLocationText: 'مسقط، السيب، المعبيلة الصناعية',
      address: 'شارع 12 مبنى 45',
      hasCoordinates: true,
      latitude: 23.588,
      longitude: 58.3829,
    },
    website: {
      url: 'https://elite-garage.om',
      displayUrl: 'elite-garage.om',
    },
    seller: {
      id: 'seller-user-99',
      name: 'سالم المعمري',
      username: 'salim_m',
      avatarUrl: 'https://example.com/avatar.jpg',
      isVerified: true,
      memberSinceLabel: 'عضو منذ 2024',
      governorate: 'مسقط',
    },
    whatsappEnabled: true,
    postedAtLabel: 'منذ يومين',
    viewCount: 1540,
    ...overrides,
  }
}

function makeSampleRaw(overrides?: Partial<Service>): Service {
  return {
    id: 'srv-101',
    title: 'كراج النخبة لصيانة وتعديل السيارات',
    serviceName: 'كراج النخبة لصيانة وتعديل السيارات',
    description: 'نقدم خدمات صيانة متكاملة لجميع أنواع السيارات باستخدام أحدث الأجهزة',
    serviceType: 'MAINTENANCE',
    providerType: 'WORKSHOP',
    providerName: 'كراج النخبة ش.م.م',
    specializations: ['صيانة ميكانيكية', 'تغيير زيت وفلاتر', 'فحص كمبيوتر'],
    isHomeService: true,
    workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
    workingHoursOpen: '08:00',
    workingHoursClose: '17:00',
    priceFrom: 15,
    priceTo: 45,
    currency: 'OMR',
    whatsappEnabled: true,
    website: 'https://elite-garage.om',
    governorate: 'مسقط',
    city: 'السيب',
    address: 'شارع 12 مبنى 45',
    latitude: 23.588,
    longitude: 58.3829,
    createdAt: '2026-10-25T10:00:00Z',
    images: [
      {
        id: 'img-1',
        url: 'https://example.com/srv1.jpg',
        isPrimary: true,
        order: 0,
      },
      {
        id: 'img-2',
        url: 'https://example.com/srv2.jpg',
        isPrimary: false,
        order: 1,
      },
    ],
    user: {
      id: 'seller-user-99',
      username: 'salim_m',
      displayName: 'سالم المعمري',
      isVerified: true,
    },
    ...overrides,
  }
}

// ── TESTS ───────────────────────────────────────────────────────────────────

describe('ServiceDetailScreen', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockServiceDetailResult = {
      state: 'ready',
      vm: makeSampleVm(),
      raw: makeSampleRaw(),
      refetch: jest.fn(),
      error: null,
      isRefetchError: false,
    }
  })

  describe('Visitor View', () => {
    it('renders visitor view with heart button enabled and owner manage bar hidden', async () => {
      mockCurrentUser = { id: 'visitor-user-123' }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('service-detail-screen')).toBeTruthy()

      // Heart button is rendered for visitors
      expect(screen.getByTestId('nav-favorite-button')).toBeTruthy()

      // Owner manage bar is hidden
      expect(screen.queryByTestId('btn-owner-edit')).toBeNull()
      expect(screen.queryByTestId('btn-owner-delete')).toBeNull()

      // Contact actions are rendered with "محادثة" (both inline and bottom bar)
      expect(screen.getAllByTestId('btn-contact-chat').length).toBe(2)
      expect(screen.getAllByText('محادثة').length).toBe(2)
      expect(screen.getAllByText('واتساب').length).toBe(2)
      expect(screen.getAllByText('اتصال').length).toBe(2)

      // Service header elements
      expect(screen.getByText('كراج النخبة لصيانة وتعديل السيارات')).toBeTruthy()
      expect(screen.getByText('15 - 45 ر.ع.')).toBeTruthy()
      expect(screen.getByText('صيانة وإصلاح')).toBeTruthy()

      // Specializations
      expect(screen.getByText('صيانة ميكانيكية')).toBeTruthy()

      // Schedule card
      expect(screen.getByText('أوقات وجدول العمل')).toBeTruthy()

      // Website card
      expect(screen.getByText('elite-garage.om')).toBeTruthy()

      // Seller card
      expect(screen.getByText('سالم المعمري')).toBeTruthy()

      // Safety tips
      expect(screen.getByText('نصائح لسلامتك عند طلب خدمة سيارات')).toBeTruthy()
    })

    it('triggers contact callbacks on button press', async () => {
      mockCurrentUser = { id: 'visitor-user-123' }

      await render(<ServiceDetailScreen id="srv-101" />)

      const chatBtn = screen.getAllByTestId('btn-contact-chat')[0]
      const callBtn = screen.getAllByTestId('btn-contact-call')[0]
      const whatsappBtn = screen.getAllByTestId('btn-contact-whatsapp')[0]

      await act(async () => {
        fireEvent.press(chatBtn)
        fireEvent.press(callBtn)
        fireEvent.press(whatsappBtn)
      })

      expect(mockContactChat).toHaveBeenCalledTimes(1)
      expect(mockContactCall).toHaveBeenCalledTimes(1)
      expect(mockContactWhatsApp).toHaveBeenCalledTimes(1)
    })

    it('triggers refetch when pull-to-refresh is executed on ready scroll view', async () => {
      mockCurrentUser = null
      await render(<ServiceDetailScreen id="srv-101" />)

      const scrollView = screen.getByTestId('service-detail-scroll-view')
      const refreshControl = scrollView.props.refreshControl
      expect(refreshControl).toBeDefined()
      expect(refreshControl?.props?.onRefresh).toBeDefined()

      await act(async () => {
        refreshControl.props.onRefresh()
      })

      expect(mockServiceDetailResult.refetch).toHaveBeenCalled()
    })
  })

  describe('Owner View', () => {
    it('renders owner view with heart hidden and owner manage bar visible', async () => {
      // Current user is the seller
      mockCurrentUser = { id: 'seller-user-99', phone: '96891234567' }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('service-detail-screen')).toBeTruthy()

      // Heart button is strictly hidden for owner
      expect(screen.queryByTestId('nav-favorite-button')).toBeNull()

      // Contact actions are hidden for owner
      expect(screen.queryByTestId('btn-contact-chat')).toBeNull()

      // Owner manage bar is visible
      expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
      expect(screen.getByText('تعديل')).toBeTruthy()
      expect(screen.getByText('حذف')).toBeTruthy()
    })

    it('navigates to edit screen after setting wizard edit mode', async () => {
      mockCurrentUser = { id: 'seller-user-99', phone: '96891234567' }
      const setEditModeSpy = jest.spyOn(
        useServiceWizardStore.getState(),
        'setEditMode',
      )

      await render(<ServiceDetailScreen id="srv-101" />)

      const editBtn = screen.getByTestId('btn-owner-edit')
      await act(async () => {
        fireEvent.press(editBtn)
      })

      expect(setEditModeSpy).toHaveBeenCalledWith(
        'srv-101',
        expect.objectContaining({
          title: 'كراج النخبة لصيانة وتعديل السيارات',
          serviceType: 'MAINTENANCE',
        }),
      )
      expect(mockRouterPush).toHaveBeenCalledWith('/services/new')
    })

    it('prompts confirmation and deletes service on delete action', async () => {
      mockCurrentUser = { id: 'seller-user-99', phone: '96891234567' }
      const confirmSpy = jest
        .spyOn(dialogService, 'confirm')
        .mockImplementation((_t, _m, onConfirm) => {
          onConfirm()
        })
      const invalidateSpy = jest.spyOn(
        queryKeys,
        'invalidateServiceListingQueries',
      )

      await render(<ServiceDetailScreen id="srv-101" />)

      const deleteBtn = screen.getByTestId('btn-owner-delete')
      await act(async () => {
        fireEvent.press(deleteBtn)
      })

      expect(confirmSpy).toHaveBeenCalledWith(
        'حذف الإعلان',
        expect.any(String),
        expect.any(Function),
        'نعم، احذف',
        'تراجع',
        true,
      )
      expect(servicesApi.remove).toHaveBeenCalledWith('srv-101')
      expect(invalidateSpy).toHaveBeenCalledWith(expect.anything(), 'srv-101', {
        removeDetail: true,
      })
      expect(dialogService.alert).toHaveBeenCalledWith(
        'تم',
        'تم حذف إعلان الخدمة بنجاح',
        'success',
      )
    })
  })

  describe('Non-ready states', () => {
    it('renders loading state when state is loading', async () => {
      mockServiceDetailResult = {
        state: 'loading',
        vm: null,
        raw: null,
        refetch: jest.fn(),
        error: null,
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
      expect(screen.getByTestId('detail-skeleton')).toBeTruthy()
    })

    it('renders notFound state when state is notFound', async () => {
      mockServiceDetailResult = {
        state: 'notFound',
        vm: null,
        raw: null,
        refetch: jest.fn(),
        error: null,
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
      expect(screen.getByText('الإعلان غير موجود')).toBeTruthy()
    })

    it('renders error state and retries on retry press', async () => {
      const mockRefetch = jest.fn()
      mockServiceDetailResult = {
        state: 'error',
        vm: null,
        raw: null,
        refetch: mockRefetch,
        error: new Error('Network failure'),
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
      expect(screen.getByText('تعذر تحميل الإعلان')).toBeTruthy()

      const retryBtn = screen.getByText('إعادة المحاولة')
      await act(async () => {
        fireEvent.press(retryBtn)
      })

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('renders offline state when network error occurs', async () => {
      mockServiceDetailResult = {
        state: 'error',
        vm: null,
        raw: null,
        refetch: jest.fn(),
        error: { isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' },
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    })

    it('renders StaleDataBanner when data is present and isRefetchError is true', async () => {
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
        isRefetchError: true,
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      expect(
        screen.getByText('تعذر تحديث البيانات، قد تكون المعلومات المعروضة قديمة'),
      ).toBeTruthy()
    })
  })

  describe('Layout and Search Parity (D-170a)', () => {
    it('passes search props to DetailTopBar, updates on typing, and submits to /services/browse with q (Req a)', async () => {
      mockCurrentUser = { id: 'visitor-user-123' }
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل الخدمة...')
      expect(searchInput).toBeTruthy()

      await act(async () => {
        fireEvent.changeText(searchInput, 'ميكانيكا')
      })
      expect(searchInput.props.value).toBe('ميكانيكا')

      await act(async () => {
        fireEvent(searchInput, 'submitEditing', { nativeEvent: { text: 'ميكانيكا' } })
      })

      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/services/browse',
        params: { q: 'ميكانيكا' },
      })
    })

    it('filters specializations chips on typing and shows specs-no-match when query has no matches (Req b)', async () => {
      mockCurrentUser = { id: 'visitor-user-123' }
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      const searchInput = screen.getByPlaceholderText('ابحث في تفاصيل الخدمة...')

      // Initially all 3 specializations are rendered
      expect(screen.getByText('صيانة ميكانيكية')).toBeTruthy()
      expect(screen.getByText('تغيير زيت وفلاتر')).toBeTruthy()
      expect(screen.getByText('فحص كمبيوتر')).toBeTruthy()
      expect(screen.queryByTestId('specs-no-match')).toBeNull()

      // Type matching query
      await act(async () => {
        fireEvent.changeText(searchInput, 'ميكانيكية')
      })

      // Matching specialization remains, non-matching filtered out
      expect(screen.getByText('صيانة ميكانيكية')).toBeTruthy()
      expect(screen.queryByText('تغيير زيت وفلاتر')).toBeNull()
      expect(screen.queryByText('فحص كمبيوتر')).toBeNull()
      expect(screen.queryByTestId('specs-no-match')).toBeNull()

      // Type query with no matches
      await act(async () => {
        fireEvent.changeText(searchInput, 'صاروخ فضائي غير متوفر')
      })

      expect(screen.getByTestId('specs-no-match')).toBeTruthy()
      expect(screen.getByText('لا توجد نتائج مطابقة')).toBeTruthy()
      expect(screen.queryByText('صيانة ميكانيكية')).toBeNull()

      // Clear restores all
      await act(async () => {
        fireEvent.changeText(searchInput, '')
      })

      expect(screen.queryByTestId('specs-no-match')).toBeNull()
      expect(screen.getByText('صيانة ميكانيكية')).toBeTruthy()
      expect(screen.getByText('تغيير زيت وفلاتر')).toBeTruthy()
      expect(screen.getByText('فحص كمبيوتر')).toBeTruthy()
    })

    it('visitor sees seller card BEFORE description in render tree (Req c)', async () => {
      mockCurrentUser = { id: 'visitor-user-123' }
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
        isRefetchError: false,
      }

      await render(<ServiceDetailScreen id="srv-101" />)

      const sellerNode = screen.getByTestId('seller-card-touchable')
      const descNode = screen.getByText('الوصف')

      // Compare position via common ancestor hierarchy
      const getAncestors = (node: any) => {
        const list: any[] = []
        let curr = node
        while (curr) {
          list.push(curr)
          curr = curr.parent
        }
        return list
      }

      const sellerAncestors = getAncestors(sellerNode)
      const descAncestors = getAncestors(descNode)

      const commonAncestor = sellerAncestors.find((a) => descAncestors.includes(a))
      expect(commonAncestor).toBeDefined()

      const sellerBranch = sellerAncestors[sellerAncestors.indexOf(commonAncestor) - 1]
      const descBranch = descAncestors[descAncestors.indexOf(commonAncestor) - 1]

      const sellerIdx = commonAncestor.children.indexOf(sellerBranch)
      const descIdx = commonAncestor.children.indexOf(descBranch)

      expect(sellerIdx).toBeGreaterThan(-1)
      expect(descIdx).toBeGreaterThan(-1)
      expect(sellerIdx).toBeLessThan(descIdx)
    })

    it('owner does NOT see seller card (Req c owner)', async () => {
      mockCurrentUser = { id: 'seller-user-99' } // same as seller.id
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
        isRefetchError: false,
      }

      await render(<ServiceDetailScreen id="srv-101" />)
      expect(screen.queryByTestId('seller-card-touchable')).toBeNull()
    })

    it('visitor sees inline contact actions and bottom bar (Req d)', async () => {
      mockCurrentUser = { id: 'visitor-user-123' }
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
        isRefetchError: false,
      }

      await render(<ServiceDetailScreen id="srv-101" />)
      expect(screen.getAllByTestId('btn-contact-chat').length).toBe(2)
    })

    it('owner and hidden availability do not render contact actions (Req d hidden)', async () => {
      // 1. Owner view
      mockCurrentUser = { id: 'seller-user-99' }
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm(),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
        isRefetchError: false,
      }

      const { unmount } = await render(<ServiceDetailScreen id="srv-101" />)
      expect(screen.queryByTestId('btn-contact-chat')).toBeNull()
      unmount()

      // 2. Hidden availability
      mockCurrentUser = { id: 'visitor-user-123' }
      mockServiceDetailResult = {
        state: 'ready',
        vm: makeSampleVm({ status: 'ARCHIVED' as any }),
        raw: makeSampleRaw(),
        refetch: jest.fn(),
        error: null,
        isRefetchError: false,
      }
      await render(<ServiceDetailScreen id="srv-101" />)
      expect(screen.queryByTestId('btn-contact-chat')).toBeNull()
    })
  })
})
