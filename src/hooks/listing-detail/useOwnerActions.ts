import { useMemo } from 'react'
import type {
  OwnerAction,
  OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'
import { useDeleteCarListing } from './useDeleteCarListing'
import { useChangeCarListingStatus } from './useChangeCarListingStatus'
import { isOptimisticLockError } from './useUpdateCarListing'
import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'
import {
  buildCarOwnerActions,
  CAR_STATUS_ACTION,
} from '../../utils/listing-detail/ownerActionMatrix'

export type { OwnerAction }

export interface UseOwnerActionsResult {
  /** Ordered list of available actions for the current vm state */
  actions: OwnerAction[]
  /**
   * Executes the given action.
   *
   * - `'edit'` is a no-op here — the caller (screen/component) is responsible
   *   for navigation. This hook only manages server mutations.
   * - Throws on failure. 409 conflicts are re-thrown as-is so the caller can
   *   detect them via `isOptimisticLockError(error)` and present:
   *   "تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً."
   */
  run: (id: OwnerActionId) => Promise<void>
  /** True while any mutation is in flight */
  busy: boolean
  /** Passthrough from vm.viewCount for the OwnerManageBar */
  viewCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useOwnerActions
 *
 * Implements the D-19 status-action matrix for car listings via buildCarOwnerActions.
 */
export function useOwnerActions(vm: CarDetailViewModel): UseOwnerActionsResult {
  const deleteMutation = useDeleteCarListing()
  const statusMutation = useChangeCarListingStatus()

  const busy = deleteMutation.isPending || statusMutation.isPending

  const actions = useMemo<OwnerAction[]>(
    () => buildCarOwnerActions(vm.status, vm.listingType),
    [vm.status, vm.listingType]
  )

  const run = async (id: OwnerActionId): Promise<void> => {
    if (id === 'edit') return

    if (id === 'restore' || id === 'submit') {
      const user = useAuthStore.getState().user
      if (!user?.phone) {
        promptProfilePhoneRequired()
        return
      }
    }

    if (id === 'delete') {
      await deleteMutation.mutateAsync(vm.id)
      return
    }

    const backendAction = CAR_STATUS_ACTION[id]
    if (!backendAction) return

    await statusMutation.mutateAsync({
      id: vm.id,
      action: backendAction,
      version: vm.version,
    })
  }

  return {
    actions,
    run,
    busy,
    viewCount: vm.viewCount ?? 0,
  }
}

export { isOptimisticLockError }
