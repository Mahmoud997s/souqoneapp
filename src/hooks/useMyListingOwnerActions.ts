import { useCallback, useState } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { listingsApi } from '../api/listings'
import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { partsApi } from '../api/parts'
import { servicesApi } from '../api/services'
import { dialogService } from '../store/dialogStore'
import { toastService } from '../store/toastStore'
import { showErrorDialog } from '../utils/showErrorDialog'
import { MyListingEntityType, MyListingItem } from '../types/my-listings.types'
import type { OwnerCardBusyAction } from '../components/profile/my-listings/OwnerCardActions'

export const MY_LISTING_ENTITY_QUERY_KEYS: Record<MyListingEntityType, string[]> = {
  car: ['my-cars'],
  bus: ['my-buses'],
  equipment: ['my-equipment'],
  operator: ['my-operators'],
  part: ['my-parts'],
  service: ['my-services'],
  job: ['my-jobs'],
}

export function getMyListingItemKey(item: Pick<MyListingItem, 'entityType' | 'id'>): string {
  return `${item.entityType}:${item.id}`
}

function removeIdFromCacheData(oldData: unknown, id: string): unknown {
  if (!oldData) return oldData
  if (Array.isArray(oldData)) {
    return oldData.filter((entry: any) => entry?.id !== id)
  }
  if (typeof oldData === 'object') {
    const record = oldData as Record<string, unknown>
    if (Array.isArray(record.pages)) {
      const infinite = oldData as InfiniteData<any>
      return {
        ...infinite,
        pages: infinite.pages.map((page) => removeIdFromCacheData(page, id)),
      }
    }
    if (Array.isArray(record.items)) {
      return { ...record, items: record.items.filter((entry: any) => entry?.id !== id) }
    }
    if (Array.isArray(record.data)) {
      return { ...record, data: record.data.filter((entry: any) => entry?.id !== id) }
    }
  }
  return oldData
}

async function performDeleteApiCall(entityType: MyListingEntityType, id: string): Promise<void> {
  switch (entityType) {
    case 'car':
      await listingsApi.remove(id)
      return
    case 'bus':
      await busesApi.remove(id)
      return
    case 'equipment':
      await equipmentApi.delete(id)
      return
    case 'part':
      await partsApi.remove(id)
      return
    case 'service':
      await servicesApi.remove(id)
      return
  }
}

export function useMyListingOwnerActions() {
  const queryClient = useQueryClient()
  const [busyByKey, setBusyByKey] = useState<Record<string, OwnerCardBusyAction>>({})

  const setBusy = useCallback((item: MyListingItem, action: OwnerCardBusyAction) => {
    const key = getMyListingItemKey(item)
    setBusyByKey((prev) => {
      if (action === null) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: action }
    })
  }, [])

  const getBusyAction = useCallback(
    (item: MyListingItem): OwnerCardBusyAction => busyByKey[getMyListingItemKey(item)] ?? null,
    [busyByKey]
  )

  const handleDelete = useCallback(
    (item: MyListingItem) => {
      if (item.pendingDeletionRequest?.status === 'PENDING') {
        toastService.show({ kind: 'warning', title: 'يوجد طلب حذف قيد المراجعة بالفعل' })
        return
      }

      dialogService.confirm(
        'حذف الإعلان',
        'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
        async () => {
          const queryKey = MY_LISTING_ENTITY_QUERY_KEYS[item.entityType]
          setBusy(item, 'delete')
          const previousSnapshots = queryClient.getQueriesData({ queryKey })

          queryClient.setQueriesData({ queryKey }, (oldData) =>
            removeIdFromCacheData(oldData, item.id)
          )

          try {
            await performDeleteApiCall(item.entityType, item.id)
            await queryClient.invalidateQueries({ queryKey })
            toastService.show({ kind: 'success', title: 'تم حذف الإعلان' })
          } catch (err: unknown) {
            for (const [key, data] of previousSnapshots) {
              queryClient.setQueryData(key, data)
            }
            showErrorDialog(err, 'حدث خطأ أثناء الحذف')
          } finally {
            setBusy(item, null)
          }
        },
        'حذف',
        'إلغاء',
        true
      )
    },
    [queryClient, setBusy]
  )

  const handleCancelDeletionRequest = useCallback(
    (item: MyListingItem) => {
      if (!item.pendingDeletionRequest) return

      dialogService.confirm(
        'إلغاء طلب الحذف',
        'هل أنت متأكد من رغبتك في إلغاء طلب حذف البروفايل؟',
        async () => {
          setBusy(item, 'cancelDeletion')
          try {
            await equipmentApi.cancelOperatorDeletionRequest(item.pendingDeletionRequest!.id)
            await queryClient.invalidateQueries({
              queryKey: MY_LISTING_ENTITY_QUERY_KEYS['operator'],
            })
            toastService.show({ kind: 'success', title: 'تم إلغاء طلب حذف الحساب' })
          } catch (err: unknown) {
            showErrorDialog(err, 'حدث خطأ أثناء إلغاء الطلب')
          } finally {
            setBusy(item, null)
          }
        },
        'تأكيد الإلغاء',
        'تراجع'
      )
    },
    [queryClient, setBusy]
  )

  return {
    getBusyAction,
    handleDelete,
    handleCancelDeletionRequest,
  }
}
