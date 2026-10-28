import { useState, useCallback, useRef, useEffect } from 'react'

export type DetailRefetchFn = () => Promise<unknown> | unknown

export interface UseDetailRefreshResult {
  refreshing: boolean
  onRefresh: () => Promise<void>
}

/**
 * useDetailRefresh
 *
 * Shared hook for pull-to-refresh on listing detail screens.
 * - `refreshing` is true ONLY while the user-triggered refetch runs
 *   (not tied to React Query's background `isFetching` / `isRefetching`).
 * - Swallows refetch errors (the screen's error state handles query errors).
 * - Always resets `refreshing` to false in `finally`.
 * - Guards against double pulls while already in-flight.
 * - Guards against calling setState after component unmount.
 */
export function useDetailRefresh(refetch?: DetailRefetchFn | null): UseDetailRefreshResult {
  const [refreshing, setRefreshing] = useState(false)
  const isMountedRef = useRef(true)
  const isBusyRef = useRef(false)
  const refetchRef = useRef(refetch)

  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const onRefresh = useCallback(async () => {
    // Guard against double pulls while already in-flight
    if (isBusyRef.current) return
    isBusyRef.current = true

    if (isMountedRef.current) {
      setRefreshing(true)
    }

    try {
      if (refetchRef.current) {
        await refetchRef.current()
      }
    } catch {
      // Swallowed: the screen's error state handles query errors
    } finally {
      isBusyRef.current = false
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }, [])

  return { refreshing, onRefresh }
}
