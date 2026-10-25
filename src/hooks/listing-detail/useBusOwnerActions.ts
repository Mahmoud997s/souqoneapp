import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { OwnerActionId } from '../../components/listing-detail/OwnerManageBar'
import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'
import { busesApi, BusStatusUpdatePayload } from '../../api/buses'
import { busQueryKeys, invalidateBusListingQueries } from '../../utils/listing-detail/busQueryKeys'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'
import {
  buildBusOwnerActions,
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

/**
 * useBusOwnerActions
 *
 * Implements the status-action matrix for bus listings via buildBusOwnerActions:
 *
 * | Status    | busListingType                     | Available actions                     |
 * |-----------|------------------------------------|---------------------------------------|
 * | ACTIVE    | BUS_SALE / BUS_SALE_WITH_CONTRACT  | edit · markSold · archive · delete    |
 * | ACTIVE    | BUS_RENT                           | edit · markRented · pause · delete    |
 * | ARCHIVED  | any                                | edit · restore · delete               |
 * | DRAFT     | any                                | edit · submit · delete                |
 * | RENTED    | any                                | edit · restore · delete               |
 * | SOLD      | any                                | delete only                           |
 * | SUSPENDED | any                                | delete only                           |
 */
export function useBusOwnerActions(vm: BusDetailViewModel): UseBusOwnerActionsResult {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const actions = useMemo<OwnerAction[]>(
    () => buildBusOwnerActions(vm.status, vm.busListingType),
    [vm.status, vm.busListingType]
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
        await busesApi.remove(vm.id)
        await invalidateBusListingQueries(queryClient, vm.id, { removeDetail: true })
      } finally {
        setBusy(false)
      }
      return
    }

    const nextStatus = OWNER_STATUS_TARGET[id]
    if (!nextStatus) return

    setBusy(true)
    try {
      await busesApi.update(vm.id, {
        version: vm.version,
        status: nextStatus,
      } as BusStatusUpdatePayload)
      await invalidateBusListingQueries(queryClient, vm.id)
    } catch (err: unknown) {
      if (isOptimisticLockError(err)) {
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
