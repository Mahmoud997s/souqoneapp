import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '../../api/favorites'
import { useRequireAuth } from './useRequireAuth'

export interface UseFavoriteToggleReturn {
  isFavorite: boolean
  isBusy: boolean
  toggle: () => void
}

/**
 * useFavoriteToggle
 * Handles optimistic toggling of the favorite state on an entity.
 * - Flips state immediately for instant UI feedback.
 * - Routes guest users to login via useRequireAuth without invoking the API.
 * - Calls favoritesApi.add and invalidates ['favorites'] on success.
 * - Reverts back to original state on network / server failure.
 */
export function useFavoriteToggle(
  entityType: string,
  id: string,
  initialIsFavorite: boolean
): UseFavoriteToggleReturn {
  const [isFavorite, setIsFavorite] = useState<boolean>(initialIsFavorite)
  const [isBusy, setIsBusy] = useState<boolean>(false)

  const queryClient = useQueryClient()
  const { requireAuth } = useRequireAuth()

  const toggle = useCallback(() => {
    if (isBusy) return

    requireAuth(`/listings/${id}`, () => {
      const prev = isFavorite
      const next = !prev

      setIsFavorite(next)
      setIsBusy(true)

      favoritesApi
        .add(entityType, id)
        .then(() => queryClient.invalidateQueries({ queryKey: ['favorites'] }))
        .catch(() => {
          setIsFavorite(prev)
        })
        .finally(() => {
          setIsBusy(false)
        })
    })
  }, [entityType, id, isFavorite, isBusy, queryClient, requireAuth])

  return {
    isFavorite,
    isBusy,
    toggle,
  }
}
