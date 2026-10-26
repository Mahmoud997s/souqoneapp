import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'

export const FAVORITE_IDS_QUERY_KEY = ['favorite-ids'] as const

const EMPTY_SET = new Set<string>()

export function useFavoriteIds() {
  let isLoggedIn = false
  try {
    const authState = typeof useAuthStore === 'function' ? useAuthStore((s: any) => s?.isLoggedIn) : false
    isLoggedIn = Boolean(authState)
  } catch {
    isLoggedIn = false
  }

  const query = useQuery({
    queryKey: FAVORITE_IDS_QUERY_KEY,
    queryFn: async () => {
      if (typeof favoritesApi?.ids !== 'function') {
        return new Set<string>()
      }
      const res = await favoritesApi.ids()
      const raw = Array.isArray(res?.data) ? res.data : []
      return new Set<string>(raw)
    },
    enabled: Boolean(isLoggedIn),
    staleTime: 1000 * 60 * 5,
  })

  const ids = useMemo(() => {
    if (!isLoggedIn || !query.data) {
      return EMPTY_SET
    }
    return query.data
  }, [isLoggedIn, query.data])

  return {
    ids,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    data: query.data,
  }
}
