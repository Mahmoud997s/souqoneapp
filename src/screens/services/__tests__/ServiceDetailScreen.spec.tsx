import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
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
} = {
  state: 'ready',
  vm: null,
  raw: null,
  refetch: jest.fn(),
  error: null,
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
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentUser = null
    mockServiceDetailResult = {
      state: 'ready',
      vm: makeSampleVm(),
      raw: makeSampleRaw(),
      refetch: jest.fn(),
      error: null,
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

      // Contact actions are rendered with "محادثة"
      expect(screen.getByTestId('btn-contact-chat')).toBeTruthy()
      expect(screen.getByText('محادثة')).toBeTruthy()
      expect(screen.getByText('واتساب')).toBeTruthy()
      expect(screen.getByText('اتصال')).toBeTruthy()

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

      const chatBtn = screen.getByTestId('btn-contact-chat')
      const callBtn = screen.getByTestId('btn-contact-call')
      const whatsappBtn = screen.getByTestId('btn-contact-whatsapp')

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
      expect(
        screen.getByText('جارٍ تحميل تفاصيل الإعلان...'),
      ).toBeTruthy()
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
  })
})
