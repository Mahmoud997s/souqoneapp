import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import PublicProfileScreen from '../../app/profile/[userId]'
import { usePublicProfile } from '../hooks/useProfile'
import { usePublicProfileCars } from '../hooks/public-profile/usePublicProfileCars'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ userId: 'seller-1' }),
  router: { push: jest.fn(), back: jest.fn() },
}))
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }))
jest.mock('../components/ui/AppHeader', () => ({ AppHeader: () => null }))
jest.mock('../components/cars/CarCard', () => ({ CarCard: () => null }))
jest.mock('../api/chat', () => ({ chatApi: { createRoom: jest.fn() } }))
jest.mock('../components/ui/SkeletonCard', () => ({ SkeletonCard: () => null }))
jest.mock('../components/ui/VerifiedBadge', () => ({ VerifiedBadge: () => null }))
jest.mock('../hooks/useListings', () => ({ useListings: () => ({ data: [], isLoading: false, refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileCars', () => ({ usePublicProfileCars: jest.fn() }))
jest.mock('../hooks/public-profile/usePublicProfileBuses', () => ({ usePublicProfileBuses: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileEquipment', () => ({ usePublicProfileEquipment: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileParts', () => ({ usePublicProfileParts: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileServices', () => ({ usePublicProfileServices: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../store/authStore', () => ({ useAuthStore: () => ({ user: null }) }))
jest.mock('../store/dialogStore', () => ({ dialogService: { alert: jest.fn() } }))

jest.mock('../hooks/useProfile', () => ({ usePublicProfile: jest.fn() }))

const mockedUsePublicProfile = jest.mocked(usePublicProfile)
const mockedUsePublicProfileCars = jest.mocked(usePublicProfileCars)
const defaultCarsQuery = { data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }

describe('public profile route states', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUsePublicProfileCars.mockReturnValue(defaultCarsQuery as never)
  })

  it('keeps a loading state visible while profile data is pending', async () => {
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByLabelText('جارٍ تحميل الملف الشخصي')).toBeTruthy()
  })

  it('shows a retry action after a profile request error', async () => {
    const refetch = jest.fn()
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: { response: { status: 500 } }, refetch } as never)
    await render(<PublicProfileScreen />)
    fireEvent.press(screen.getByRole('button', { name: 'إعادة المحاولة' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('keeps a loaded profile visible after a refresh error', async () => {
    const refetch = jest.fn()
    mockedUsePublicProfile.mockReturnValue({
      data: { id: 'seller-1', displayName: 'بائع السوق', username: 'seller', createdAt: '2024-01-01', isVerified: false, _count: { listings: 0, busListings: 0, equipmentListings: 0, spareParts: 0, carServices: 0, driverJobs: 0 }, totalListings: 0 },
      isLoading: false,
      isError: true,
      refetch,
    } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('بائع السوق')).toBeTruthy()
    expect(screen.getByText('تعذر تحديث بيانات الملف الشخصي')).toBeTruthy()
    fireEvent.press(screen.getByRole('button', { name: 'إعادة محاولة تحديث الملف الشخصي' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('retries the failed next page instead of refetching the loaded pages', async () => {
    const fetchNextPage = jest.fn()
    const refetch = jest.fn()
    mockedUsePublicProfile.mockReturnValue({
      data: { id: 'seller-1', displayName: 'بائع السوق', username: 'seller', createdAt: '2024-01-01', isVerified: false, _count: { listings: 0, busListings: 0, equipmentListings: 0, spareParts: 0, carServices: 0, driverJobs: 0 }, totalListings: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
    mockedUsePublicProfileCars.mockReturnValue({ ...defaultCarsQuery, isError: true, isFetchNextPageError: true, fetchNextPage, refetch } as never)
    await render(<PublicProfileScreen />)
    fireEvent.press(screen.getByRole('button', { name: 'إعادة تحميل الإعلانات' }))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('renders a not-found state when the response has no profile', async () => {
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('الملف الشخصي غير موجود')).toBeTruthy()
  })

  it('renders not-found for a 404 without offering an automatic retry action', async () => {
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: { response: { status: 404 } }, refetch: jest.fn() } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('الملف الشخصي غير موجود')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'إعادة المحاولة' })).toBeNull()
  })

  it('renders typed profile data and a distinct empty listings state', async () => {
    mockedUsePublicProfile.mockReturnValue({
      data: { id: 'seller-1', displayName: 'بائع السوق', username: 'seller', createdAt: '2024-01-01', isVerified: false, _count: { listings: 0, busListings: 2, equipmentListings: 3, operatorListings: 9, spareParts: 4, carServices: 5, driverJobs: 4 }, totalListings: 27 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('بائع السوق')).toBeTruthy()
    expect(screen.getByText('14')).toBeTruthy()
    expect(screen.getByText('لا توجد سيارات حالياً')).toBeTruthy()
  })
})
