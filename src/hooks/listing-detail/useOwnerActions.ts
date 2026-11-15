import { useMemo, useRef, useState } from 'react'
import type {
  OwnerAction,
  OwnerActionId,
  OwnerBusyAction,
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
  /** Specific action currently in flight, or null */
  busyAction: OwnerBusyAction
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
  const [busyAction, setBusyAction] = useState<OwnerBusyAction>(null)
  const pendingRef = useRef<OwnerBusyAction>(null)

  const busy = busyAction !== null || deleteMutation.isPending || statusMutation.isPending

  const actions = useMemo<OwnerAction[]>(
    () => buildCarOwnerActions(vm.status, vm.listingType),
    [vm.status, vm.listingType]
  )

  const run = async (id: OwnerActionId): Promise<void> => {
    if (id === 'edit') return
    if (pendingRef.current !== null) return

    if (id === 'restore' || id === 'submit') {
      const user = useAuthStore.getState().user
      if (!user?.phone) {
        promptProfilePhoneRequired()
        return
      }
    }

    if (id === 'delete') {
      pendingRef.current = 'delete'
      setBusyAction('delete')
      try {
        await deleteMutation.mutateAsync(vm.id)
      } finally {
        pendingRef.current = null
        setBusyAction(null)
      }
      return
    }

    const backendAction = CAR_STATUS_ACTION[id]
    if (!backendAction) return

    pendingRef.current = id
    setBusyAction(id)
    try {
      await statusMutation.mutateAsync({
        id: vm.id,
        action: backendAction,
        version: vm.version,
      })
    } finally {
      pendingRef.current = null
      setBusyAction(null)
    }
  }

  return {
    actions,
    run,
    busy,
    busyAction,
    viewCount: vm.viewCount ?? 0,
  }
}

export { isOptimisticLockError }
