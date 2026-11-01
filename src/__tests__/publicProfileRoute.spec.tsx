import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import PublicProfileScreen from '../../app/profile/[userId]'
import { router } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { usePublicProfile } from '../hooks/useProfile'
import { usePublicProfileCars } from '../hooks/public-profile/usePublicProfileCars'
import { chatApi } from '../api/chat'
import { dialogService } from '../store/dialogStore'
import { findNewestPublicProfileChatTarget } from '../utils/publicProfileChatTarget'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ userId: 'seller-1' }),
  router: { push: jest.fn(), back: jest.fn() },
}))
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }))
jest.mock('../components/ui/AppHeader', () => ({ AppHeader: () => null }))
jest.mock('../components/cars/CarCard', () => ({ CarCard: () => null }))
jest.mock('../api/chat', () => ({ chatApi: { createRoom: jest.fn() } }))
jest.mock('../utils/publicProfileChatTarget', () => ({ findNewestPublicProfileChatTarget: jest.fn() }))
jest.mock('../components/ui/SkeletonCard', () => ({ SkeletonCard: () => null }))
jest.mock('../components/ui/VerifiedBadge', () => ({ VerifiedBadge: () => null }))
jest.mock('../hooks/useListings', () => ({ useListings: () => ({ data: [], isLoading: false, refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileCars', () => ({ usePublicProfileCars: jest.fn() }))
jest.mock('../hooks/public-profile/usePublicProfileBuses', () => ({ usePublicProfileBuses: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileEquipment', () => ({ usePublicProfileEquipment: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileParts', () => ({ usePublicProfileParts: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../hooks/public-profile/usePublicProfileServices', () => ({ usePublicProfileServices: () => ({ data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }) }))
jest.mock('../store/authStore', () => ({ useAuthStore: jest.fn() }))
jest.mock('../store/dialogStore', () => ({ dialogService: { alert: jest.fn() } }))

jest.mock('../hooks/useProfile', () => ({ usePublicProfile: jest.fn() }))

const mockedUseAuthStore = jest.mocked(useAuthStore)
const mockedRouter = jest.mocked(router)
const mockedUsePublicProfile = jest.mocked(usePublicProfile)
const mockedUsePublicProfileCars = jest.mocked(usePublicProfileCars)
const defaultCarsQuery = { data: { pages: [] }, isLoading: false, isError: false, isFetching: false, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: jest.fn(), refetch: jest.fn() }

describe('public profile route states', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseAuthStore.mockReturnValue({ user: null, isLoading: false } as never)
    mockedUsePublicProfileCars.mockReturnValue(defaultCarsQuery as never)
  })

  function loadSellerProfile(listings = 1) {
    mockedUsePublicProfile.mockReturnValue({
      data: { id: 'seller-1', displayName: 'بائع السوق', username: 'seller', createdAt: '2024-01-01', isVerified: false, _count: { listings, busListings: 0, equipmentListings: 0, spareParts: 0, carServices: 0, driverJobs: 0 }, totalListings: listings },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
  }

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

  it('shows not-found when a refresh returns 404 despite previously loaded profile data', async () => {
    mockedUsePublicProfile.mockReturnValue({
      data: { id: 'seller-1', displayName: 'بائع قديم', username: 'seller', createdAt: '2024-01-01', isVerified: false, _count: { listings: 0, busListings: 0, equipmentListings: 0, spareParts: 0, carServices: 0, driverJobs: 0 }, totalListings: 0 },
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
      refetch: jest.fn(),
    } as never)
    await render(<PublicProfileScreen />)
    expect(screen.getByText('الملف الشخصي غير موجود')).toBeTruthy()
    expect(screen.queryByText('بائع قديم')).toBeNull()
  })

  it('waits for auth hydration before rendering owner or visitor actions', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'seller-1' }, isLoading: true } as never)

    await render(<PublicProfileScreen />)

    expect(screen.queryByRole('button', { name: 'تعديل ملفي الشخصي' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'راسل البائع' })).toBeNull()
  })

  it('shows the edit action and no chat action for the profile owner', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'seller-1' }, isLoading: false } as never)

    await render(<PublicProfileScreen />)

    fireEvent.press(screen.getByRole('button', { name: 'تعديل ملفي الشخصي' }))
    expect(mockedRouter.push).toHaveBeenCalledWith('/profile/edit-profile')
    expect(screen.queryByRole('button', { name: 'راسل البائع' })).toBeNull()
  })

  it('uses the glass seller title bar back action and places visitor contact inside the hero', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'visitor-1' }, isLoading: false } as never)

    await render(<PublicProfileScreen />)

    expect(screen.getByTestId('public-profile-top-glow')).toBeTruthy()
    expect(screen.getByText('ملف البائع')).toBeTruthy()
    fireEvent.press(screen.getByRole('button', { name: 'رجوع' }))
    expect(mockedRouter.back).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('public-profile-action').parent?.props.testID).toBe('public-profile-hero')
    expect(screen.queryByText('محادثة')).toBeNull()
  })

  it.each([
    ['visitor', { id: 'visitor-1' }],
    ['guest', null],
  ] as const)('keeps the contact action for a %s and hides owner edit', async (_viewerKind, user) => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user, isLoading: false } as never)

    await render(<PublicProfileScreen />)

    expect(screen.getByRole('button', { name: 'راسل البائع' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'تعديل ملفي الشخصي' })).toBeNull()
  })
  it('opens chat for the newest supported listing target', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'visitor-1' }, isLoading: false } as never)
    jest.mocked(findNewestPublicProfileChatTarget).mockResolvedValue({ entityId: 'service-1', entityType: 'CAR_SERVICE' })
    jest.mocked(chatApi.createRoom).mockResolvedValue({ data: { id: 'room-1' } } as never)

    await render(<PublicProfileScreen />)
    await fireEvent.press(screen.getByRole('button', { name: 'راسل البائع' }))

    expect(findNewestPublicProfileChatTarget).toHaveBeenCalledWith('seller-1')
    expect(chatApi.createRoom).toHaveBeenCalledWith({ entityId: 'service-1', entityType: 'CAR_SERVICE' })
    expect(router.push).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'room-1' } })
  })

  it('hides visitor chat for a profile with no active listings', async () => {
    loadSellerProfile(0)
    mockedUseAuthStore.mockReturnValue({ user: { id: 'visitor-1' }, isLoading: false } as never)

    await render(<PublicProfileScreen />)

    expect(screen.queryByRole('button', { name: 'راسل البائع' })).toBeNull()
  })

  it('shows the transient retry message when every listing lookup fails', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'visitor-1' }, isLoading: false } as never)
    jest.mocked(findNewestPublicProfileChatTarget).mockRejectedValue(new Error('All public profile listing queries failed'))

    await render(<PublicProfileScreen />)
    await fireEvent.press(screen.getByRole('button', { name: 'راسل البائع' }))

    expect(chatApi.createRoom).not.toHaveBeenCalled()
    expect(dialogService.alert).toHaveBeenCalledWith('تعذر فتح المحادثة', 'حدث خطأ مؤقت. أعد المحاولة.')
  })
  it('shows a retryable message when no chat target is available', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'visitor-1' }, isLoading: false } as never)
    jest.mocked(findNewestPublicProfileChatTarget).mockResolvedValue(null)

    await render(<PublicProfileScreen />)
    await fireEvent.press(screen.getByRole('button', { name: 'راسل البائع' }))

    expect(chatApi.createRoom).not.toHaveBeenCalled()
    expect(dialogService.alert).toHaveBeenCalledWith('تعذر فتح المحادثة', 'لم نعثر على إعلان نشط. أعد المحاولة.')
  })

  it('shows a retryable message when room creation fails', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: { id: 'visitor-1' }, isLoading: false } as never)
    jest.mocked(findNewestPublicProfileChatTarget).mockResolvedValue({ entityId: 'car-1', entityType: 'LISTING' })
    jest.mocked(chatApi.createRoom).mockRejectedValue(new Error('temporary failure'))

    await render(<PublicProfileScreen />)
    await fireEvent.press(screen.getByRole('button', { name: 'راسل البائع' }))

    expect(dialogService.alert).toHaveBeenCalledWith('تعذر فتح المحادثة', 'حدث خطأ مؤقت. أعد المحاولة.')
  })

  it('routes a signed-out visitor to login without looking up chat targets', async () => {
    loadSellerProfile()
    mockedUseAuthStore.mockReturnValue({ user: null, isLoading: false } as never)

    await render(<PublicProfileScreen />)
    await fireEvent.press(screen.getByRole('button', { name: 'راسل البائع' }))

    expect(router.push).toHaveBeenCalledWith({ pathname: '/(auth)/login' })
    expect(findNewestPublicProfileChatTarget).not.toHaveBeenCalled()
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
