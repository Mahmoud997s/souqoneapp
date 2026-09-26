import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { useRequireAuth } from './useRequireAuth'
import { useAuthStore } from '../../store/authStore'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

function TestHarness({
  redirectPath = '/listings/car-123',
  onThen,
}: {
  redirectPath?: string
  onThen: () => void
}) {
  const { requireAuth } = useRequireAuth()

  return React.createElement(
    View,
    null,
    React.createElement(
      TouchableOpacity,
      {
        testID: 'auth-btn',
        onPress: () => requireAuth(redirectPath, onThen),
      },
      React.createElement(Text, null, 'Execute Action')
    )
  )
}

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ isLoggedIn: false, user: null })
  })

  it('calls then callback immediately when user is logged in, without navigation', async () => {
    useAuthStore.setState({ isLoggedIn: true, user: { id: 'u1' } as any })
    const mockThen = jest.fn()

    await render(React.createElement(TestHarness, { onThen: mockThen }))
    fireEvent.press(screen.getByTestId('auth-btn'))

    expect(mockThen).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects to login with redirect param and does NOT call then callback when user is a guest', async () => {
    useAuthStore.setState({ isLoggedIn: false, user: null })
    const mockThen = jest.fn()

    await render(React.createElement(TestHarness, { onThen: mockThen }))
    fireEvent.press(screen.getByTestId('auth-btn'))

    expect(mockThen).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2Flistings%2Fcar-123')
  })
})
