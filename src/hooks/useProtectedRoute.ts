import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export function useProtectedRoute() {
  const { isLoggedIn } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/(auth)/login')
    }
  }, [isLoggedIn])

  return isLoggedIn
}
