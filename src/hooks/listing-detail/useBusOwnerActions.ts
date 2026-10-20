import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { OwnerActionId } from '../../components/listing-detail/OwnerManageBar'
import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'
import { busesApi } from '../../api/buses'
import { busQueryKeys, invalidateBusListingQueries } from '../../utils/listing-detail/busQueryKeys'
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

export interface UseBusOwnerActionsResult {
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

const STATUS_TRANSITION_MAP: Partial<Record<OwnerActionId, 'ACTIVE' | 'ARCHIVED' | 'SOLD'>> = {
  markSold: 'SOLD',
  archive: 'ARCHIVED',
  pause: 'ARCHIVED',
  restore: 'ACTIVE',
  submit: 'ACTIVE',
}

/**
 * useBusOwnerActions
 *
 * Implements the status-action matrix for bus listings:
 *
 * | Status    | busListingType                     | Available actions                  |
 * |-----------|------------------------------------|------------------------------------|
 * | ACTIVE    | BUS_SALE / BUS_SALE_WITH_CONTRACT  | edit · markSold · archive · delete |
 * | ACTIVE    | BUS_RENT                           | edit · pause · delete              |
 * | ARCHIVED  | any                                | edit · restore · delete            |
 * | DRAFT     | any                                | edit · submit · delete             |
 * | RENTED    | any                                | edit · delete                      |
 * | SOLD      | any                                | delete only                        |
 * | SUSPENDED | any                                | delete only                        |
 *
 * - run('edit') is a no-op; navigation is caller's responsibility.
 * - Status transitions call busesApi.update(id, { version, status }).
 * - 409 errors trigger queryClient.refetchQueries on the detail key before re-throwing.
 * - Missing phone triggers promptProfilePhoneRequired() before restore/submit.
 */
export function useBusOwnerActions(vm: BusDetailViewModel): UseBusOwnerActionsResult {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const actions = useMemo<OwnerAction[]>(() => {
    const result: OwnerAction[] = []
    const { status, busListingType } = vm

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
      if (busListingType === 'BUS_RENT') {
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
      } else {
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
  }, [vm.status, vm.busListingType])

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
        await busesApi.remove(vm.id)
        await invalidateBusListingQueries(queryClient, vm.id, { removeDetail: true })
      } finally {
        setBusy(false)
      }
      return
    }

    const nextStatus = STATUS_TRANSITION_MAP[id]
    if (!nextStatus) return

    setBusy(true)
    try {
      await busesApi.update(vm.id, {
        version: vm.version,
        status: nextStatus,
      } as any)
      await invalidateBusListingQueries(queryClient, vm.id)
    } catch (err: any) {
      if (err?.response?.status === 409) {
        await queryClient.refetchQueries({ queryKey: busQueryKeys.detail(vm.id) })
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
