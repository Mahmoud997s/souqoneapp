import { useEffect } from 'react'
import { router, usePathname } from 'expo-router'
import { useAuthStore } from '../store/authStore'

export function useAuthGuard() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      // Optional: Store the path to redirect back later if supported by login
      // useAuthStore.getState().setRedirectPath(pathname)
      router.push('/login')
    }
  }, [user, pathname])

  return { user, isAuthenticated: !!user }
}
