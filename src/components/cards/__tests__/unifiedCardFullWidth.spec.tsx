import React from 'react'
import { render } from '@testing-library/react-native'
import { UnifiedCard } from '../UnifiedCard'
import type { UnifiedCardItem } from '../UnifiedCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('expo-image', () => ({
  Image: () => <></>,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}))

jest.mock('../../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: jest.fn(() => ({
    isFavorite: false,
    isBusy: false,
    toggle: jest.fn(),
  })),
}))

jest.mock('../../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    call: jest.fn(),
    whatsApp: jest.fn(),
    chat: jest.fn(),
    busy: false,
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockPartItem: UnifiedCardItem = {
  id: 'part-1',
  title: 'سفايف كامري أصلية',
  category: 'parts',
  price: 45,
  images: ['https://img.souqone.app/part.jpg'],
}

describe('UnifiedCard fullWidth prop pass-through', () => {
  it('renders with width: "100%" when fullWidth is true', async () => {
    const { toJSON } = await render(
      <UnifiedCard item={mockPartItem} fullWidth={true} />,
      { wrapper: createWrapper() }
    )

    const tree = toJSON() as unknown as { props?: { style?: unknown[] } }
    expect(tree?.props?.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })])
    )
  })

  it('does not render with width: "100%" when fullWidth is false or omitted', async () => {
    const { toJSON } = await render(
      <UnifiedCard item={mockPartItem} />,
      { wrapper: createWrapper() }
    )

    const tree = toJSON() as unknown as { props?: { style?: unknown[] } }
    expect(tree?.props?.style).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })])
    )
  })
})
