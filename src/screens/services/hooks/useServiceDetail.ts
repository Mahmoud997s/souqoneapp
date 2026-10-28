import { useService } from '../../../hooks/useServices'
import type { Service } from '../../../types/listing.types'
import type { ServiceDetailViewModel } from '../../../types/serviceDetailViewModel.types'
import { mapServiceDetailViewModel } from '../mappers/serviceDetailViewModel'
import { getDetailErrorKind, DetailErrorKind } from '../../../utils/listing-detail/getDetailErrorKind'

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
  errorKind: DetailErrorKind
  isRefetchError: boolean
  refetch: () => Promise<unknown>
  isRefetching?: boolean
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
  const errorKind = getDetailErrorKind(query.error)
  const isRefetchError = Boolean(query.data) && Boolean(query.isRefetchError)

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
    error: (query.error as unknown) ?? null,
    errorKind,
    isRefetchError,
    refetch: typeof query.refetch === 'function' ? query.refetch : async () => query.data,
    isRefetching: Boolean(query.isRefetching),
  }
}
