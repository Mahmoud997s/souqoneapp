import { useService } from '../../../hooks/useServices'
import type { Service } from '../../../types/listing.types'
import type { ServiceDetailViewModel } from '../../../types/serviceDetailViewModel.types'
import { mapServiceDetailViewModel } from '../mappers/serviceDetailViewModel'

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
 */
export function useServiceDetail(
  id: string | undefined | null,
  options?: { now?: Date }
): UseServiceDetailResult {
  const query = useService(id ?? '')

  let state: ServiceDetailState = 'loading'
  let vm: ServiceDetailViewModel | undefined
  let raw: Service | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data as Service
    vm = mapServiceDetailViewModel(query.data as Service, {
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
    refetch: typeof query.refetch === 'function' ? query.refetch : async () => query.data,
  }
}
