import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { OwnerActionId } from '../../components/listing-detail/OwnerManageBar'
import type { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'
import { equipmentApi } from '../../api/equipment'
import { equipmentQueryKeys, invalidateEquipmentListingQueries } from '../../utils/listing-detail/equipmentQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'

export interface OwnerAction {
  id: OwnerActionId
  label: string
  tone: 'primary' | 'danger' | 'neutral'
  icon: string
  requiresConfirm: boolean
  confirmTitle?: string
  confirmMessage?: string
  confirmLabel?: string
}

export interface UseEquipmentOwnerActionsResult {
  actions: OwnerAction[]
  run: (id: OwnerActionId) => Promise<void>
  busy: boolean
  viewCount: number
}

export function isOptimisticLockError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { response?: { status?: number } }
  return err.response?.status === 409
}

const GENERIC_STATUS_CONFIRM = 'هل أنت متأكد من تغيير حالة الإعلان؟'
const GENERIC_CONFIRM_TITLE = 'تأكيد الإجراء'
const GENERIC_CONFIRM_LABEL = 'تأكيد'

const STATUS_TRANSITION_MAP: Partial<Record<OwnerActionId, 'ACTIVE' | 'ARCHIVED' | 'SOLD' | 'RENTED'>> = {
  markSold: 'SOLD',
  markRented: 'RENTED',
  archive: 'ARCHIVED',
  pause: 'ARCHIVED',
  restore: 'ACTIVE',
  submit: 'ACTIVE',
}

/**
 * useEquipmentOwnerActions
 *
 * Implements the status-action matrix for equipment listings strictly matching backend ALLOWED_TRANSITIONS:
 *
 * Backend ALLOWED_TRANSITIONS:
 * - DRAFT:     ['ACTIVE']
 * - ACTIVE:    ['SOLD', 'RENTED', 'ARCHIVED', 'SUSPENDED']
 * - ARCHIVED:  ['ACTIVE']
 * - RENTED:    ['ACTIVE']
 * - SOLD:      []
 * - SUSPENDED: []
 *
 * Sub-type restrictions:
 * - EQUIPMENT_WANTED may only transition between ACTIVE and ARCHIVED (no SOLD, no RENTED).
 * - SOLD is only allowed for EQUIPMENT_SALE.
 * - RENTED is only allowed for EQUIPMENT_RENT.
 *
 * Matrix:
 * | Status    | equipmentListingType | Available actions                         |
 * |-----------|----------------------|-------------------------------------------|
 * | ACTIVE    | EQUIPMENT_SALE       | edit · markSold · archive · delete        |
 * | ACTIVE    | EQUIPMENT_RENT       | edit · markRented · pause · delete        |
 * | ACTIVE    | EQUIPMENT_WANTED     | edit · archive · delete                   |
 * | ARCHIVED  | any                  | edit · restore · delete                   |
 * | DRAFT     | any                  | edit · submit · delete                    |
 * | RENTED    | any (EQUIPMENT_RENT) | edit · restore · delete                   |
 * | SOLD      | any                  | delete only                               |
 * | SUSPENDED | any                  | delete only                               |
 */
export function useEquipmentOwnerActions(vm: EquipmentDetailViewModel): UseEquipmentOwnerActionsResult {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const actions = useMemo<OwnerAction[]>(() => {
    const result: OwnerAction[] = []
    const { status, equipmentListingType } = vm

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
      if (equipmentListingType === 'EQUIPMENT_RENT') {
        result.push({
          id: 'markRented',
          label: 'تعليم كمؤجر',
          tone: 'primary',
          icon: 'checkmark-circle-outline',
          requiresConfirm: true,
          confirmTitle: 'تأكيد الإيجار',
          confirmMessage:
            'هل أنت متأكد من تعليم هذه المعدة كمؤجرة؟ يمكنك إعادة تفعيلها لاحقاً.',
          confirmLabel: GENERIC_CONFIRM_LABEL,
        })
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
      } else if (equipmentListingType === 'EQUIPMENT_SALE') {
        result.push({
          id: 'markSold',
          label: 'تعليم كمباع',
          tone: 'primary',
          icon: 'checkmark-circle-outline',
          requiresConfirm: true,
          confirmTitle: 'تأكيد البيع',
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
      } else {
        // EQUIPMENT_WANTED
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
    } else if (status === 'RENTED') {
      // Backend ALLOWED_TRANSITIONS allows RENTED -> ACTIVE
      result.push({
        id: 'restore',
        label: 'إعادة إتاحة للإيجار',
        tone: 'primary',
        icon: 'refresh-outline',
        requiresConfirm: true,
        confirmTitle: GENERIC_CONFIRM_TITLE,
        confirmMessage: 'هل أنت متأكد من إعادة إتاحة هذه المعدة للإيجار؟',
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

    // Delete — always present regardless of status
    result.push({
      id: 'delete',
      label: 'حذف',
      tone: 'danger',
      icon: 'trash-outline',
      requiresConfirm: true,
      confirmTitle: 'حذف الإعلان',
      confirmMessage: 'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
      confirmLabel: 'حذف',
    })

    return result
  }, [vm.status, vm.equipmentListingType])

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
      setBusy(true)
      try {
        await equipmentApi.remove(vm.id)
        await invalidateEquipmentListingQueries(queryClient, vm.id, { removeDetail: true })
      } finally {
        setBusy(false)
      }
      return
    }

    const nextStatus = STATUS_TRANSITION_MAP[id]
    if (!nextStatus) return

    setBusy(true)
    try {
      await equipmentApi.update(vm.id, {
        version: vm.version,
        status: nextStatus,
      })
      await invalidateEquipmentListingQueries(queryClient, vm.id)
    } catch (err: unknown) {
      if (isOptimisticLockError(err)) {
        await queryClient.refetchQueries({ queryKey: equipmentQueryKeys.detail(vm.id) })
      }
      throw err
    } finally {
      setBusy(false)
    }
  }

  return {
    actions,
    run,
    busy,
    viewCount: vm.viewCount ?? 0,
  }
}
