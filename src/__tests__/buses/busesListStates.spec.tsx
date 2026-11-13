import React from 'react'
import { render, renderHook, waitFor, fireEvent, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BusesBrowseScreen from '../../../app/buses/browse'
import { BusHorizontalList } from '../../components/buses/landing/BusHorizontalList'
import * as useBusesModule from '../../hooks/useBuses'
import { busesApi } from '../../api/buses'
import { ListContractError } from '../../utils/parseListEnvelope'

jest.mock('../../api/buses', () => ({
  busesApi: {
    getAll: jest.fn(),
    getManufacturers: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/buses/browse',
  useSegments: () => ['buses', 'browse'],
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
    scrollY: { value: 0 },
  }),
}))

jest.mock('../../components/buses/BusesBottomBar', () => ({
  BusesBottomBar: () => null,
}))

jest.mock('../../components/ui/CollapsibleSubHeader', () => ({
  CollapsibleSubHeader: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native')
    return <View>{children}</View>
  },
}))

jest.mock('../../components/buses/BusesVisualFilters', () => ({
  BusesVisualFilters: () => null,
}))

jest.mock('../../components/filters/BusFilterBottomSheet', () => ({
  BusFilterBottomSheet: () => null,
}))

jest.mock('../../components/filters/LegacyQuickFilterModal', () => ({
  QuickFilterModal: () => null,
}))

const mockedGetAll = jest.mocked(busesApi.getAll)

const SAMPLE_BUS_RAW = {
  id: 'bus-101',
  title: 'تويوتا كوستر 2023 نظيفة جداً',
  price: 18500,
  currency: 'OMR',
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  capacity: 30,
  year: 2023,
  make: 'تويوتا',
  images: ['https://cdn.souqone.app/bus-101.jpg'],
  governorate: 'مسقط',
  city: 'السيب',
  createdAt: '2026-11-10T10:00:00.000Z',
}

const SAMPLE_BUS_CARD = {
  id: 'bus-101',
  category: 'bus' as const,
  title: 'تويوتا كوستر 2023 نظيفة جداً',
  price: 18500,
  currency: 'OMR',
  images: ['https://cdn.souqone.app/bus-101.jpg'],
  governorate: 'مسقط',
  city: 'السيب',
  location: 'مسقط، السيب',
  details: [{ icon: 'people-outline', value: '30 راكب' }],
  raw: SAMPLE_BUS_RAW,
}

describe('Buses R3-1: parseListEnvelope, Browse Error/Stale States & BusHorizontalList (D-271)', () => {
  let queryClient: QueryClient
  let activeSpies: jest.SpyInstance[] = []

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })
  })

  afterEach(async () => {
    for (const spy of activeSpies) {
      spy.mockRestore()
    }
    activeSpies = []
    queryClient.clear()
    await cleanup()
  })

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  describe('1. useBuses & useInfiniteBuses parseListEnvelope contract enforcement', () => {
    it('parses standard { items, meta } envelope and maps BusCard items', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [SAMPLE_BUS_RAW],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      } as any)

      const { result } = await renderHook(() => useBusesModule.useBuses({}, { retry: false }), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]?.id).toBe('bus-101')
    })

    it('parses direct array response via parseListEnvelope', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [SAMPLE_BUS_RAW],
      } as any)

      const { result } = await renderHook(() => useBusesModule.useBuses({}, { retry: false }), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.[0]?.id).toBe('bus-101')
    })

    it('parses legacy { data, total } envelope cleanly', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          data: [SAMPLE_BUS_RAW],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      } as any)

      const { result } = await renderHook(() => useBusesModule.useBuses({}, { retry: false }), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.[0]?.id).toBe('bus-101')
    })

    it.each([
      ['null payload', null],
      ['missing items object', {}],
      ['non-array items', { items: 'broken' }],
      ['non-array legacy data', { data: 'broken' }],
      [
        'inconsistent meta (totalPages=0 with total>0)',
        { items: [], meta: { total: 3, page: 1, limit: 10, totalPages: 0 } },
      ],
    ])('throws ListContractError for malformed payload: %s', async (_label, badPayload) => {
      mockedGetAll.mockResolvedValueOnce({ data: badPayload } as any)

      const { result } = await renderHook(() => useBusesModule.useBuses({}, { retry: false }), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('useInfiniteBuses rejects malformed responses instead of returning empty pages', async () => {
      mockedGetAll.mockResolvedValueOnce({ data: { items: 'not-an-array' } } as any)

      const { result } = await renderHook(() => useBusesModule.useInfiniteBuses(), {
        wrapper,
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })

  describe('2. BusesBrowseScreen StaleDataBanner & ListErrorState wiring', () => {
    it('renders StaleDataBanner above existing bus cards when isRefetchError is true and retries on press', async () => {
      const refetchMock = jest.fn()
      activeSpies.push(
        jest.spyOn(useBusesModule, 'useBusManufacturers').mockReturnValue({ data: [] } as any),
        jest.spyOn(useBusesModule, 'useInfiniteBuses').mockReturnValue({
          data: { pages: [{ data: [SAMPLE_BUS_CARD], page: 1, totalPages: 2 }] },
          isLoading: false,
          isFetching: false,
          isError: true,
          error: { isAxiosError: true, code: 'ERR_NETWORK', request: {} },
          isRefetchError: true,
          refetch: refetchMock,
          fetchNextPage: jest.fn(),
          hasNextPage: true,
          isFetchingNextPage: false,
        } as any)
      )

      const screen = await render(<BusesBrowseScreen />, { wrapper })

      expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      expect(screen.getByText('تويوتا كوستر 2023 نظيفة جداً')).toBeTruthy()
      expect(screen.queryByTestId('buses-browse-error-state')).toBeNull()

      const retryBtn = screen.getByTestId('stale-data-retry-button')
      await act(async () => {
        fireEvent.press(retryBtn)
      })
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })

    it('renders classified offline error state and triggers refetch when listings are empty and network fails', async () => {
      const refetchMock = jest.fn()
      activeSpies.push(
        jest.spyOn(useBusesModule, 'useBusManufacturers').mockReturnValue({ data: [] } as any),
        jest.spyOn(useBusesModule, 'useInfiniteBuses').mockReturnValue({
          data: undefined,
          isLoading: false,
          isFetching: false,
          isError: true,
          error: { isAxiosError: true, code: 'ERR_NETWORK', request: {} },
          isRefetchError: false,
          refetch: refetchMock,
          fetchNextPage: jest.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        } as any)
      )

      const screen = await render(<BusesBrowseScreen />, { wrapper })

      expect(screen.getByTestId('buses-browse-error-state')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      expect(screen.queryByTestId('stale-data-banner')).toBeNull()

      const retryBtn = screen.getByText('إعادة المحاولة')
      await act(async () => {
        fireEvent.press(retryBtn)
      })
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })

    it('renders timeout error classification when request times out with empty results', async () => {
      const refetchMock = jest.fn()
      activeSpies.push(
        jest.spyOn(useBusesModule, 'useBusManufacturers').mockReturnValue({ data: [] } as any),
        jest.spyOn(useBusesModule, 'useInfiniteBuses').mockReturnValue({
          data: undefined,
          isLoading: false,
          isFetching: false,
          isError: true,
          error: { isAxiosError: true, code: 'ECONNABORTED' },
          isRefetchError: false,
          refetch: refetchMock,
          fetchNextPage: jest.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        } as any)
      )

      const screen = await render(<BusesBrowseScreen />, { wrapper })

      expect(screen.getByTestId('buses-browse-error-state')).toBeTruthy()
      expect(screen.getByText('انتهت مهلة الاتصال')).toBeTruthy()
    })
  })

  describe('3. BusHorizontalList compact error & stale banner states', () => {
    it('renders compact error state instead of emptyText when isError=true and calls onRetry', async () => {
      const onRetryMock = jest.fn()
      const screen = await render(
        <BusHorizontalList
          title="أحدث اعلانات الحافلات"
          data={[]}
          isLoading={false}
          isError={true}
          error={{ isAxiosError: true, code: 'ERR_NETWORK', request: {} }}
          onRetry={onRetryMock}
          emptyText="لا توجد حافلات مضافة حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('buses-horizontal-error-state')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      expect(screen.queryByText('لا توجد حافلات مضافة حالياً')).toBeNull()

      const retryBtn = screen.getByText('إعادة المحاولة')
      await act(async () => {
        fireEvent.press(retryBtn)
      })
      expect(onRetryMock).toHaveBeenCalledTimes(1)
    })

    it('renders StaleDataBanner above bus cards when isRefetchError=true and data is non-empty', async () => {
      const onRetryMock = jest.fn()
      const screen = await render(
        <BusHorizontalList
          title="حافلات للبيع"
          data={[SAMPLE_BUS_CARD]}
          isLoading={false}
          isRefetchError={true}
          onRetry={onRetryMock}
          emptyText="لا توجد حافلات للبيع حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />,
        { wrapper }
      )

      expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
      expect(screen.queryByTestId('buses-horizontal-error-state')).toBeNull()

      const retryBtn = screen.getByTestId('stale-data-retry-button')
      await act(async () => {
        fireEvent.press(retryBtn)
      })
      expect(onRetryMock).toHaveBeenCalledTimes(1)
    })

    it('renders emptyText normally when not loading and no error occurred', async () => {
      const screen = await render(
        <BusHorizontalList
          title="حافلات للإيجار"
          data={[]}
          isLoading={false}
          isError={false}
          emptyText="لا توجد حافلات للإيجار حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />,
        { wrapper }
      )

      expect(screen.getByText('لا توجد حافلات للإيجار حالياً')).toBeTruthy()
      expect(screen.queryByTestId('buses-horizontal-error-state')).toBeNull()
    })
  })
})
