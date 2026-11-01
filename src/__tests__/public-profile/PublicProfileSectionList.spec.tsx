import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { PublicProfileSectionList } from '../../components/profile/public-profile/PublicProfileSectionList'
import { UnifiedCardItem } from '../../types/unified-card.types'

jest.mock('../../components/profile/ListingCardByType', () => ({
  ListingCardByType: ({ item }: { item: UnifiedCardItem }) => require('react').createElement(require('react-native').Text, { testID: 'inventory-card' }, item.title),
}))

const item: UnifiedCardItem = { id: 'car-1', title: 'Car', images: [] }

function renderList(overrides: Partial<React.ComponentProps<typeof PublicProfileSectionList>> = {}) {
  return render(
    <PublicProfileSectionList
      vertical="car"
      items={[]}
      isLoading={false}
      isError={false}
      isRefreshing={false}
      isFetchingNextPage={false}
      hasNextPage={false}
      onRefresh={jest.fn()}
      onRetry={jest.fn()}
      onLoadMore={jest.fn()}
      onPressItem={jest.fn()}
      {...overrides}
    />,
  )
}

describe('PublicProfileSectionList states', () => {
  it('shows an empty state for a zero-count tab', async () => {
    await renderList({ vertical: 'bus' })
    expect(screen.getByText('لا توجد حافلات حالياً')).toBeTruthy()
  })

  it('shows retry for a query error', async () => {
    const onRetry = jest.fn()
    await renderList({ isError: true, onRetry })
    fireEvent.press(screen.getByRole('button', { name: 'إعادة تحميل الإعلانات' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows load more and forwards the action when another page exists', async () => {
    const onLoadMore = jest.fn()
    await renderList({ items: [item], hasNextPage: true, onLoadMore })
    expect(screen.getByTestId('inventory-card')).toBeTruthy()
    fireEvent.press(screen.getByRole('button', { name: 'تحميل المزيد من الإعلانات' }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('keeps loaded listings visible and offers retry after a later-page error', async () => {
    const onRetry = jest.fn()
    await renderList({ items: [item], isError: true, hasNextPage: true, onRetry })
    expect(screen.getByTestId('inventory-card')).toBeTruthy()
    expect(screen.queryByText('تعذر تحميل الإعلانات')).toBeNull()
    fireEvent.press(screen.getByRole('button', { name: 'إعادة تحميل الإعلانات' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
