import React from 'react'
import { act, cleanup, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  CardSystem,
  getHomeStandardCardWidth,
  getHomeStandardImageHeight,
} from '../../constants/cardSystem'
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

  it('matches exact Home card width & image height for multiple screen widths', () => {
    expect(getHomeStandardCardWidth(375)).toBe(Math.round(375 * 0.6))
    expect(getHomeStandardCardWidth(375)).toBe(225)
    expect(getHomeStandardCardWidth(430)).toBe(Math.round(430 * 0.6))
    expect(getHomeStandardCardWidth(430)).toBe(258)
    expect(getHomeStandardImageHeight()).toBe(CardSystem.aspectRatioHeight)
    expect(getHomeStandardImageHeight()).toBe(140)
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
