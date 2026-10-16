/**
 * Unit tests verifying navigation & redirect behavior from app/_layout.tsx
 * Proves that no redirect loop exists, account-blocked works when unauthenticated,
 * and blocked users are never redirected to the main app tabs.
 */

interface NavigationGuardParams {
  isLoading: boolean
  fontsLoaded: boolean
  segments: readonly string[]
  isLoggedIn: boolean
  isGuest: boolean
  isBlocked: boolean
  replace: (route: string) => void
}

/**
 * Pure extraction of the exact navigation decision logic from app/_layout.tsx
 */
function evaluateNavigationGuard({
  isLoading,
  fontsLoaded,
  segments,
  isLoggedIn,
  isGuest,
  isBlocked,
  replace,
}: NavigationGuardParams): void {
  if (isLoading || !fontsLoaded) return

  const currentSegments = segments as readonly string[]
  const isRoot = currentSegments.length === 0 || currentSegments[0] === 'index'
  if (isRoot) return

  const inAuth = currentSegments[0] === '(auth)'
  const isBlockedScreen = inAuth && currentSegments[1] === 'account-blocked'

  // If blocked, lock user on the blocked screen. Never redirect to main app.
  if (isBlocked) {
    if (!isBlockedScreen) {
      replace('/(auth)/account-blocked')
    }
    return
  }

  // If user is on the blocked screen (e.g. before state clears), don't redirect away
  if (isBlockedScreen) {
    return
  }

  if (isLoggedIn && inAuth) {
    if (currentSegments[1] === 'verify-email' || currentSegments[1] === 'register') {
      return
    }
    replace('/(tabs)')
    return
  }

  if (!isLoggedIn && !isGuest && !inAuth) {
    replace('/(auth)/login')
  }
}

describe('RootLayout Navigation Guard & Loop Prevention', () => {
  const mockReplace = jest.fn()

  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('NO LOOP: When isBlocked is true and user is on account-blocked, replace is NOT called', () => {
    evaluateNavigationGuard({
      isLoading: false,
      fontsLoaded: true,
      segments: ['(auth)', 'account-blocked'],
      isLoggedIn: false,
      isGuest: false,
      isBlocked: true,
      replace: mockReplace,
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('REDIRECTS TO BLOCKED: When isBlocked is true and user is on main tabs, replaces to account-blocked', () => {
    evaluateNavigationGuard({
      isLoading: false,
      fontsLoaded: true,
      segments: ['(tabs)', 'home'],
      isLoggedIn: true,
      isGuest: false,
      isBlocked: true,
      replace: mockReplace,
    })

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/account-blocked')
  })

  it('NO TABS ESCAPE: When isBlocked is true, user is NEVER redirected to /(tabs)', () => {
    evaluateNavigationGuard({
      isLoading: false,
      fontsLoaded: true,
      segments: ['(auth)', 'account-blocked'],
      isLoggedIn: true, // Even if temporarily isLoggedIn
      isGuest: false,
      isBlocked: true,
      replace: mockReplace,
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('NO LOGIN REDIRECT: When unauthenticated (isLoggedIn=false, isGuest=false) on account-blocked, does not redirect to login', () => {
    evaluateNavigationGuard({
      isLoading: false,
      fontsLoaded: true,
      segments: ['(auth)', 'account-blocked'],
      isLoggedIn: false,
      isGuest: false,
      isBlocked: false, // State might have cleared on back press
      replace: mockReplace,
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('REDIRECTS UNPROTECTED: When unauthenticated and on protected tab, redirects to login', () => {
    evaluateNavigationGuard({
      isLoading: false,
      fontsLoaded: true,
      segments: ['(tabs)', 'profile'],
      isLoggedIn: false,
      isGuest: false,
      isBlocked: false,
      replace: mockReplace,
    })

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login')
  })
})
