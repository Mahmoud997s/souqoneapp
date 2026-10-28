import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { CarDetailApi } from '../../types/carDetailApi.types'
import { CarDetailViewModel } from '../../types/carDetailViewModel.types'
import { mapCarDetail } from '../../utils/listing-detail/mapCarDetail'
import { getDetailErrorKind, DetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'

export type CarDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseCarDetailResult {
  state: CarDetailState
  vm?: CarDetailViewModel
  raw?: CarDetailApi
  error: unknown | null
  errorKind: DetailErrorKind
  isRefetchError: boolean
  refetch: () => Promise<unknown>
}

/**
 * Custom hook managing the fetch, error classification, and ViewModel transformation
 * for the Car Detail screen.
 *
 * Query Key: ['listing', id]
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into CarDetailViewModel
 * - 'notFound': HTTP 404 returned from API
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function useCarDetail(id: string | undefined | null): UseCarDetailResult {
  const queryClient = useQueryClient()
  const disableRetry = queryClient.getDefaultOptions().queries?.retry === false

  const query = useQuery<CarDetailApi, unknown>({
    queryKey: ['listing', id],
    queryFn: async ({ signal }) => {
      if (!id) {
        throw new Error('Listing ID is required')
      }
      const res = await listingsApi.getById(id, { timeout: 15_000, signal })
      return res.data as unknown as CarDetailApi
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
    retry: disableRetry ? false : 1,
  })

  const errorKind = getDetailErrorKind(query.error)
  const isRefetchError = Boolean(query.data) && Boolean(query.isRefetchError)

  let state: CarDetailState = 'loading'
  let vm: CarDetailViewModel | undefined
  let raw: CarDetailApi | undefined

  if (!id) {
    state = 'error'
  } else if (errorKind === 'notFound') {
    state = 'notFound'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapCarDetail(query.data)
  } else if (query.isLoading) {
    state = 'loading'
  } else if (query.isError) {
    if (errorKind === 'offline') {
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
