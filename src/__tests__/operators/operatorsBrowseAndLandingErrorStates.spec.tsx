import React from 'react'
import axios from 'axios'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BrowseOperatorsScreen from '../../../app/equipment/operators/browse'
import { OperatorHorizontalList } from '../../components/equipment/landing/OperatorHorizontalList'
import { useOperatorsInfinite, useMyOperators } from '../../hooks/useEquipment'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/equipment/operators/browse',
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(cb, [cb])
  },
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

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: { value: 0 },
    setNavVisible: jest.fn(),
  }),
}))

jest.mock('../../components/ui/CollapsibleSubHeader', () => ({
  CollapsibleSubHeader: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native')
    return <View>{children}</View>
  },
}))

jest.mock('../../hooks/useOperatorNavigation', () => ({
  useOperatorNavigation: () => ({
    navigateToAddOperator: jest.fn(),
    navigateToEditOperator: jest.fn(),
  }),
}))

jest.mock('../../components/equipment/EquipmentBottomBar', () => ({
  EquipmentBottomBar: () => null,
}))

jest.mock('../../components/operators/OperatorSmartBanner', () => ({
  OperatorSmartBanner: () => null,
}))

jest.mock('../../components/operators/OperatorFAQ', () => ({
  OperatorFAQ: () => null,
}))

jest.mock('../../components/ui/SectionFooterAction', () => ({
  SectionFooterAction: () => null,
}))

jest.mock('../../components/cards/OperatorCard', () => ({
  OperatorCard: ({ item }: { item: any }) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={`operator-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

jest.mock('../../hooks/useEquipment')

const mockedUseOperatorsInfinite = jest.mocked(useOperatorsInfinite)
const mockedUseMyOperators = jest.mocked(useMyOperators)

jest.setTimeout(20000)

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Operators Browse & Landing Error States (D-283 / R5-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseMyOperators.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any)
  })

  describe('BrowseOperatorsScreen Error & Stale Handling', () => {
    it('renders operators-browse-error-state on initial fetch error with empty data and wires retry', async () => {
      const refetchMock = jest.fn()
      mockedUseOperatorsInfinite.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network failure'),
        isRefetchError: false,
        isRefetching: false,
        refetch: refetchMock,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any)

      const { getByTestId, queryByText, getByText } = await renderWithClient(
        <BrowseOperatorsScreen />
      )

      expect(getByTestId('operators-browse-error-state')).toBeTruthy()
      expect(getByText('تعذر تحميل المشغلين')).toBeTruthy()
      // False positive empty text must NOT be shown
      expect(queryByText('لا توجد نتائج مطابقة')).toBeNull()

      const retryBtn = getByText('إعادة المحاولة')
      fireEvent.press(retryBtn)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })

    it('classifies offline error accurately when Axios network error occurs', async () => {
      const offlineError = new axios.AxiosError(
        'Network Error',
        'ERR_NETWORK',
        {} as any,
        {},
        undefined
      )

      mockedUseOperatorsInfinite.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: offlineError,
        isRefetchError: false,
        isRefetching: false,
        refetch: jest.fn(),
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any)

      const { getByTestId, getByText } = await renderWithClient(
        <BrowseOperatorsScreen />
      )

      expect(getByTestId('operators-browse-error-state')).toBeTruthy()
      expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    })

    it('preserves cached operators and renders StaleDataBanner on refetch error', async () => {
      const refetchMock = jest.fn()
      const cachedPages = {
        pages: [
          {
            items: [
              { id: 'op-1', title: 'مشغل رافعة برجية', operatorType: 'HEAVY_EQUIPMENT' },
              { id: 'op-2', title: 'سائق شاحنة نقل', operatorType: 'TRUCK_DRIVER' },
            ],
            meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
          },
        ],
        pageParams: [1],
      }

      mockedUseOperatorsInfinite.mockReturnValue({
        data: cachedPages,
        isLoading: false,
        isError: false,
        error: new Error('Refetch failed'),
        isRefetchError: true,
        isRefetching: false,
        refetch: refetchMock,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any)

      const { getByTestId, getByText, queryByTestId } = await renderWithClient(
        <BrowseOperatorsScreen />
      )

      // Cached operators must remain rendered
      expect(getByTestId('operator-card-op-1')).toBeTruthy()
      expect(getByTestId('operator-card-op-2')).toBeTruthy()

      // StaleDataBanner must be visible
      expect(getByTestId('stale-data-banner')).toBeTruthy()

      // Full empty error state must not be visible
      expect(queryByTestId('operators-browse-error-state')).toBeNull()

      const retryBtn = getByTestId('stale-data-retry-button')
      fireEvent.press(retryBtn)
      expect(refetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('OperatorHorizontalList Landing Error & Stale Handling', () => {
    it('renders StaleDataBanner when (isError || isRefetchError) and data.length > 0 while keeping cards', async () => {
      const onRetryMock = jest.fn()
      const operators = [
        { id: 'card-1', title: 'مشغل كرين 50 طن' },
        { id: 'card-2', title: 'مشغل بوكلين' },
      ]

      const { getByTestId } = await renderWithClient(
        <OperatorHorizontalList
          title="أمهر المشغلين"
          data={operators}
          isLoading={false}
          isRefetchError={true}
          isRefetching={false}
          onRetry={onRetryMock}
          emptyText="لا يوجد مشغلين مسجلين حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />
      )

      expect(getByTestId('operator-card-card-1')).toBeTruthy()
      expect(getByTestId('operator-card-card-2')).toBeTruthy()
      expect(getByTestId('stale-data-banner')).toBeTruthy()

      const retryBtn = getByTestId('stale-data-retry-button')
      fireEvent.press(retryBtn)
      expect(onRetryMock).toHaveBeenCalledTimes(1)
    })

    it('renders classified empty error state when data is empty and isError is true', async () => {
      const onRetryMock = jest.fn()
      const timeoutError = new axios.AxiosError(
        'Timeout',
        'ECONNABORTED',
        {} as any,
        {},
        undefined
      )

      const { getByTestId, getByText } = await renderWithClient(
        <OperatorHorizontalList
          title="أمهر المشغلين"
          data={[]}
          isLoading={false}
          isError={true}
          error={timeoutError}
          onRetry={onRetryMock}
          emptyText="لا يوجد مشغلين مسجلين حالياً"
          onSeeAll={jest.fn()}
          onPressItem={jest.fn()}
        />
      )

      expect(getByTestId('operator-list-error-state')).toBeTruthy()
      expect(getByText('انتهت مهلة الاتصال')).toBeTruthy()

      const retryBtn = getByText('إعادة المحاولة')
      fireEvent.press(retryBtn)
      expect(onRetryMock).toHaveBeenCalledTimes(1)
    })
  })
})
