import React from 'react'
import { act, cleanup, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  CARS_PEEK_WIDTH_RATIO,
  MY_LISTINGS_FAB_BOTTOM_OFFSET,
  MY_LISTINGS_FAB_SIZE,
  getMyListingsBottomPadding,
  getMyListingsOwnerPeekHeight,
  getPeekCardWidth,
  getPeekLeadingInset,
  getPeekSliderConfig,
} from '../../constants/peekCarousel'
import { MyListingSectionSlider } from '../../components/profile/my-listings/MyListingSectionSlider'
import { MyListingsAllView } from '../../components/profile/my-listings/MyListingsAllView'
import { OwnerCardActions } from '../../components/profile/my-listings/OwnerCardActions'
import { MyListingOwnerCard } from '../../components/profile/my-listings/MyListingOwnerCard'
import { useMyListingOwnerActions } from '../../hooks/useMyListingOwnerActions'
import { listingsApi } from '../../api/listings'
import { dialogService } from '../../store/dialogStore'
import type { MyListingItem } from '../../types/my-listings.types'

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ supported: false, reduceTransparency: false }),
  GlassSurface: ({ children }: any) => children,
}))

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

jest.mock('../../api/listings', () => ({
  listingsApi: { remove: jest.fn() },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn(),
    alert: jest.fn(),
  },
}))

const baseCarItem: MyListingItem = {
  id: 'car-10',
  entityType: 'car',
  normalizedStatus: 'active',
  rawStatus: 'ACTIVE',
  title: 'لكزس ES 2023',
  updatedAt: '2026-11-15T10:00:00Z',
  raw: { id: 'car-10', status: 'ACTIVE' },
  mapped: {
    id: 'car-10',
    category: 'car',
    title: 'لكزس ES 2023',
    price: 14500,
    currency: 'OMR',
    governorate: 'مسقط',
    images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    status: 'ACTIVE',
    raw: { id: 'car-10', status: 'ACTIVE', userId: 'owner-1' },
  } as any,
}

describe('D-345 Commit 3: Shared Home dimensions, OwnerCardActions, & useMyListingOwnerActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await cleanup()
  })

  it('matches exact Home peek card width (0.80) and image height (133) via peekCarousel helpers (D-350)', () => {
    expect(getPeekCardWidth(375)).toBe(Math.round(375 * CARS_PEEK_WIDTH_RATIO))
    expect(getPeekCardWidth(375)).toBe(300)
    expect(getPeekCardWidth(430)).toBe(Math.round(430 * CARS_PEEK_WIDTH_RATIO))
    expect(getPeekCardWidth(430)).toBe(344)
    expect(CARS_PEEK_IMAGE_HEIGHT).toBe(133)
    expect(CARS_PEEK_GAP).toBe(6)
    expect(getPeekSliderConfig(375)).toEqual({
      cardWidth: 300,
      gap: 6,
      paddingEnd: getPeekLeadingInset(),
      imageHeight: 133,
      fullWidth: true,
      compactBody: true,
      paging: true,
      showDots: true,
      depthEffect: true,
    })
  })

  it('renders OwnerCardActions in ownerActions slot off the image while keeping photo count badge visible', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    const onStatusChange = jest.fn()

    const { getByTestId, queryByText } = await render(
      <MyListingOwnerCard
        item={baseCarItem}
        onView={jest.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        isEditSupported={true}
      />
    )

    expect(getByTestId('listing-card-owner-actions-row')).toBeTruthy()
    expect(getByTestId('owner-card-actions')).toBeTruthy()
    expect(getByTestId('card-image-static')).toBeTruthy()
    expect(queryByText('2')).toBeTruthy()

    await fireEvent.press(getByTestId('owner-card-edit-btn'))
    expect(onEdit).toHaveBeenCalledWith(baseCarItem)

    await fireEvent.press(getByTestId('owner-card-status-btn'))
    expect(onStatusChange).toHaveBeenCalledWith(baseCarItem)

    await fireEvent.press(getByTestId('owner-card-delete-btn'))
    expect(onDelete).toHaveBeenCalledWith(baseCarItem)
  })

  it('preserves deletion-pending banner "طلب حذف قيد المراجعة" and disables normal owner actions', async () => {
    const fixedNow = new Date('2026-11-15T12:00:00Z').getTime()
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow)

    const onCancel = jest.fn()
    const { getByTestId, getByText, queryByTestId, rerender } = await render(
      <OwnerCardActions
        isEditSupported={true}
        canChangeStatus={true}
        pendingDeletionRequest={{
          id: 'del-1',
          status: 'PENDING',
          createdAt: new Date(fixedNow - 2 * 60 * 60 * 1000).toISOString(),
        }}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onStatusChange={jest.fn()}
        onCancelDeletionRequest={onCancel}
      />
    )

    expect(getByText('طلب حذف قيد المراجعة')).toBeTruthy()
    expect(queryByTestId('owner-card-edit-btn')).toBeNull()
    expect(queryByTestId('owner-card-delete-btn')).toBeNull()
    expect(queryByTestId('owner-card-status-btn')).toBeNull()

    await fireEvent.press(getByTestId('owner-card-cancel-deletion-btn'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    await rerender(
      <OwnerCardActions
        isEditSupported={true}
        canChangeStatus={true}
        pendingDeletionRequest={{
          id: 'del-1',
          status: 'PENDING',
          createdAt: new Date(fixedNow - 25 * 60 * 60 * 1000).toISOString(),
        }}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )

    expect(getByText('قيد مراجعة الإدارة')).toBeTruthy()
    expect(queryByTestId('owner-card-cancel-deletion-btn')).toBeNull()
    jest.restoreAllMocks()
  })

  it('disables buttons when busyAction is active', async () => {
    const onDelete = jest.fn()
    const { getByTestId } = await render(
      <OwnerCardActions
        isEditSupported={true}
        canChangeStatus={true}
        busyAction="delete"
        onEdit={jest.fn()}
        onDelete={onDelete}
        onStatusChange={jest.fn()}
      />
    )

    expect(getByTestId('owner-card-edit-btn').props.accessibilityState?.disabled).toBe(true)
    expect(getByTestId('owner-card-delete-btn').props.accessibilityState?.disabled).toBe(true)
  })

  it('optimistically deletes from cache and rolls back on API failure', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['my-cars'], { pages: [[{ id: 'car-10' }, { id: 'car-11' }]], pageParams: [1] })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )

    ;(listingsApi.remove as jest.Mock).mockRejectedValueOnce(new Error('network'))

    const { result } = await renderHook(() => useMyListingOwnerActions(), { wrapper })
    await act(async () => {
      result.current.handleDelete(baseCarItem)
    })

    const confirmCallback = (dialogService.confirm as jest.Mock).mock.calls[0][2]
    await act(async () => {
      await confirmCallback()
    })

    // Rolled back after failure
    await waitFor(() => {
      const data: any = qc.getQueryData(['my-cars'])
      expect(data.pages[0]).toHaveLength(2)
    })

    // Now succeed
    ;(listingsApi.remove as jest.Mock).mockResolvedValueOnce(undefined)
    await act(async () => {
      result.current.handleDelete(baseCarItem)
    })
    const confirmCallback2 = (dialogService.confirm as jest.Mock).mock.calls[1][2]
    await act(async () => {
      await confirmCallback2()
    })

    await waitFor(() => {
      const data: any = qc.getQueryData(['my-cars'])
      expect(data.pages[0].map((x: any) => x.id)).toEqual(['car-11'])
    })
  })
})

describe('D-350: My Listings Peek-Style Slider, Skeleton Height, RTL Paging, & FAB Clearance', () => {
  const sectionConfig = {
    entityType: 'car' as const,
    categoryId: 'cars',
    title: 'السيارات',
    icon: 'car-sports' as const,
  }

  afterEach(async () => {
    await cleanup()
  })

  it('uses Home peek dimensions and matching skeleton minHeight in MyListingSectionSlider (zero layout jump)', async () => {
    const { Dimensions, StyleSheet } = require('react-native')
    const sw = Dimensions.get('window').width
    const expected = getPeekSliderConfig(sw)

    const view = await render(
      <MyListingSectionSlider
        config={sectionConfig}
        items={[]}
        isLoading={true}
        onSelectCategory={jest.fn()}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        isEditSupported={() => true}
      />
    )

    const slot0Depth = view.getByTestId('card-slot-0-depth')
    const skeletonNode = slot0Depth.props.children
    const firstStyle = StyleSheet.flatten(skeletonNode.props.style)
    expect(firstStyle.width).toBe(expected.cardWidth)
    expect(firstStyle.minHeight).toBe(getMyListingsOwnerPeekHeight())
  })

  it('renders RTL card 0 on the physical right and card 1 at peek step (cardWidth + gap) with dots', async () => {
    const { Dimensions, StyleSheet } = require('react-native')
    const sw = Dimensions.get('window').width
    const expected = getPeekSliderConfig(sw)
    const item2 = { ...baseCarItem, id: 'car-2', title: 'نيسان باترول' }

    const view = await render(
      <MyListingSectionSlider
        config={sectionConfig}
        items={[baseCarItem, item2]}
        isLoading={false}
        onSelectCategory={jest.fn()}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        isEditSupported={() => true}
      />
    )

    const slot0 = view.getByTestId('card-slot-0')
    const slot1 = view.getByTestId('card-slot-1')
    expect(StyleSheet.flatten(slot0.props.style).right).toBe(expected.paddingEnd)
    expect(StyleSheet.flatten(slot1.props.style).right).toBe(
      expected.paddingEnd + expected.cardWidth + expected.gap
    )
    const container = view.getByTestId('horizontal-scroll-card')
    const dotsRow = container.props.children[1]
    expect(dotsRow).toBeTruthy()
    expect(dotsRow.props.children).toHaveLength(3)
  })

  it('adds FAB clearance bottom padding (FAB size + offset + safe-area + spacing) to MyListingsAllView', async () => {
    const { StyleSheet } = require('react-native')
    const bottomInset = 34
    const expectedPadding = getMyListingsBottomPadding(bottomInset)
    expect(expectedPadding).toBeGreaterThanOrEqual(
      bottomInset + MY_LISTINGS_FAB_SIZE + MY_LISTINGS_FAB_BOTTOM_OFFSET
    )

    const view = await render(
      <MyListingsAllView
        groupedSections={[]}
        isLoading={false}
        isRefreshing={false}
        onRefresh={jest.fn()}
        onSelectCategory={jest.fn()}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        isEditSupported={() => true}
        bottomInset={bottomInset}
        topInset={64}
      />
    )

    const scroll = view.getByTestId('my-listings-empty-scroll')
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle).paddingBottom).toBe(
      expectedPadding
    )
  })
})
