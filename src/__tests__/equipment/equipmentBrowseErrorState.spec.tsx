import React from 'react'
import axios from 'axios'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EquipmentBrowseScreen from '../../../app/equipment/browse'
import { useEquipment } from '../../hooks/useEquipment'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/equipment/browse',
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

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../components/equipment/EquipmentBottomBar', () => ({
  EquipmentBottomBar: () => null,
}))

jest.mock('../../components/ui/CollapsibleSubHeader', () => ({
  CollapsibleSubHeader: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native')
    return <View>{children}</View>
  },
}))

jest.mock('../../components/cards/EquipCard', () => ({
  EquipCard: ({ item }: { item: any }) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={`equip-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

jest.mock('../../hooks/useEquipment')

const mockedUseEquipment = jest.mocked(useEquipment)

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Equipment Browse Screen Error, Empty, and Stale States (D-264)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders equipment-browse-error-state on initial error (no cached data), shows retry, and hides empty state', async () => {
    const refetchMock = jest.fn()
    mockedUseEquipment.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('Unexpected contract failure'),
      refetch: refetchMock,
      isRefetchError: false,
    } as any)

    const { getByTestId, queryByTestId, getByText, queryByText } = await renderWithClient(
      <EquipmentBrowseScreen />
    )

    expect(getByTestId('equipment-browse-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل المعدات')).toBeTruthy()

    const retryBtn = getByText('إعادة المحاولة')
    fireEvent.press(retryBtn)
    expect(refetchMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('equipment-browse-empty-state')).toBeNull()
    expect(queryByText('لا توجد معدات مطابقة')).toBeNull()
  })

  it('maps offline error to user-friendly offline copy in browse error state', async () => {
    mockedUseEquipment.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new axios.AxiosError('Network Error', 'ERR_NETWORK'),
      refetch: jest.fn(),
      isRefetchError: false,
    } as any)

    const { getByTestId, getByText, queryByText } = await renderWithClient(
      <EquipmentBrowseScreen />
    )

    expect(getByTestId('equipment-browse-error-state')).toBeTruthy()
    expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    expect(queryByText('لا توجد معدات مطابقة')).toBeNull()
  })

  it('renders equipment-browse-empty-state when request succeeds with empty list', async () => {
    mockedUseEquipment.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <EquipmentBrowseScreen />
    )

    expect(getByTestId('equipment-browse-empty-state')).toBeTruthy()
    expect(getByText('لا توجد معدات مطابقة')).toBeTruthy()
    expect(queryByTestId('equipment-browse-error-state')).toBeNull()
    expect(queryByTestId('stale-data-banner')).toBeNull()
  })

  it('preserves cached items and renders StaleDataBanner when isError=true with cached data', async () => {
    const refetchMock = jest.fn()
    mockedUseEquipment.mockReturnValue({
      data: [
        {
          id: 'eq-cached-1',
          title: 'حفارة كاتربيلر مخزنة',
          images: [],
          price: 18000,
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('Network Error'),
      refetch: refetchMock,
      isRefetchError: true,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <EquipmentBrowseScreen />
    )

    expect(getByTestId('stale-data-banner')).toBeTruthy()
    expect(getByTestId('equip-card-eq-cached-1')).toBeTruthy()
    expect(getByText('حفارة كاتربيلر مخزنة')).toBeTruthy()

    fireEvent.press(getByTestId('stale-data-retry-button'))
    expect(refetchMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('equipment-browse-error-state')).toBeNull()
    expect(queryByTestId('equipment-browse-empty-state')).toBeNull()
  })

  it('does not show error or empty state during background refetch with cached items', async () => {
    mockedUseEquipment.mockReturnValue({
      data: [
        {
          id: 'eq-cached-2',
          title: 'رافعة شوكية',
          images: [],
          price: 9500,
        },
      ],
      isLoading: false,
      isFetching: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
    } as any)

    const { getByTestId, queryByTestId } = await renderWithClient(<EquipmentBrowseScreen />)

    expect(getByTestId('equip-card-eq-cached-2')).toBeTruthy()
    expect(queryByTestId('equipment-browse-error-state')).toBeNull()
    expect(queryByTestId('equipment-browse-empty-state')).toBeNull()
    expect(queryByTestId('stale-data-banner')).toBeNull()
  })
})
