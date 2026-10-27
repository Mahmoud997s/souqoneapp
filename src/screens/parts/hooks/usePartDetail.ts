import { useQuery } from '@tanstack/react-query'
import { partsApi } from '../../../api/parts'
import { Part } from '../../../types/listing.types'
import { PartDetailViewModel } from '../../../types/partDetailViewModel.types'
import { mapPartDetailViewModel } from '../mappers/partDetailViewModel'
import { partQueryKeys } from './partQueryKeys'
import { useAuthStore } from '../../../store/authStore'

export type PartDetailState = 'loading' | 'ready' | 'notFound' | 'offline' | 'error'

export interface UsePartDetailResult {
  state: PartDetailState
  vm?: PartDetailViewModel
  raw?: Part
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
 * for the Spare Part Detail screen.
 *
 * Query Key: ['parts-detail', id, 'auth' | 'guest']
 * States:
 * - 'loading': initial fetch in progress
 * - 'ready': data successfully fetched and transformed into PartDetailViewModel
 * - 'notFound': HTTP 404 returned from API (soft-deleted, hidden, or non-existent)
 * - 'offline': Network disconnection or timeout
 * - 'error': Any other server or client error
 */
export function usePartDetail(
  id: string | undefined | null,
  options?: { now?: Date }
): UsePartDetailResult {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const query = useQuery<Part, unknown>({
    queryKey: partQueryKeys.detail(id ?? '', Boolean(isLoggedIn)),
    queryFn: async () => {
      if (!id) {
        throw new Error('Part listing ID is required')
      }
      const res = await partsApi.getById(id)
      return res.data
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  })

  let state: PartDetailState = 'loading'
  let vm: PartDetailViewModel | undefined
  let raw: Part | undefined

  if (!id) {
    state = 'error'
  } else if (query.data) {
    state = 'ready'
    raw = query.data
    vm = mapPartDetailViewModel(query.data, {
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
