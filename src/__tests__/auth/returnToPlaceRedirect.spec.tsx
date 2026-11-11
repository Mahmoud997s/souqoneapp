import React from 'react'
import { renderHook, render, fireEvent } from '@testing-library/react-native'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useAuthStore } from '../../store/authStore'
import { CustomTabBar } from '../../../app/(tabs)/_layout'

const mockPush = jest.fn()
const mockReplace = jest.fn()
let mockCurrentPathname = '/'

jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router')
  return {
    ...actual,
    router: {
      push: (...args: any[]) => mockPush(...args),
      replace: (...args: any[]) => mockReplace(...args),
      back: jest.fn(),
    },
    useRouter: () => ({
      push: (...args: any[]) => mockPush(...args),
      replace: (...args: any[]) => mockReplace(...args),
      back: jest.fn(),
    }),
    usePathname: () => mockCurrentPathname,
    useSegments: () => ['(tabs)'],
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

describe('G2 / K8: Return-to-place redirect propagation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentPathname = '/'
    useAuthStore.setState({ user: null, isLoggedIn: false, isGuest: false })
  })

  describe('useAuthGuard', () => {
    it('redirects to login with encoded redirect parameter when on protected screen', async () => {
      mockCurrentPathname = '/cars/new'

      await renderHook(() => useAuthGuard())

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/login?redirect=%2Fcars%2Fnew'
      )
    })

    it('redirects to login without redirect parameter when on root or auth route', async () => {
      mockCurrentPathname = '/'

      await renderHook(() => useAuthGuard())

      expect(mockPush).toHaveBeenCalledWith('/(auth)/login')
    })
  })

  describe('app/(tabs)/_layout.tsx: CustomTabBar handlePost', () => {
    it('redirects to login with redirect to post-category modal when !isLoggedIn', async () => {
      useAuthStore.setState({ isLoggedIn: false })

      const props: any = {
        state: {
          index: 0,
          routes: [
            { key: 'tab-1', name: 'index' },
            { key: 'tab-post', name: 'post' },
          ],
        },
        navigation: { navigate: jest.fn(), emit: jest.fn() },
        descriptors: {
          'tab-1': { options: {} },
          'tab-post': { options: {} },
        },
      }

      const { getByLabelText } = await render(<CustomTabBar {...props} />)
      const fabBtn = getByLabelText('إضافة إعلان')

      fireEvent.press(fabBtn)

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/login?redirect=%2F(modals)%2Fpost-category'
      )
    })
  })
})
