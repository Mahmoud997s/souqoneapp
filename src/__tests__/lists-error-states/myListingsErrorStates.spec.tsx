import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MyListingsAllView } from '../../components/profile/my-listings/MyListingsAllView'
import { MyListingsCategoryView } from '../../components/profile/my-listings/MyListingsCategoryView'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../../components/profile/my-listings/sections.config'
import { MyListingItem } from '../../types/my-listings.types'
import axios from 'axios'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ tab: 'all' }),
}))

jest.mock('../../features/favorites/useFavoriteIds', () => ({
  useFavoriteIds: () => ({
    favoriteIds: new Set([]),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    isBusy: false,
    toggle: jest.fn(),
  }),
}))

const mockCarItem: MyListingItem = {
  id: 'car-1',
  entityType: 'car',
  normalizedStatus: 'active',
  rawStatus: 'ACTIVE',
  title: 'نيسان باترول 2021',
  updatedAt: '2026-10-01T00:00:00Z',
  raw: { id: 'car-1', make: 'نيسان', model: 'باترول' },
  mapped: {
    id: 'car-1',
    title: 'نيسان باترول 2021',
    category: 'cars',
    price: 18000,
    currency: 'OMR',
    images: ['https://img.souqone.app/car1.jpg'],
  } as any,
}

const mockGroupedSectionsWithData = MY_LISTINGS_SECTIONS_CONFIG.map((cfg) => ({
  config: cfg,
  items: cfg.categoryId === 'cars' ? [mockCarItem] : [],
}))

const mockGroupedSectionsEmpty = MY_LISTINGS_SECTIONS_CONFIG.map((cfg) => ({
  config: cfg,
  items: [],
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('MyListings — Error vs Empty vs Data & Refresh States', () => {
  describe('MyListingsAllView', () => {
    it('renders data state: shows listings section and no error or empty state', async () => {
      await render(
        <MyListingsAllView
          groupedSections={mockGroupedSectionsWithData}
          isLoading={false}
          isError={false}
          error={null}
          isRefreshing={false}
          onRefresh={jest.fn()}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.queryByTestId('my-listings-error-state')).toBeNull()
      expect(screen.queryByTestId('my-listings-empty-state')).toBeNull()
      expect(screen.getByText('نيسان باترول 2021')).toBeTruthy()
    })

    it('renders empty state: shows empty state when request succeeds with 0 items', async () => {
      await render(
        <MyListingsAllView
          groupedSections={mockGroupedSectionsEmpty}
          isLoading={false}
          isError={false}
          error={null}
          isRefreshing={false}
          onRefresh={jest.fn()}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByTestId('my-listings-empty-state')).toBeTruthy()
      expect(screen.getByText('لا توجد إعلانات')).toBeTruthy()
      expect(screen.getByText('أضف إعلانك الأول')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-error-state')).toBeNull()
    })

    it('renders offline error state: shows offline copy and retry button when network fails', async () => {
      const onRefreshMock = jest.fn()
      const offlineError = new axios.AxiosError('Network Error', 'ERR_NETWORK')

      await render(
        <MyListingsAllView
          groupedSections={mockGroupedSectionsEmpty}
          isLoading={false}
          isError={true}
          error={offlineError}
          isRefreshing={false}
          onRefresh={onRefreshMock}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByTestId('my-listings-error-state')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      expect(screen.getByText('يرجى التأكد من اتصال هاتفك بالإنترنت ثم إعادة المحاولة.')).toBeTruthy()
      expect(screen.getByText('إعادة المحاولة')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-empty-state')).toBeNull()

      fireEvent.press(screen.getByText('إعادة المحاولة'))
      expect(onRefreshMock).toHaveBeenCalledTimes(1)
    })

    it('renders server error state: shows server error copy and retry button on 500 error', async () => {
      const serverError = new axios.AxiosError(
        'Server Error',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        { status: 500, statusText: 'Internal Server Error', data: {}, headers: {}, config: {} as any }
      )

      await render(
        <MyListingsAllView
          groupedSections={mockGroupedSectionsEmpty}
          isLoading={false}
          isError={true}
          error={serverError}
          isRefreshing={false}
          onRefresh={jest.fn()}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByTestId('my-listings-error-state')).toBeTruthy()
      expect(screen.getByText('خطأ في الخادم')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-empty-state')).toBeNull()
    })

    it('preserves cached list when refetch fails in background', async () => {
      await render(
        <MyListingsAllView
          groupedSections={mockGroupedSectionsWithData}
          isLoading={false}
          isError={true}
          error={new axios.AxiosError('Network Error', 'ERR_NETWORK')}
          isRefreshing={false}
          onRefresh={jest.fn()}
          onSelectCategory={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      // Cached item remains visible!
      expect(screen.getByText('نيسان باترول 2021')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-error-state')).toBeNull()
    })
  })

  describe('MyListingsCategoryView', () => {
    it('renders data state: displays category items and no error or empty state', async () => {
      await render(
        <MyListingsCategoryView
          data={[mockCarItem]}
          isLoading={false}
          isError={false}
          error={null}
          isRefreshing={false}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={jest.fn()}
          onRefresh={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('نيسان باترول 2021')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-category-error-state')).toBeNull()
      expect(screen.queryByTestId('my-listings-category-empty-state')).toBeNull()
    })

    it('renders empty state: displays empty messaging when data is empty and no error', async () => {
      await render(
        <MyListingsCategoryView
          data={[]}
          isLoading={false}
          isError={false}
          error={null}
          isRefreshing={false}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={jest.fn()}
          onRefresh={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByTestId('my-listings-category-empty-state')).toBeTruthy()
      expect(screen.getByText('لا توجد إعلانات')).toBeTruthy()
      expect(screen.getByText('أضف إعلانك الأول')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-category-error-state')).toBeNull()
    })

    it('renders error state: displays error messaging with retry when data is empty and isError is true', async () => {
      const onRefreshMock = jest.fn()
      const offlineError = new axios.AxiosError('Network Error', 'ERR_NETWORK')

      await render(
        <MyListingsCategoryView
          data={[]}
          isLoading={false}
          isError={true}
          error={offlineError}
          isRefreshing={false}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={jest.fn()}
          onRefresh={onRefreshMock}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByTestId('my-listings-category-error-state')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      expect(screen.getByText('إعادة المحاولة')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-category-empty-state')).toBeNull()

      fireEvent.press(screen.getByText('إعادة المحاولة'))
      expect(onRefreshMock).toHaveBeenCalledTimes(1)
    })

    it('preserves cached list when refetch fails in background', async () => {
      await render(
        <MyListingsCategoryView
          data={[mockCarItem]}
          isLoading={false}
          isError={true}
          error={new axios.AxiosError('Network Error', 'ERR_NETWORK')}
          isRefreshing={false}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={jest.fn()}
          onRefresh={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={80}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('نيسان باترول 2021')).toBeTruthy()
      expect(screen.queryByTestId('my-listings-category-error-state')).toBeNull()
    })
  })
})
