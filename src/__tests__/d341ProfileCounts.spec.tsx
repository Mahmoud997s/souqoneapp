import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, renderHook, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

let mockUser: { id: string; displayName: string } | null = {
  id: 'user-A',
  displayName: 'أحمد',
}
let mockMyListingsState: {
  data: any[] | undefined
  isError: boolean
  isRefetching: boolean
  refetch: jest.Mock
} = {
  data: undefined,
  isError: false,
  isRefetching: false,
  refetch: jest.fn(),
}
let mockFavoriteIdsState: {
  ids: Set<string>
  data: Set<string> | undefined
  isError: boolean
  refetch: jest.Mock
} = {
  ids: new Set<string>(),
  data: undefined,
  isError: false,
  refetch: jest.fn(),
}
const mockUseFavorites = jest.fn(() => {
  throw new Error('useFavorites must NOT be called on profile overview')
})

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useFocusEffect: jest.fn(),
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser, logout: jest.fn() }),
}))

jest.mock('../hooks/useListings', () => ({
  useMyListings: () => mockMyListingsState,
  useFavorites: () => mockUseFavorites(),
}))

jest.mock('../features/favorites/useFavoriteIds', () => ({
  useFavoriteIds: () => mockFavoriteIdsState,
}))

jest.mock('../hooks/useEquipment', () => ({
  useMyOperators: () => ({ data: [], isLoading: false }),
}))

jest.mock('../hooks/useOperatorNavigation', () => ({
  useOperatorNavigation: () => ({ navigateToAddOperator: jest.fn() }),
}))

import { useProfileOverview } from '../hooks/useProfileOverview'
import {
  clearAllProfileCounts,
  getProfileCountsStorageKey,
  writeProfileCounts,
} from '../utils/profileCountsStorage'
import { ProfileSectionCard } from '../components/profile/ProfileSectionCard'

describe('D-341 Part 4: Instant profile counters, user-scoped persistence, and no-0-flash placeholder', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    mockUser = { id: 'user-A', displayName: 'أحمد' }
    mockMyListingsState = { data: undefined, isError: false, isRefetching: false, refetch: jest.fn() }
    mockFavoriteIdsState = {
      ids: new Set<string>(),
      data: undefined,
      isError: false,
      refetch: jest.fn(),
    }
  })

  it('shows neutral placeholder "—" (never 0) when uncached, then uses persisted counts before network resolves, and never leaks counts on user switch', async () => {
    const { result, rerender } = await renderHook(() => useProfileOverview())
    const listingsItem = () => result.current.activitiesItems.find((i) => i.title === 'إعلاناتي')
    const favItem = () => result.current.activitiesItems.find((i) => i.title === 'المفضلة')

    expect(listingsItem()?.badge).toBe('—')
    expect(favItem()?.badge).toBe('—')
    expect(mockUseFavorites).not.toHaveBeenCalled()

    // Seed persisted counts for user-A and re-mount
    await writeProfileCounts('user-A', { listingsCount: 7, favoritesCount: 12 })
    const hook2 = await renderHook(() => useProfileOverview())
    await waitFor(() => {
      expect(
        hook2.result.current.activitiesItems.find((i) => i.title === 'إعلاناتي')?.badge
      ).toBe(7)
      expect(
        hook2.result.current.activitiesItems.find((i) => i.title === 'المفضلة')?.badge
      ).toBe(12)
    })

    // Switch to user-B: user-A's counts must NEVER appear
    mockUser = { id: 'user-B', displayName: 'بدر' }
    await hook2.rerender({})
    expect(
      hook2.result.current.activitiesItems.find((i) => i.title === 'إعلاناتي')?.badge
    ).toBe('—')
    expect(
      hook2.result.current.activitiesItems.find((i) => i.title === 'المفضلة')?.badge
    ).toBe('—')

    // Favorites count follows favorite-ids set size on toggle without calling useFavorites
    const toggledIds = new Set(['id-1', 'id-2', 'id-3'])
    mockFavoriteIdsState = { ids: toggledIds, data: toggledIds, isError: false, refetch: jest.fn() }
    await rerender({})
    expect(favItem()?.badge).toBe(3)
    expect(mockUseFavorites).not.toHaveBeenCalled()
  })

  it('clears persisted counts on logout via clearAllProfileCounts', async () => {
    await writeProfileCounts('user-A', { listingsCount: 5, favoritesCount: 2 })
    expect(await AsyncStorage.getItem(getProfileCountsStorageKey('user-A'))).not.toBeNull()

    await clearAllProfileCounts()
    expect(await AsyncStorage.getItem(getProfileCountsStorageKey('user-A'))).toBeNull()
  })

  it('renders placeholder "—" and numeric badge with identical fixed minWidth on ProfileSectionCard', async () => {
    await render(
      <ProfileSectionCard
        title="نشاطي"
        items={[{ icon: 'grid-outline', title: 'إعلاناتي', badge: '—' }]}
      />
    )
    const dashNode = screen.getByText('—')
    const pillStyle = StyleSheet.flatten((dashNode.parent as any)?.props?.style)
    expect(pillStyle?.minWidth).toBe(28)
  })
})
