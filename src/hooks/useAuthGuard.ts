import { useEffect } from 'react'
import { router, usePathname } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { resolveRedirect } from '../utils/listing-detail/safeRedirect'

export function useAuthGuard() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      if (pathname && pathname !== '/' && !pathname.startsWith('/(auth)')) {
        const safe = resolveRedirect(pathname)
        router.push(`/(auth)/login?redirect=${encodeURIComponent(safe)}` as any)
      } else {
        router.push('/(auth)/login' as any)
      }
    }
  }, [user, pathname])

  return { user, isAuthenticated: !!user }
}
