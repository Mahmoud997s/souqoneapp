import { useQuery } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'
import { EquipmentDetailApi } from '../../types/equipmentDetailApi.types'
import { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'
import { mapEquipmentDetail } from '../../utils/listing-detail/mapEquipmentDetail'
import { equipmentQueryKeys } from '../../utils/listing-detail/equipmentQueryKeys'
import { useAuthStore } from '../../store/authStore'

export type EquipmentDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UseEquipmentDetailResult {
  state: EquipmentDetailState
  vm?: EquipmentDetailViewModel
  raw?: EquipmentDetailApi
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

  const query = useQuery<EquipmentDetailApi, unknown>({
    queryKey: equipmentQueryKeys.detail(id ?? '', Boolean(isLoggedIn)),
    queryFn: async () => {
      if (!id) {
        throw new Error('Equipment listing ID is required')
      }
      const res = await equipmentApi.getById(id)
      return res.data as unknown as EquipmentDetailApi
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  })

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
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
