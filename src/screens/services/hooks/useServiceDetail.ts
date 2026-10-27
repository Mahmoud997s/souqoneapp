import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../../../api/services'
import type { Service } from '../../../types/listing.types'
import type { ServiceDetailViewModel } from '../../../types/serviceDetailViewModel.types'
import { mapServiceDetailViewModel } from '../mappers/serviceDetailViewModel'
import { serviceQueryKeys } from './serviceQueryKeys'
import { useAuthStore } from '../../../store/authStore'

export type ServiceDetailState =
  | 'loading'
  | 'ready'
  | 'notFound'
  | 'offline'
  | 'error'

export interface UseServiceDetailResult {
  state: ServiceDetailState
  vm?: ServiceDetailViewModel
  raw?: Service
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
 * Custom hook managing fetch, error classification, and ViewModel transformation
 * for the Car Service Detail screen.
 *
 * Query Key: ['services-detail', id, 'auth' | 'guest']
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into ServiceDetailViewModel
 * - 'notFound': HTTP 404 returned from API (soft-deleted, hidden, or non-existent)
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function useServiceDetail(
  id: string | undefined | null,
  options?: { now?: Date }
): UseServiceDetailResult {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const query = useQuery<Service, unknown>({
    queryKey: serviceQueryKeys.detail(id ?? '', Boolean(isLoggedIn)),
    queryFn: async () => {
      if (!id) {
        throw new Error('Service listing ID is required')
      }
      const res = await servicesApi.getById(id)
      return res.data
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  })

  let state: ServiceDetailState = 'loading'
  let vm: ServiceDetailViewModel | undefined
  let raw: Service | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapServiceDetailViewModel(query.data, {
      now: options?.now,
    })
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
  }

  return {
    state,
    vm,
    raw,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  }
}
