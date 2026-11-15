import React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import {
  getMyListingStatusBadge,
  getMyListingStatusBadgeForItem,
} from '../../components/profile/my-listings/myListingStatusBadge'
import {
  MAIN_CATEGORY_TABS,
  MY_LISTINGS_STATUS_FILTERS,
  MyListingsVisualFilters,
} from '../../components/profile/MyListingsVisualFilters'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../../components/profile/my-listings/sections.config'
import { MyListingSectionSlider } from '../../components/profile/my-listings/MyListingSectionSlider'
import { MyListingsAllView } from '../../components/profile/my-listings/MyListingsAllView'
import { MyListingsCategoryView } from '../../components/profile/my-listings/MyListingsCategoryView'
import { Colors } from '../../constants/colors'
import type { MyListingItem } from '../../types/my-listings.types'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const R = require('react')
    const { View } = require('react-native')
    return R.createElement(View, { ...props, testID: props.testID || 'expo-image-mock' })
  },
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ supported: false, reduceTransparency: false }),
  GlassSurface: ({ children }: any) => children,
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'owner-1' },
    isAuthenticated: true,
  }),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))

const sampleCar: MyListingItem = {
  id: 'car-1',
  entityType: 'car',
  normalizedStatus: 'active',
  rawStatus: 'ACTIVE',
  title: 'تويوتا كورولا',
  updatedAt: '2026-11-15T10:00:00Z',
  raw: { id: 'car-1', status: 'ACTIVE' },
  mapped: {
    id: 'car-1',
    category: 'car',
    title: 'تويوتا كورولا',
    price: 5000,
    currency: 'OMR',
    governorate: 'مسقط',
    images: [],
    status: 'ACTIVE',
    raw: { id: 'car-1', status: 'ACTIVE', userId: 'owner-1' },
  } as any,
}

describe('D-345 Commit 4: Status badges, unified filters, Home section header, & Part 6 UI states', () => {
  afterEach(async () => {
    await cleanup()
  })

  it('maps only real backend ListingStatus values and returns null for non-API statuses', () => {
    expect(getMyListingStatusBadge('ACTIVE')).toEqual({ label: 'نشط', tone: 'success' })
    expect(getMyListingStatusBadge('DRAFT')).toEqual({ label: 'مسودة', tone: 'neutral' })
    expect(getMyListingStatusBadge('SOLD')).toEqual({ label: 'مباع', tone: 'neutral' })
    expect(getMyListingStatusBadge('RENTED')).toEqual({ label: 'مؤجر', tone: 'neutral' })
    expect(getMyListingStatusBadge('ARCHIVED')).toEqual({ label: 'مؤرشف', tone: 'neutral' })
    expect(getMyListingStatusBadge('SUSPENDED')).toEqual({ label: 'موقوف', tone: 'warning' })
    expect(getMyListingStatusBadge('REJECTED')).toBeNull()
    expect(getMyListingStatusBadge('PENDING_REVIEW')).toBeNull()
    expect(getMyListingStatusBadgeForItem(sampleCar)).toEqual({ label: 'نشط', tone: 'success' })
  })

  it('reuses MY_LISTINGS_STATUS_FILTERS across category tabs', () => {
    const allTab = MAIN_CATEGORY_TABS.find((t) => t.id === 'all')!
    for (const statusFilter of MY_LISTINGS_STATUS_FILTERS) {
      expect(allTab.items.some((i) => i.id === statusFilter.id)).toBe(true)
    }
    const carsTab = MAIN_CATEGORY_TABS.find((t) => t.id === 'cars')!
    for (const statusFilter of MY_LISTINGS_STATUS_FILTERS) {
      expect(carsTab.items.some((i) => i.id === statusFilter.id)).toBe(true)
    }
  })

  it('renders Home-aligned 32x32 paleMint section icon box in MyListingSectionSlider', async () => {
    const { getByTestId, getByText } = await render(
      <MyListingSectionSlider
        config={MY_LISTINGS_SECTIONS_CONFIG[0]}
        items={[sampleCar]}
        onSelectCategory={jest.fn()}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        isEditSupported={() => true}
      />
    )

    const iconBox = getByTestId('my-listing-section-icon-box')
    expect(iconBox.props.style).toEqual(
      expect.objectContaining({
        width: 32,
        height: 32,
        backgroundColor: Colors.paleMint,
      })
    )
    expect(getByText('إعلانات السيارات')).toBeTruthy()
  })

  it('covers Part 6 UI states in MyListingsAllView (loading, empty, error, stale)', async () => {
    const onRefresh = jest.fn()
    const baseProps = {
      groupedSections: [],
      isLoading: true,
      isError: false,
      isRefreshing: false,
      onRefresh,
      onSelectCategory: jest.fn(),
      onView: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
      isEditSupported: () => true,
      bottomInset: 0,
      topInset: 0,
    }

    const { getByTestId, rerender } = await render(<MyListingsAllView {...baseProps} />)
    expect(getByTestId('my-listings-loading')).toBeTruthy()

    await rerender(<MyListingsAllView {...baseProps} isLoading={false} />)
    expect(getByTestId('my-listings-empty-state')).toBeTruthy()

    await rerender(
      <MyListingsAllView {...baseProps} isLoading={false} isError={true} error={new Error('fail')} />
    )
    expect(getByTestId('my-listings-error-state')).toBeTruthy()

    await rerender(
      <MyListingsAllView
        {...baseProps}
        isLoading={false}
        isError={true}
        groupedSections={[{ config: MY_LISTINGS_SECTIONS_CONFIG[0], items: [sampleCar] }]}
      />
    )
    expect(getByTestId('stale-data-banner')).toBeTruthy()
  })

  it('covers Part 6 UI states in MyListingsCategoryView (loading, empty, error, stale, pagination)', async () => {
    const fetchNextPage = jest.fn()
    const baseProps = {
      data: [],
      isLoading: true,
      isError: false,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage,
      onRefresh: jest.fn(),
      onView: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
      isEditSupported: () => true,
      bottomInset: 0,
      topInset: 0,
    }

    const { getByTestId, rerender } = await render(<MyListingsCategoryView {...baseProps} />)
    expect(getByTestId('my-listings-category-loading')).toBeTruthy()

    await rerender(<MyListingsCategoryView {...baseProps} isLoading={false} />)
    expect(getByTestId('my-listings-category-empty-state')).toBeTruthy()

    await rerender(
      <MyListingsCategoryView
        {...baseProps}
        isLoading={false}
        isError={true}
        error={new Error('fail')}
      />
    )
    expect(getByTestId('my-listings-category-error-state')).toBeTruthy()

    await rerender(
      <MyListingsCategoryView
        {...baseProps}
        isLoading={false}
        isError={true}
        data={[sampleCar]}
        isFetchingNextPage={true}
      />
    )
    expect(getByTestId('stale-data-banner')).toBeTruthy()
  })

  it('switches sub-filters cleanly in MyListingsVisualFilters', async () => {
    const onSelectSubFilter = jest.fn()
    const { getByText } = await render(
      <MyListingsVisualFilters
        activeCategory="all"
        activeSubFilter="all"
        onSelectCategory={jest.fn()}
        onSelectSubFilter={onSelectSubFilter}
      />
    )

    await fireEvent.press(getByText('نشط'))
    expect(onSelectSubFilter).toHaveBeenCalledWith('ACTIVE')
  })
})
