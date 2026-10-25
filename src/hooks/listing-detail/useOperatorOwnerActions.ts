import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  OwnerAction,
  OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'
import type { OperatorDetailViewModel } from '../../types/operatorDetailViewModel.types'
import { equipmentApi } from '../../api/equipment'
import { invalidateOperatorListingQueries } from '../../utils/listing-detail/operatorQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'

export type { OwnerAction }

export interface UseOperatorOwnerActionsResult {
  actions: OwnerAction[]
  run: (id: OwnerActionId) => Promise<void>
  busy: boolean
  viewCount: number
}

const DELETE_CONFIRM_TITLE = 'طلب حذف إعلان المشغل'
const DELETE_CONFIRM_MSG =
  'سيتم تقديم طلب حذف الإعلان إلى إدارة التطبيق لمراجعته. يمكنك إلغاء الطلب خلال 24 ساعة إذا غيّرت رأيك.'
const DELETE_CONFIRM_LABEL = 'تقديم طلب الحذف'

const CANCEL_DELETE_CONFIRM_TITLE = 'إلغاء طلب الحذف'
const CANCEL_DELETE_CONFIRM_MSG = 'هل تريد إلغاء طلب الحذف وإبقاء إعلان المشغل نشطاً في التطبيق؟'
const CANCEL_DELETE_CONFIRM_LABEL = 'إلغاء طلب الحذف'

export function useOperatorOwnerActions(
  vm: OperatorDetailViewModel | null | undefined
): UseOperatorOwnerActionsResult {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const user = useAuthStore((s) => s.user)

  const isOwner = Boolean(user?.id && vm?.seller.id && user.id === vm.seller.id)
  const hasPendingDeletion = Boolean(vm?.pendingDeletion)

  const actions = useMemo<OwnerAction[]>(() => {
    if (!vm || !isOwner) return []

    // Base edit action is always available for owner
    const list: OwnerAction[] = [
      {
        id: 'edit',
        label: 'تعديل',
        tone: 'neutral',
        icon: 'create-outline',
        requiresConfirm: false,
      },
    ]

    if (hasPendingDeletion) {
      // While a deletion request is pending review, owner can cancel it (mapped via 'restore')
      list.push({
        id: 'restore',
        label: 'إلغاء طلب الحذف',
        tone: 'primary',
        icon: 'arrow-undo-outline',
        requiresConfirm: true,
        confirmTitle: CANCEL_DELETE_CONFIRM_TITLE,
        confirmMessage: CANCEL_DELETE_CONFIRM_MSG,
        confirmLabel: CANCEL_DELETE_CONFIRM_LABEL,
      })
    } else {
      // Normal state: owner can submit a deletion request
      list.push({
        id: 'delete',
        label: 'طلب حذف',
        tone: 'danger',
        icon: 'trash-outline',
        requiresConfirm: true,
        confirmTitle: DELETE_CONFIRM_TITLE,
        confirmMessage: DELETE_CONFIRM_MSG,
        confirmLabel: DELETE_CONFIRM_LABEL,
      })
    }

    return list
  }, [vm, isOwner, hasPendingDeletion])

  const run = async (id: OwnerActionId): Promise<void> => {
    if (!vm || !isOwner) {
      throw new Error('غير مصرح لك بتنفيذ هذا الإجراء')
    }

    if (busy) return

    setBusy(true)
    try {
      if (id === 'edit') {
        const user = useAuthStore.getState().user
        if (!user?.phone) {
          promptProfilePhoneRequired()
          return
        }
        return
      }

      if (id === 'delete') {
        await equipmentApi.deleteOperator(vm.id)
        // Refetch/invalidate detail to show the pending deletion request banner
        await invalidateOperatorListingQueries(queryClient, vm.id)
        return
      }

      if (id === 'restore') {
        if (!vm.pendingDeletion?.id) {
          throw new Error('لا يوجد طلب حذف قيد المراجعة لإلغائه')
        }
        await equipmentApi.cancelOperatorDeletionRequest(vm.pendingDeletion.id)
        // Refetch/invalidate detail to clear the pending deletion banner
        await invalidateOperatorListingQueries(queryClient, vm.id)
        return
      }

      throw new Error(`إجراء غير معروف: ${id}`)
    } finally {
      setBusy(false)
    }
  }

  return {
    actions,
    run,
    busy,
    viewCount: vm?.viewCount ?? 0,
  }
}
