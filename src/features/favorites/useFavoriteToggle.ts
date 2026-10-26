import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '../../api/favorites'
import { useRequireAuth } from '../../hooks/listing-detail/useRequireAuth'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import { toastService } from '../../store/toastStore'
import { favoriteKey } from './favoriteEntityTypes'
import { useFavoriteIds, FAVORITE_IDS_QUERY_KEY } from './useFavoriteIds'

export interface UseFavoriteToggleOptions {
  /** The path to redirect guests to after login. Defaults to `/listings/${id}`. */
  redirectPath?: string
  /** The listing / item title to display in the success toast */
  title?: string
}

export interface UseFavoriteToggleReturn {
  isFavorite: boolean
  isBusy: boolean
  toggle: () => void
}

const inFlightKeys = new Set<string>()

export function useFavoriteToggle(
  entityType: string | null | undefined,
  id: string | null | undefined,
  initialIsFavorite: boolean = false,
  options: UseFavoriteToggleOptions = {}
): UseFavoriteToggleReturn {
  const resolvedType = entityType ?? ''
  const resolvedId = id ?? ''
  const redirectPath = options.redirectPath ?? `/listings/${resolvedId}`

  const currentEntityKey = useMemo(
    () => (resolvedType && resolvedId ? favoriteKey(resolvedType, resolvedId) : ''),
    [resolvedType, resolvedId]
  )

  const [optimisticFav, setOptimisticFav] = useState<boolean | null>(null)
  const [isBusy, setIsBusy] = useState<boolean>(false)

  const { ids, data: idsData } = useFavoriteIds()

  const hasUserToggledRef = useRef<boolean>(false)
  const requestKeyRef = useRef<string>(currentEntityKey)
  const initialIsFavoriteRef = useRef<boolean>(initialIsFavorite)

  useEffect(() => {
    requestKeyRef.current = currentEntityKey
  }, [currentEntityKey])

  useEffect(() => {
    initialIsFavoriteRef.current = initialIsFavorite
  }, [initialIsFavorite])

  // Reset local state when entity identity changes
  useEffect(() => {
    hasUserToggledRef.current = false
    setIsBusy(false)
    setOptimisticFav(null)
  }, [currentEntityKey])

  const queryClient = useQueryClient()
  const { requireAuth } = useRequireAuth()
  const requireAuthRef = useRef(requireAuth)
  useEffect(() => {
    requireAuthRef.current = requireAuth
  }, [requireAuth])

  let isLoggedIn = false
  try {
    const authState = typeof useAuthStore === 'function' ? useAuthStore((s: any) => s?.isLoggedIn) : false
    isLoggedIn = Boolean(authState)
  } catch {
    isLoggedIn = false
  }

  // Compute single source of truth favorite state (D-092e)
  // State = optimistic (in-flight) ?? shared ids store when loaded ?? initialIsFavorite
  const isFavorite = useMemo(() => {
    if (optimisticFav !== null) {
      return optimisticFav
    }
    if (isLoggedIn && idsData !== undefined && currentEntityKey) {
      return ids.has(currentEntityKey)
    }
    return initialIsFavoriteRef.current
  }, [optimisticFav, isLoggedIn, idsData, currentEntityKey, ids])

  const isFavoriteRef = useRef<boolean>(isFavorite)
  useEffect(() => {
    isFavoriteRef.current = isFavorite
  }, [isFavorite])

  const titleRef = useRef(options.title)
  useEffect(() => {
    titleRef.current = options.title
  }, [options.title])

  const toggle = useCallback(() => {
    if (!resolvedType || !resolvedId || !currentEntityKey) {
      return
    }
    if (isBusy || inFlightKeys.has(currentEntityKey)) {
      return
    }

    requireAuthRef.current(redirectPath, () => {
      const activeKey = currentEntityKey
      if (inFlightKeys.has(activeKey)) {
        return
      }

      inFlightKeys.add(activeKey)
      hasUserToggledRef.current = true
      setIsBusy(true)

      const prevFav = isFavoriteRef.current
      const nextFav = !prevFav

      setOptimisticFav(nextFav)
      isFavoriteRef.current = nextFav

      // Optimistic update of ['favorite-ids']
      const prevIds = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY)
      const nextIds = new Set<string>(prevIds ?? [])
      if (nextFav) {
        nextIds.add(activeKey)
      } else {
        nextIds.delete(activeKey)
      }
      queryClient.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, nextIds)

      favoritesApi
        .add(resolvedType, resolvedId)
        .then((res) => {
          if (requestKeyRef.current !== activeKey) return
          const serverFavorited =
            typeof res?.data?.favorited === 'boolean' ? res.data.favorited : nextFav

          // Write confirmed value into ['favorite-ids'] cache Set by serverFavorited
          const currentCache = queryClient.getQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY)
          const updatedCache = new Set<string>(currentCache ?? [])
          if (serverFavorited) {
            updatedCache.add(activeKey)
          } else {
            updatedCache.delete(activeKey)
          }
          queryClient.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, updatedCache)
          isFavoriteRef.current = serverFavorited

          if (serverFavorited) {
            toastService.show({
              kind: 'success',
              title: 'تمت إضافة الإعلان إلى المفضلة',
              message: titleRef.current,
            })
          } else {
            toastService.show({
              kind: 'neutral',
              title: 'تمت إزالة الإعلان من المفضلة',
              message: titleRef.current,
            })
          }
        })
        .catch(() => {
          if (requestKeyRef.current !== activeKey) return
          // Restore prevIds on failure
          isFavoriteRef.current = prevFav
          queryClient.setQueryData<Set<string>>(FAVORITE_IDS_QUERY_KEY, prevIds)
          dialogService.alert('خطأ', 'تعذّر تحديث المفضلة، حاول مرة أخرى')
        })
        .finally(() => {
          inFlightKeys.delete(activeKey)
          if (requestKeyRef.current === activeKey) {
            setIsBusy(false)
            // Clear local override so isFavorite derives strictly from shared ids store
            setOptimisticFav(null)
          }
          queryClient.invalidateQueries({ queryKey: FAVORITE_IDS_QUERY_KEY })
          queryClient.invalidateQueries({ queryKey: ['favorites'] })
        })
    })
  }, [resolvedType, resolvedId, currentEntityKey, isBusy, redirectPath, queryClient])

  return {
    isFavorite,
    isBusy,
    toggle,
  }
}
