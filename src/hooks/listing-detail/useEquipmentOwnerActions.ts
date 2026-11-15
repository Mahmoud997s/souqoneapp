import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  OwnerAction,
  OwnerActionId,
  OwnerBusyAction,
} from '../../components/listing-detail/OwnerManageBar'
import type { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'
import { equipmentApi } from '../../api/equipment'
import { equipmentQueryKeys, invalidateEquipmentListingQueries } from '../../utils/listing-detail/equipmentQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'
import {
  buildEquipmentOwnerActions,
  OWNER_STATUS_TARGET,
} from '../../utils/listing-detail/ownerActionMatrix'

export type { OwnerAction }

export interface UseEquipmentOwnerActionsResult {
  actions: OwnerAction[]
  run: (id: OwnerActionId) => Promise<void>
  busy: boolean
  busyAction: OwnerBusyAction
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
  const [busyAction, setBusyAction] = useState<OwnerBusyAction>(null)
  const pendingRef = useRef<OwnerBusyAction>(null)
  const busy = busyAction !== null

  const actions = useMemo<OwnerAction[]>(
    () => buildEquipmentOwnerActions(vm.status, vm.equipmentListingType),
    [vm.status, vm.equipmentListingType]
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
        await equipmentApi.remove(vm.id)
        await invalidateEquipmentListingQueries(queryClient, vm.id, { removeDetail: true })
      } finally {
        pendingRef.current = null
        setBusyAction(null)
      }
      return
    }

    const nextStatus = OWNER_STATUS_TARGET[id]
    if (!nextStatus) return

    pendingRef.current = id
    setBusyAction(id)
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
