import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceHorizontalList } from '../ServiceHorizontalList'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('../ServiceCard', () => ({
  ServiceCard: ({ item }: { item: any }) => {
    const { Text, View } = require('react-native')
    return (
      <View testID={`service-card-${item.id}`}>
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

describe('ServiceHorizontalList Error and Empty States (D-262)', () => {
  const mockItem = { id: 's1', title: 'فحص كمبيوتر متنقل' }

  it('renders error state on first-request failure (isError: true, data: []), displays retry and hides empty state', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByTestId, queryByText, getByText } = await renderWithClient(
      <ServiceHorizontalList
        title="خدمات متنقلة"
        data={[]}
        isLoading={false}
        isError={true}
        error={new Error('Network connection failed')}
        onRetry={onRetryMock}
        emptyText="لا توجد خدمات متنقلة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('services-horizontal-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل الخدمات')).toBeTruthy()

    const retryBtn = getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    fireEvent.press(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('services-horizontal-empty-state')).toBeNull()
    expect(queryByText('لا توجد خدمات متنقلة حالياً')).toBeNull()
  })

  it('renders empty state when request succeeds with empty results (data: [])', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <ServiceHorizontalList
        title="خدمات متنقلة"
        data={[]}
        isLoading={false}
        isError={false}
        emptyText="لا توجد خدمات متنقلة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('services-horizontal-empty-state')).toBeTruthy()
    expect(getByText('لا توجد خدمات متنقلة حالياً')).toBeTruthy()
    expect(queryByTestId('services-horizontal-error-state')).toBeNull()
  })

  it('preserves cached rows and displays StaleDataBanner when background refetch fails (isRefetchError: true)', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <ServiceHorizontalList
        title="خدمات متنقلة"
        data={[mockItem]}
        isLoading={false}
        isRefetchError={true}
        onRetry={onRetryMock}
        emptyText="لا توجد خدمات متنقلة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('service-card-s1')).toBeTruthy()
    expect(getByText('فحص كمبيوتر متنقل')).toBeTruthy()

    expect(getByTestId('stale-data-banner')).toBeTruthy()
    const bannerRetry = getByTestId('stale-data-retry-button')
    fireEvent.press(bannerRetry)
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('services-horizontal-error-state')).toBeNull()
    expect(queryByTestId('services-horizontal-empty-state')).toBeNull()
  })

  it('does NOT render retry button on StaleDataBanner when onRetry is omitted', async () => {
    const { getByTestId, queryByTestId } = await renderWithClient(
      <ServiceHorizontalList
        title="خدمات متنقلة"
        data={[mockItem]}
        isLoading={false}
        isRefetchError={true}
        emptyText="لا توجد خدمات متنقلة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('service-card-s1')).toBeTruthy()
    expect(getByTestId('stale-data-banner')).toBeTruthy()
    expect(queryByTestId('stale-data-retry-button')).toBeNull()
  })

  it('shows loading skeleton on first load without showing error or empty state', async () => {
    const { queryByTestId } = await renderWithClient(
      <ServiceHorizontalList
        title="خدمات متنقلة"
        data={[]}
        isLoading={true}
        emptyText="لا توجد خدمات متنقلة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(queryByTestId('services-horizontal-error-state')).toBeNull()
    expect(queryByTestId('services-horizontal-empty-state')).toBeNull()
    expect(queryByTestId('stale-data-banner')).toBeNull()
  })
})
