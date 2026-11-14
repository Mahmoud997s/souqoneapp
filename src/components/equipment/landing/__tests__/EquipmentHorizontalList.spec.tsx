import React from 'react'
import axios from 'axios'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EquipmentHorizontalList } from '../EquipmentHorizontalList'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('../../../cards/EquipCard', () => ({
  EquipCard: ({ item }: { item: any }) => {
    const { Text, View } = require('react-native')
    return (
      <View testID={`equip-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('EquipmentHorizontalList Error, Stale, and Empty States (D-264)', () => {
  const mockItem = { id: 'eq-1', title: 'حفارة كاتربيلر 320D' }

  it('renders error state with retry button on isError=true with empty data and hides emptyText', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByTestId, queryByText, getByText } = await renderWithClient(
      <EquipmentHorizontalList
        title="أحدث المعدات المضافة"
        data={[]}
        isLoading={false}
        isError={true}
        error={new Error('Server failed')}
        onRetry={onRetryMock}
        emptyText="لا توجد معدات مضافة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('equipment-horizontal-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل المعدات')).toBeTruthy()

    const retryBtn = getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    fireEvent.press(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('equipment-horizontal-empty-state')).toBeNull()
    expect(queryByText('لا توجد معدات مضافة حالياً')).toBeNull()
  })

  it('renders offline error title when network error is passed', async () => {
    const { getByTestId, getByText, queryByText } = await renderWithClient(
      <EquipmentHorizontalList
        title="معدات للبيع"
        data={[]}
        isLoading={false}
        isError={true}
        error={new axios.AxiosError('Network Error', 'ERR_NETWORK')}
        onRetry={jest.fn()}
        emptyText="لا توجد معدات للبيع حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('equipment-horizontal-error-state')).toBeTruthy()
    expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    expect(queryByText('لا توجد معدات للبيع حالياً')).toBeNull()
  })

  it('renders empty state when request succeeds with empty array', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <EquipmentHorizontalList
        title="أحدث المعدات المضافة"
        data={[]}
        isLoading={false}
        isError={false}
        emptyText="لا توجد معدات مضافة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('equipment-horizontal-empty-state')).toBeTruthy()
    expect(getByText('لا توجد معدات مضافة حالياً')).toBeTruthy()
    expect(queryByTestId('equipment-horizontal-error-state')).toBeNull()
  })

  it('preserves cached cards and renders StaleDataBanner on refetch error', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <EquipmentHorizontalList
        title="أحدث المعدات المضافة"
        data={[mockItem]}
        isLoading={false}
        isRefetchError={true}
        onRetry={onRetryMock}
        emptyText="لا توجد معدات مضافة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('equip-card-eq-1')).toBeTruthy()
    expect(getByText('حفارة كاتربيلر 320D')).toBeTruthy()
    expect(getByTestId('stale-data-banner')).toBeTruthy()

    fireEvent.press(getByTestId('stale-data-retry-button'))
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('equipment-horizontal-error-state')).toBeNull()
    expect(queryByTestId('equipment-horizontal-empty-state')).toBeNull()
  })

  it('omits StaleDataBanner retry button when onRetry is undefined', async () => {
    const { getByTestId, queryByTestId } = await renderWithClient(
      <EquipmentHorizontalList
        title="أحدث المعدات المضافة"
        data={[mockItem]}
        isLoading={false}
        isRefetchError={true}
        emptyText="لا توجد معدات مضافة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('equip-card-eq-1')).toBeTruthy()
    expect(getByTestId('stale-data-banner')).toBeTruthy()
    expect(queryByTestId('stale-data-retry-button')).toBeNull()
  })

  it('shows skeleton on first load without error, empty, or stale banner', async () => {
    const { queryByTestId } = await renderWithClient(
      <EquipmentHorizontalList
        title="أحدث المعدات المضافة"
        data={[]}
        isLoading={true}
        emptyText="لا توجد معدات مضافة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(queryByTestId('equipment-horizontal-error-state')).toBeNull()
    expect(queryByTestId('equipment-horizontal-empty-state')).toBeNull()
    expect(queryByTestId('stale-data-banner')).toBeNull()
  })
})
