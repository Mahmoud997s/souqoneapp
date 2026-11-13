import React from 'react'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, AxiosHeaders } from 'axios'
import { MyListingsAllView } from '../../components/profile/my-listings/MyListingsAllView'
import { MyListingsCategoryView } from '../../components/profile/my-listings/MyListingsCategoryView'
import { useMyListingsScreen } from '../../hooks/useMyListingsScreen'
import { listingsApi } from '../../api/listings'
import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { dialogService } from '../../store/dialogStore'
import { useAuthStore } from '../../store/authStore'
import { invalidateBusListingQueries } from '../../utils/listing-detail/busQueryKeys'
import { invalidateEquipmentListingQueries } from '../../utils/listing-detail/equipmentQueryKeys'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../../components/profile/my-listings/sections.config'
import type { GroupedSectionData } from '../../components/profile/my-listings/MyListingsAllView'
import type { MyListingItem, MyListingEntityType } from '../../types/my-listings.types'
import type { User } from '../../types/auth.types'

const mockRefetch = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../hooks/useAllMyListings', () => ({
  useAllMyListings: () => ({
    items: [],
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: mockRefetch,
  }),
}))

jest.mock('../../api/listings', () => ({
  listingsApi: {
    updateStatus: jest.fn(),
    remove: jest.fn(),
    cancelDeletionRequest: jest.fn(),
  },
}))

jest.mock('../../api/buses', () => ({
  busesApi: {
    update: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../../api/equipment', () => ({
  equipmentApi: {
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    showOptions: jest.fn(),
    confirm: jest.fn(),
    alert: jest.fn(),
  },
}))

jest.mock('../../utils/listing-detail/busQueryKeys', () => ({
  invalidateBusListingQueries: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../utils/listing-detail/equipmentQueryKeys', () => ({
  invalidateEquipmentListingQueries: jest.fn().mockResolvedValue(undefined),
}))

function makeItem(params: {
  id: string
  entityType: MyListingEntityType
  rawStatus: string
  version?: number
  raw?: Record<string, unknown>
}): MyListingItem {
  const rawObj = params.raw ?? {
    id: params.id,
    title: 'تويوتا كامري 2024',
    listingType: 'SALE',
    status: params.rawStatus,
    price: 5000,
    images: [],
  }

  return {
    id: params.id,
    entityType: params.entityType,
    normalizedStatus: 'active',
    rawStatus: params.rawStatus,
    title: 'تويوتا كامري 2024',
    updatedAt: '2026-10-26T00:00:00.000Z',
    raw: rawObj,
    mapped: {
      id: params.id,
      title: 'تويوتا كامري 2024',
      price: 5000,
      currency: 'OMR',
      images: [],
      location: 'مسقط',
      date: '2026-10-26',
      badge: 'نشط',
      category: 'cars',
      raw: rawObj,
    } as any,
    version: params.version ?? 1,
  }
}

function makeAxiosError(status: number, data?: any): AxiosError {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      status,
      statusText: String(status),
      data: data ?? {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
  )
  return error
}

describe('MyListings — Stale Data Banner and F8 Mutation Errors (D-280 / R7-2)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    useAuthStore.setState({
      user: {
        id: 'u-1',
        username: 'owner',
        phone: '+96891234567',
      } as unknown as User,
      isLoggedIn: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('MyListingsAllView — StaleDataBanner', () => {
    const mockItem = makeItem({ id: 'item-1', entityType: 'car', rawStatus: 'ACTIVE' })
    const sections: GroupedSectionData[] = [
      {
        config: MY_LISTINGS_SECTIONS_CONFIG[0],
        items: [mockItem],
      },
    ]

    it('renders StaleDataBanner below header when isError=true and items exist', async () => {
      const onRefresh = jest.fn()

      await render(
        <QueryClientProvider client={queryClient}>
          <MyListingsAllView
            groupedSections={sections}
            isLoading={false}
            isError={true}
            isRefreshing={false}
            onRefresh={onRefresh}
            onSelectCategory={jest.fn()}
            onView={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isEditSupported={() => true}
            bottomInset={0}
            topInset={0}
            header={<></>}
          />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      expect(screen.getByText('تعذر تحديث البيانات، قد تكون المعلومات المعروضة قديمة')).toBeTruthy()

      const retryBtn = screen.getByTestId('stale-data-retry-button')
      fireEvent.press(retryBtn)
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('does NOT render StaleDataBanner when isError=false', async () => {
      await render(
        <QueryClientProvider client={queryClient}>
          <MyListingsAllView
            groupedSections={sections}
            isLoading={false}
            isError={false}
            isRefreshing={false}
            onRefresh={jest.fn()}
            onSelectCategory={jest.fn()}
            onView={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isEditSupported={() => true}
            bottomInset={0}
            topInset={0}
            header={<></>}
          />
        </QueryClientProvider>
      )

      expect(screen.queryByTestId('stale-data-banner')).toBeNull()
    })
  })

  describe('MyListingsCategoryView — StaleDataBanner', () => {
    const mockItem = makeItem({ id: 'cat-item-1', entityType: 'car', rawStatus: 'ACTIVE' })

    it('renders StaleDataBanner in header when isError=true and data.length > 0', async () => {
      const onRefresh = jest.fn()

      await render(
        <QueryClientProvider client={queryClient}>
          <MyListingsCategoryView
            data={[mockItem]}
            isLoading={false}
            isError={true}
            isRefreshing={false}
            hasNextPage={false}
            isFetchingNextPage={false}
            fetchNextPage={jest.fn()}
            onRefresh={onRefresh}
            onView={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isEditSupported={() => true}
            bottomInset={0}
            topInset={0}
            header={<></>}
          />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      expect(screen.getByText('تعذر تحديث البيانات، قد تكون المعلومات المعروضة قديمة')).toBeTruthy()
    })

    it('does NOT render StaleDataBanner when data is empty and isError=true (shows EmptyState error)', async () => {
      await render(
        <QueryClientProvider client={queryClient}>
          <MyListingsCategoryView
            data={[]}
            isLoading={false}
            isError={true}
            isRefreshing={false}
            hasNextPage={false}
            isFetchingNextPage={false}
            fetchNextPage={jest.fn()}
            onRefresh={jest.fn()}
            onView={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isEditSupported={() => true}
            bottomInset={0}
            topInset={0}
            header={<></>}
          />
        </QueryClientProvider>
      )

      expect(screen.queryByTestId('stale-data-banner')).toBeNull()
      expect(screen.getByTestId('my-listings-category-error-state')).toBeTruthy()
      expect(screen.getByText('تعذر تحميل الإعلانات')).toBeTruthy()
    })
  })

  describe('useMyListingsScreen — F8 Mutation Error Messages', () => {
    it('handleDelete formats network/server errors using getMutationErrorMessage', async () => {
      ;(listingsApi.remove as jest.Mock).mockRejectedValueOnce(
        makeAxiosError(500, { message: 'Database connection failed' })
      )

      const { result } = await renderHook(() => useMyListingsScreen(), { wrapper })
      const carItem = makeItem({ id: 'car-del-1', entityType: 'car', rawStatus: 'ACTIVE' })

      await act(async () => {
        result.current.handleDelete(carItem)
      })

      expect(dialogService.confirm).toHaveBeenCalledWith(
        'حذف الإعلان',
        'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
        expect.any(Function),
        'حذف',
        'إلغاء',
        true
      )

      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.'
      )
    })

    it('confirmStatusChange formats 429 rate limit error with getPublishRateLimitErrorMessage', async () => {
      ;(listingsApi.updateStatus as jest.Mock).mockRejectedValueOnce(
        makeAxiosError(429, {
          code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
          window: 'DAILY',
          limit: 5,
        })
      )

      const { result } = await renderHook(() => useMyListingsScreen(), { wrapper })
      const carItem = makeItem({
        id: 'car-rate-1',
        entityType: 'car',
        rawStatus: 'ACTIVE',
        raw: { listingType: 'SALE' },
      })

      await act(async () => {
        result.current.handleStatusChange(carItem)
      })

      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]
      expect(options.length).toBeGreaterThan(0)

      jest.useFakeTimers()
      options[0].onPress()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'محاولات كثيرة',
        'وصلت للحد اليومي لنشر الإعلانات (5 إعلانات في اليوم)، جرّب غداً.'
      )
    })
  })
})
