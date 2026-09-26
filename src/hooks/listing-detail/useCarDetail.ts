import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { CarDetailApi } from '../../types/carDetailApi.types'
import { CarDetailViewModel } from '../../types/carDetailViewModel.types'
import { mapCarDetail } from '../../utils/listing-detail/mapCarDetail'

export type CarDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseCarDetailResult {
  state: CarDetailState
  vm?: CarDetailViewModel
  raw?: CarDetailApi
  error: unknown | null
  refetch: () => Promise<unknown>
}

interface AxiosLikeError {
  response?: {
    status?: number
  }
  code?: string
  message?: string
  isAxiosError?: boolean
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as AxiosLikeError
  return err.response?.status === 404
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as AxiosLikeError
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true
  if (err.message && /network\s*error/i.test(err.message)) return true
  if (err.isAxiosError && !err.response) return true
  return false
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
  const query = useQuery<CarDetailApi, unknown>({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Listing ID is required')
      }
      const res = await listingsApi.getById(id)
      return res.data as unknown as CarDetailApi
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  })

  let state: CarDetailState = 'loading'
  let vm: CarDetailViewModel | undefined
  let raw: CarDetailApi | undefined

  if (!id) {
    state = 'error'
  } else if (query.isLoading) {
    state = 'loading'
  } else if (query.isError) {
    if (isNotFoundError(query.error)) {
      state = 'notFound'
    } else if (isNetworkError(query.error)) {
      state = 'offline'
    } else {
      state = 'error'
    }
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapCarDetail(query.data)
  }

  return {
    state,
    vm,
    raw,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
