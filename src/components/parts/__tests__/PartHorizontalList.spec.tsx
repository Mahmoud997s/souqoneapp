import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PartHorizontalList } from '../PartHorizontalList'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('../PartCard', () => ({
  PartCard: ({ item }: { item: any }) => {
    const { Text, View } = require('react-native')
    return (
      <View testID={`part-card-${item.id}`}>
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

describe('PartHorizontalList Error and Empty States (D-235)', () => {
  const mockItem = { id: 'p1', title: 'مساعدات تويوتا أصلية' }

  it('renders error state on first-request failure (isError: true, data: []), displays retry and hides empty state', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByTestId, queryByText, getByText } = await renderWithClient(
      <PartHorizontalList
        title="قطع غيار مميزة"
        data={[]}
        isLoading={false}
        isError={true}
        error={new Error('Network connection failed')}
        onRetry={onRetryMock}
        emptyText="لا توجد قطع غيار مميزة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // Error state must be visible
    expect(getByTestId('parts-horizontal-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل قطع الغيار')).toBeTruthy()

    // Retry button must be clickable
    const retryBtn = getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    fireEvent.press(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    // Empty state text must NOT be visible
    expect(queryByTestId('parts-horizontal-empty-state')).toBeNull()
    expect(queryByText('لا توجد قطع غيار مميزة حالياً')).toBeNull()
  })

  it('renders empty state when request succeeds with empty results (data: [])', async () => {
    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <PartHorizontalList
        title="قطع غيار مميزة"
        data={[]}
        isLoading={false}
        isError={false}
        emptyText="لا توجد قطع غيار مميزة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // Empty state must be visible
    expect(getByTestId('parts-horizontal-empty-state')).toBeTruthy()
    expect(getByText('لا توجد قطع غيار مميزة حالياً')).toBeTruthy()

    // Error state must NOT be visible
    expect(queryByTestId('parts-horizontal-error-state')).toBeNull()
  })

  it('preserves cached rows and displays StaleDataBanner when background refetch fails (isRefetchError: true)', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <PartHorizontalList
        title="قطع غيار مميزة"
        data={[mockItem]}
        isLoading={false}
        isRefetchError={true}
        onRetry={onRetryMock}
        emptyText="لا توجد قطع غيار مميزة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // Cached cards MUST remain rendered
    expect(getByTestId('part-card-p1')).toBeTruthy()
    expect(getByText('مساعدات تويوتا أصلية')).toBeTruthy()

    // StaleDataBanner must be displayed
    expect(getByTestId('stale-data-banner')).toBeTruthy()
    const bannerRetry = getByTestId('stale-data-retry-button')
    fireEvent.press(bannerRetry)
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    // Neither full error state nor empty state should be rendered
    expect(queryByTestId('parts-horizontal-error-state')).toBeNull()
    expect(queryByTestId('parts-horizontal-empty-state')).toBeNull()
  })

  it('does NOT render retry button on StaleDataBanner when onRetry is omitted (A-046 F1 fix)', async () => {
    const { getByTestId, queryByTestId } = await renderWithClient(
      <PartHorizontalList
        title="قطع غيار مميزة"
        data={[mockItem]}
        isLoading={false}
        isRefetchError={true}
        emptyText="لا توجد قطع غيار مميزة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // Cached cards MUST remain rendered
    expect(getByTestId('part-card-p1')).toBeTruthy()

    // StaleDataBanner must be displayed for awareness
    expect(getByTestId('stale-data-banner')).toBeTruthy()

    // BUT no no-op retry button should be rendered
    expect(queryByTestId('stale-data-retry-button')).toBeNull()
  })

  it('shows loading skeleton on first load without showing error or empty state', async () => {
    const { queryByTestId } = await renderWithClient(
      <PartHorizontalList
        title="قطع غيار مميزة"
        data={[]}
        isLoading={true}
        emptyText="لا توجد قطع غيار مميزة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(queryByTestId('parts-horizontal-error-state')).toBeNull()
    expect(queryByTestId('parts-horizontal-empty-state')).toBeNull()
    expect(queryByTestId('stale-data-banner')).toBeNull()
  })

  it('does NOT show first-load skeleton during background refetch when data is present', async () => {
    const { getByTestId, queryByTestId } = await renderWithClient(
      <PartHorizontalList
        title="قطع غيار مميزة"
        data={[mockItem]}
        isLoading={false}
        isRefetching={true}
        emptyText="لا توجد قطع غيار مميزة حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // Cards remain visible, no error, no empty
    expect(getByTestId('part-card-p1')).toBeTruthy()
    expect(queryByTestId('parts-horizontal-error-state')).toBeNull()
    expect(queryByTestId('parts-horizontal-empty-state')).toBeNull()
  })
})
