import { useQuery, useQueryClient } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'
import { EquipmentDetailApi } from '../../types/equipmentDetailApi.types'
import { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'
import { mapEquipmentDetail } from '../../utils/listing-detail/mapEquipmentDetail'
import { equipmentQueryKeys } from '../../utils/listing-detail/equipmentQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { getDetailErrorKind, DetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'

export type EquipmentDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseEquipmentDetailResult {
  state: EquipmentDetailState
  vm?: EquipmentDetailViewModel
  raw?: EquipmentDetailApi
  error: unknown | null
  errorKind: DetailErrorKind
  isRefetchError: boolean
  refetch: () => Promise<unknown>
}

/**
 * Custom hook managing fetch, error classification, and ViewModel transformation
 * for the Equipment Detail screen.
 *
 * Query Key: ['equipment-detail', id, 'auth' | 'guest']
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into EquipmentDetailViewModel
 * - 'notFound': HTTP 404 returned from API (soft-deleted, hidden, or non-existent)
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function useEquipmentDetail(
  id: string | undefined | null,
  options?: { now?: Date }
): UseEquipmentDetailResult {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const queryClient = useQueryClient()
  const disableRetry = queryClient.getDefaultOptions().queries?.retry === false

  const query = useQuery<EquipmentDetailApi, unknown>({
    queryKey: equipmentQueryKeys.detail(id ?? '', Boolean(isLoggedIn)),
    queryFn: async ({ signal }) => {
      if (!id) {
        throw new Error('Equipment listing ID is required')
      }
      const res = await equipmentApi.getById(id, { timeout: 15_000, signal })
      return res.data as unknown as EquipmentDetailApi
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
    retry: disableRetry ? false : 1,
  })

  const errorKind = getDetailErrorKind(query.error)
  const isRefetchError = Boolean(query.data) && Boolean(query.isRefetchError)

  let state: EquipmentDetailState = 'loading'
  let vm: EquipmentDetailViewModel | undefined
  let raw: EquipmentDetailApi | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapEquipmentDetail(query.data, {
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
