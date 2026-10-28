import { useQuery, useQueryClient } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { BusDetailApi } from '../../types/busDetailApi.types'
import { BusDetailViewModel } from '../../types/busDetailViewModel.types'
import { mapBusDetail } from '../../utils/listing-detail/mapBusDetail'
import { busQueryKeys } from '../../utils/listing-detail/busQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { getDetailErrorKind, DetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'

export type BusDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseBusDetailResult {
  state: BusDetailState
  vm?: BusDetailViewModel
  raw?: BusDetailApi
  error: unknown | null
  errorKind: DetailErrorKind
  isRefetchError: boolean
  refetch: () => Promise<unknown>
}

/**
 * Custom hook managing the fetch, error classification, and ViewModel transformation
 * for the Bus Detail screen.
 *
 * Query Key: ['bus-detail', id]
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into BusDetailViewModel
 * - 'notFound': HTTP 404 returned from API
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function useBusDetail(
  id: string | undefined | null,
  options?: { now?: Date }
): UseBusDetailResult {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const queryClient = useQueryClient()
  const disableRetry = queryClient.getDefaultOptions().queries?.retry === false

  const query = useQuery<BusDetailApi, unknown>({
    queryKey: busQueryKeys.detail(id ?? '', Boolean(isLoggedIn)),
    queryFn: async ({ signal }) => {
      if (!id) {
        throw new Error('Bus listing ID is required')
      }
      const res = await busesApi.getById(id, { timeout: 15_000, signal })
      return res.data as unknown as BusDetailApi
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
    retry: disableRetry ? false : 1,
  })

  const errorKind = getDetailErrorKind(query.error)
  const isRefetchError = Boolean(query.data) && Boolean(query.isRefetchError)

  let state: BusDetailState = 'loading'
  let vm: BusDetailViewModel | undefined
  let raw: BusDetailApi | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapBusDetail(query.data, {
      isAuthenticated: Boolean(isLoggedIn),
      now: options?.now,
    })
  } else if (query.isLoading) {
    state = 'loading'
  } else if (query.isError) {
    if (errorKind === 'notFound') {
      state = 'notFound'
    } else if (errorKind === 'offline') {
      state = 'offline'
    } else {
      state = 'error'
    }
  }

  return {
    state,
    vm,
    raw,
    error: query.error ?? null,
    errorKind,
    isRefetchError,
    refetch: query.refetch,
  }
}
