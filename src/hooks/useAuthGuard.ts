import { useEffect } from 'react'
import { router, usePathname } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { resolveRedirect } from '../utils/listing-detail/safeRedirect'
import { loginRoute } from '../navigation/listingRoutes'

export function useAuthGuard() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      if (pathname && pathname !== '/' && !pathname.startsWith('/(auth)')) {
        const safe = resolveRedirect(pathname)
        router.push(loginRoute(safe))
      } else {
        router.push(loginRoute())
      }
    }
  }, [user, pathname])

  return { user, isAuthenticated: !!user }
}
