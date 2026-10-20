import { useQuery } from '@tanstack/react-query'
import { busesApi } from '../../api/buses'
import { BusDetailApi } from '../../types/busDetailApi.types'
import { BusDetailViewModel } from '../../types/busDetailViewModel.types'
import { mapBusDetail } from '../../utils/listing-detail/mapBusDetail'
import { busQueryKeys } from '../../utils/listing-detail/busQueryKeys'
import { useAuthStore } from '../../store/authStore'

export type BusDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseBusDetailResult {
  state: BusDetailState
  vm?: BusDetailViewModel
  raw?: BusDetailApi
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

  const query = useQuery<BusDetailApi, unknown>({
    queryKey: busQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Bus listing ID is required')
      }
      const res = await busesApi.getById(id)
      return res.data as unknown as BusDetailApi
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  })

  let state: BusDetailState = 'loading'
  let vm: BusDetailViewModel | undefined
  let raw: BusDetailApi | undefined

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
    vm = mapBusDetail(query.data, {
      isAuthenticated: Boolean(isLoggedIn),
      now: options?.now,
    })
  }

  return {
    state,
    vm,
    raw,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
