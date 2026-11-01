import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import PublicProfileScreen from '../../app/profile/[userId]'
import { usePublicProfile } from '../hooks/useProfile'

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
jest.mock('../store/authStore', () => ({ useAuthStore: () => ({ user: null }) }))
jest.mock('../store/dialogStore', () => ({ dialogService: { alert: jest.fn() } }))

jest.mock('../hooks/useProfile', () => ({ usePublicProfile: jest.fn() }))

const mockedUsePublicProfile = jest.mocked(usePublicProfile)

describe('public profile route states', () => {
  beforeEach(() => jest.clearAllMocks())

  it('keeps a loading state visible while profile data is pending', async () => {
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByLabelText('جارٍ تحميل الملف الشخصي')).toBeTruthy()
  })

  it('shows a retry action after a profile request error', async () => {
    const refetch = jest.fn()
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch } as never)
    await render(<PublicProfileScreen />)
    fireEvent.press(screen.getByRole('button', { name: 'إعادة المحاولة' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders a not-found state when the response has no profile', async () => {
    mockedUsePublicProfile.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('الملف الشخصي غير موجود')).toBeTruthy()
  })

  it('renders typed profile data and a distinct empty listings state', async () => {
    mockedUsePublicProfile.mockReturnValue({
      data: { id: 'seller-1', displayName: 'بائع السوق', username: 'seller', createdAt: '2024-01-01', isVerified: false, _count: { listings: 0, busListings: 0, equipmentListings: 0, operatorListings: 0, spareParts: 0, carServices: 0, jobs: 0 }, totalListings: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('بائع السوق')).toBeTruthy()
    expect(screen.getByText('لا توجد إعلانات')).toBeTruthy()
  })
})
