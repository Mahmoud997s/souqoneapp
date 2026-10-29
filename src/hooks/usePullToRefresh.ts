import {
  useDetailRefresh,
  DetailRefetchFn,
  UseDetailRefreshResult,
} from './listing-detail/useDetailRefresh'

export type PullToRefreshFn = DetailRefetchFn
export type UsePullToRefreshResult = UseDetailRefreshResult

/**
 * usePullToRefresh
 *
 * Neutral alias for `useDetailRefresh` suitable for list screens (e.g. favorites, search)
 * and detail screens alike, preserving the exact same lifecycle, deduplication,
 * and safe unmount logic.
 */
export const usePullToRefresh = useDetailRefresh
export { useDetailRefresh }
