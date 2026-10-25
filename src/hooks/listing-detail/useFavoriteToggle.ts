import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '../../api/favorites'
import { useRequireAuth } from './useRequireAuth'
import { useAuthStore } from '../../store/authStore'

export interface UseFavoriteToggleOptions {
  /** The path to redirect guests to after login. Defaults to `/listings/${id}`. */
  redirectPath?: string
}

export interface UseFavoriteToggleReturn {
  isFavorite: boolean
  isBusy: boolean
  toggle: () => void
}

/**
 * useFavoriteToggle
 * Handles optimistic toggling and server hydration of the favorite state on an entity.
 * - Hydrates true/false state from `GET /favorites/check/:entityType/:id` when the user is logged in.
 * - Flips state immediately for instant UI feedback (optimistic update).
 * - Routes guest users to login via useRequireAuth without invoking the API.
 * - Calls favoritesApi.add (toggle endpoint) and updates query cache on success.
 * - Reverts back to original state on network / server failure.
 * - Treats failed check queries safely as false/unfavorited without crashing.
 * - Ignores stale pending results when entityType or id changes during a request.
 */
export function useFavoriteToggle(
  entityType: string,
  id: string,
  initialIsFavorite: boolean,
  options: UseFavoriteToggleOptions = {}
): UseFavoriteToggleReturn {
  const redirectPath = options.redirectPath ?? `/listings/${id}`
  const [isFavorite, setIsFavorite] = useState<boolean>(initialIsFavorite)
  const [isBusy, setIsBusy] = useState<boolean>(false)

  // Ref to always read latest isFavorite without stale closures
  const isFavoriteRef = useRef<boolean>(isFavorite)
  useEffect(() => {
    isFavoriteRef.current = isFavorite
  }, [isFavorite])

  // Track if user has toggled locally so checkData doesn't override local optimistic state
  const hasUserToggledRef = useRef<boolean>(false)
  const hasHydratedRef = useRef<boolean>(false)

  const currentEntityKey = `${entityType}:${id}`
  const requestKeyRef = useRef<string>(currentEntityKey)
  useEffect(() => {
    requestKeyRef.current = currentEntityKey
  }, [currentEntityKey])

  const initialIsFavoriteRef = useRef<boolean>(initialIsFavorite)
  useEffect(() => {
    initialIsFavoriteRef.current = initialIsFavorite
  }, [initialIsFavorite])

  // Reset local state & hydration flags when entity identity changes
  useEffect(() => {
    hasHydratedRef.current = false
    hasUserToggledRef.current = false
    setIsBusy(false)
    setIsFavorite(initialIsFavoriteRef.current)
    isFavoriteRef.current = initialIsFavoriteRef.current
  }, [entityType, id])

  const queryClient = useQueryClient()
  const { requireAuth } = useRequireAuth()
  const requireAuthRef = useRef(requireAuth)
  useEffect(() => {
    requireAuthRef.current = requireAuth
  }, [requireAuth])

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

  const checkQueryKey = useMemo(
    () => ['favorites', 'check', entityType, id] as const,
    [entityType, id]
  )

  const { data: checkData } = useQuery({
    queryKey: checkQueryKey,
    queryFn: async () => {
      try {
        const res = await favoritesApi.check(entityType, id)
        return res?.data ?? { favorited: false }
      } catch {
        return { favorited: false }
      }
    },
    enabled: Boolean(isLoggedIn && entityType && id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  })

  // Synchronize state when server check query resolves (only if user hasn't toggled yet)
  useEffect(() => {
    if (!hasUserToggledRef.current && !hasHydratedRef.current && checkData && typeof checkData.favorited === 'boolean') {
      hasHydratedRef.current = true
      setIsFavorite(checkData.favorited)
      isFavoriteRef.current = checkData.favorited
    }
  }, [checkData])

  const toggle = useCallback(() => {
    if (isBusy) return

    requireAuthRef.current(redirectPath, () => {
      hasUserToggledRef.current = true
      const activeKey = currentEntityKey
      const prev = isFavoriteRef.current
      const next = !prev

      isFavoriteRef.current = next
      setIsFavorite(next)
      setIsBusy(true)

      favoritesApi
        .add(entityType, id)
        .then((res) => {
          if (requestKeyRef.current !== activeKey) return
          const serverFavorited = typeof res?.data?.favorited === 'boolean' ? res.data.favorited : next
          queryClient.setQueryData(checkQueryKey, { favorited: serverFavorited })
          isFavoriteRef.current = serverFavorited
          setIsFavorite(serverFavorited)
          queryClient.invalidateQueries({ queryKey: ['favorites'] })
        })
        .catch(() => {
          if (requestKeyRef.current !== activeKey) return
          isFavoriteRef.current = prev
          setIsFavorite(prev)
        })
        .finally(() => {
          if (requestKeyRef.current === activeKey) {
            setIsBusy(false)
          }
        })
    })
  }, [entityType, id, redirectPath, isBusy, queryClient, checkQueryKey, currentEntityKey])

  return {
    isFavorite,
    isBusy,
    toggle,
  }
}

