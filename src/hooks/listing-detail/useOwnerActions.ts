import { useMemo } from 'react'
import type { OwnerActionId } from '../../components/listing-detail/OwnerManageBar'
import { useDeleteCarListing } from './useDeleteCarListing'
import {
  useChangeCarListingStatus,
  type CarListingStatusAction,
} from './useChangeCarListingStatus'
import { isOptimisticLockError } from './useUpdateCarListing'
import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'

// OwnerActionId is the single source of truth — exported from OwnerManageBar.tsx.
// This hook only ever produces/accepts the 8 backend-supported ids.
// markRented/activate remain valid type members (for OwnerManageBar's future use)
// but are never emitted by this hook (TD-44 — no backend support yet).

export interface OwnerAction {
  id: OwnerActionId
  label: string
  tone: 'primary' | 'danger' | 'neutral'
  icon: string
  requiresConfirm: boolean
  /** Dialog title shown to the user before executing the action */
  confirmTitle?: string
  /** Dialog body text shown to the user before executing the action */
  confirmMessage?: string
  /** Text of the confirm button in the dialog */
  confirmLabel?: string
}

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
// Internal constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps each action ID that triggers a status mutation to the backend action
 * string expected by useChangeCarListingStatus / listingsApi.updateStatus.
 *
 * 'edit' and 'delete' are handled separately and are not in this map.
 */
const STATUS_ACTION_MAP: Partial<Record<OwnerActionId, CarListingStatusAction>> = {
  markSold:   'mark-sold',
  archive:    'archive',
  pause:      'archive',      // RENTAL  "إيقاف مؤقت"  → same backend action
  stopSearch: 'archive',      // WANTED  "إيقاف البحث" → same backend action
  restore:    'restore',
  submit:     'submit',
}

// Confirm-dialog wording: sourced from useMyListingsScreen.ts (the existing
// live UI) so all dialogs across the app are consistent.
const GENERIC_STATUS_CONFIRM = 'هل أنت متأكد من تغيير حالة الإعلان؟'
const GENERIC_CONFIRM_TITLE  = 'تأكيد الإجراء'
const GENERIC_CONFIRM_LABEL  = 'تأكيد'

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useOwnerActions
 *
 * Implements the D-19 status-action matrix for car listings:
 *
 * | Status    | listingType | Available actions                              |
 * |-----------|-------------|------------------------------------------------|
 * | ACTIVE    | SALE        | edit · markSold · archive · delete             |
 * | ACTIVE    | RENTAL      | edit · pause · delete                          |
 * | ACTIVE    | WANTED      | edit · stopSearch · delete                     |
 * | ARCHIVED  | any         | edit · restore · delete                        |
 * | SOLD      | any         | delete only                                    |
 * | RENTED    | any         | edit · delete                                  |
 * | SUSPENDED | any         | delete only                                    |
 * | DRAFT     | any         | edit · submit · delete                         |
 *
 * Design decisions:
 * - run('edit') is a NO-OP. Navigation is the caller's responsibility.
 * - This hook NEVER shows dialogs or Alerts — confirmation metadata is exposed
 *   via the `requiresConfirm` / `confirmMessage` fields on each action so the
 *   UI layer (OwnerManageBar) can present them in its own way.
 * - 409 conflicts are re-thrown without modification so callers can detect them
 *   via isOptimisticLockError(error).
 */
export function useOwnerActions(vm: CarDetailViewModel): UseOwnerActionsResult {
  const deleteMutation = useDeleteCarListing()
  const statusMutation = useChangeCarListingStatus()

  const busy = deleteMutation.isPending || statusMutation.isPending

  // ── Action matrix ────────────────────────────────────────────────────────
  const actions = useMemo<OwnerAction[]>(() => {
    const result: OwnerAction[] = []
    const { status, listingType } = vm

    // Edit — allowed for all statuses EXCEPT SOLD and SUSPENDED
    if (status !== 'SOLD' && status !== 'SUSPENDED') {
      result.push({
        id: 'edit',
        label: 'تعديل',
        tone: 'neutral',
        icon: 'create-outline',
        requiresConfirm: false,
      })
    }

    // Status-specific actions
    if (status === 'ACTIVE') {
      if (listingType === 'RENTAL') {
        result.push({
          id: 'pause',
          label: 'إيقاف مؤقت',
          tone: 'neutral',
          icon: 'pause-circle-outline',
          requiresConfirm: true,
          confirmTitle: GENERIC_CONFIRM_TITLE,
          confirmMessage: GENERIC_STATUS_CONFIRM,
          confirmLabel: GENERIC_CONFIRM_LABEL,
        })
      } else if (listingType === 'WANTED') {
        result.push({
          id: 'stopSearch',
          label: 'إيقاف البحث',
          tone: 'neutral',
          icon: 'stop-circle-outline',
          requiresConfirm: true,
          confirmTitle: GENERIC_CONFIRM_TITLE,
          confirmMessage: GENERIC_STATUS_CONFIRM,
          confirmLabel: GENERIC_CONFIRM_LABEL,
        })
      } else {
        // SALE (and any unrecognised future listing type — default to sale behaviour)
        result.push({
          id: 'markSold',
          label: 'تعليم كمباع',
          tone: 'primary',
          icon: 'checkmark-circle-outline',
          requiresConfirm: true,
          confirmTitle: 'تأكيد البيع',
          // markSold is irreversible (D-19: "لا رجعة فيه من المالك").
          // Wording is more explicit than the generic status-change confirm.
          confirmMessage:
            'هل أنت متأكد من تعليم هذا الإعلان كمباع؟ لا يمكن التراجع عن هذا الإجراء لاحقاً.',
          confirmLabel: GENERIC_CONFIRM_LABEL,
        })
        result.push({
          id: 'archive',
          label: 'أرشفة',
          tone: 'neutral',
          icon: 'archive-outline',
          requiresConfirm: true,
          confirmTitle: GENERIC_CONFIRM_TITLE,
          confirmMessage: GENERIC_STATUS_CONFIRM,
          confirmLabel: GENERIC_CONFIRM_LABEL,
        })
      }
    } else if (status === 'ARCHIVED') {
      result.push({
        id: 'restore',
        label: 'استعادة',
        tone: 'primary',
        icon: 'refresh-outline',
        requiresConfirm: true,
        confirmTitle: GENERIC_CONFIRM_TITLE,
        confirmMessage: GENERIC_STATUS_CONFIRM,
        confirmLabel: GENERIC_CONFIRM_LABEL,
      })
    } else if (status === 'DRAFT') {
      result.push({
        id: 'submit',
        label: 'نشر',
        tone: 'primary',
        icon: 'send-outline',
        requiresConfirm: true,
        confirmTitle: GENERIC_CONFIRM_TITLE,
        confirmMessage: 'هل أنت متأكد من نشر هذا الإعلان؟',
        confirmLabel: 'نشر',
      })
    }
    // SOLD, RENTED, SUSPENDED → no status actions (per D-19)

    // Delete — always present regardless of status
    result.push({
      id: 'delete',
      label: 'حذف',
      tone: 'danger',
      icon: 'trash-outline',
      requiresConfirm: true,
      // Exact wording from useMyListingsScreen.ts handleDelete dialog
      confirmTitle: 'حذف الإعلان',
      confirmMessage: 'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
      confirmLabel: 'حذف',
    })

    return result
  }, [vm.status, vm.listingType])

  // ── run ─────────────────────────────────────────────────────────────────
  const run = async (id: OwnerActionId): Promise<void> => {
    // Edit is navigation-only — the caller handles routing.
    if (id === 'edit') return

    if (id === 'delete') {
      await deleteMutation.mutateAsync(vm.id)
      return
    }

    const backendAction = STATUS_ACTION_MAP[id]
    if (!backendAction) return

    // Re-throw as-is so callers can detect 409 via isOptimisticLockError(error)
    // and present: "تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً."
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

// Re-export so consumers don't need to import from useUpdateCarListing directly
export { isOptimisticLockError }
