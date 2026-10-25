import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { OwnerActionId } from '../../components/listing-detail/OwnerManageBar'
import type { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'
import { equipmentApi } from '../../api/equipment'
import { equipmentQueryKeys, invalidateEquipmentListingQueries } from '../../utils/listing-detail/equipmentQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'
import {
  buildEquipmentOwnerActions,
  OWNER_STATUS_TARGET,
} from '../../utils/listing-detail/ownerActionMatrix'

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

/**
 * useEquipmentOwnerActions
 *
 * Implements the status-action matrix for equipment listings via buildEquipmentOwnerActions.
 */
export function useEquipmentOwnerActions(vm: EquipmentDetailViewModel): UseEquipmentOwnerActionsResult {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const actions = useMemo<OwnerAction[]>(
    () => buildEquipmentOwnerActions(vm.status, vm.equipmentListingType),
    [vm.status, vm.equipmentListingType]
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
      setBusy(true)
      try {
        await equipmentApi.remove(vm.id)
        await invalidateEquipmentListingQueries(queryClient, vm.id, { removeDetail: true })
      } finally {
        setBusy(false)
      }
      return
    }

    const nextStatus = OWNER_STATUS_TARGET[id]
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
