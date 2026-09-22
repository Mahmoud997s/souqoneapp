import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/authStore'

export interface UseRequireAuthReturn {
  requireAuth: (redirectPath: string, then: () => void) => void
}

/**
 * useRequireAuth
 * Gating hook that executes protected actions immediately if the user is authenticated,
 * or navigates guest users to login carrying the redirect path as a query parameter.
 *
 * Note on task boundary: The login screens currently navigate to /(tabs).
 * The actual return-and-resume flow depends on login screens accepting and consuming
 * this parameter, which is separate auth flow work; this hook routes guests there correctly.
 */
export function useRequireAuth(): UseRequireAuthReturn {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()

  const requireAuth = useCallback(
    (redirectPath: string, then: () => void) => {
      if (isLoggedIn) {
        then()
        return
      }

      const encodedRedirect = encodeURIComponent(redirectPath)
      router.push(`/(auth)/login?redirect=${encodedRedirect}` as any)
    },
    [isLoggedIn, router]
  )

  return { requireAuth }
}
