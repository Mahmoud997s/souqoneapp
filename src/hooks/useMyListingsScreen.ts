import { useState, useMemo, useCallback, useRef } from 'react'
import { router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAllMyListings } from './useAllMyListings'
import { listingsApi } from '../api/listings'
import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { partsApi } from '../api/parts'
import { servicesApi } from '../api/services'
import { jobsApi } from '../api/jobs'
import { dialogService } from '../store/dialogStore'
import { useAuthStore } from '../store/authStore'
import { promptProfilePhoneRequired } from '../utils/profilePhoneGuard'
import { MyListingItem, MyListingEntityType } from '../types/my-listings.types'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../components/profile/my-listings/sections.config'
import { GroupedSectionData } from '../components/profile/my-listings/MyListingsAllView'
import type { OwnerAction } from '../components/listing-detail/OwnerManageBar'
import type { DialogOption } from '../components/ui/AppDialog'
import type { BusListingType } from '../types/bus.types'
import type { EquipmentListingType } from '../types/equipment.types'
import {
  buildCarOwnerActions,
  buildBusOwnerActions,
  buildEquipmentOwnerActions,
  CAR_STATUS_ACTION,
  OWNER_STATUS_TARGET,
  type ListingStatus,
} from '../utils/listing-detail/ownerActionMatrix'
import { invalidateBusListingQueries } from '../utils/listing-detail/busQueryKeys'
import { invalidateEquipmentListingQueries } from '../utils/listing-detail/equipmentQueryKeys'

const ENTITY_QUERY_KEYS: Record<MyListingEntityType, string[]> = {
  car: ['my-cars'],
  bus: ['my-buses'],
  equipment: ['my-equipment'],
  operator: ['my-operators'],
  part: ['my-parts'],
  service: ['my-services'],
  job: ['my-jobs'],
}

interface RawListingTypeHolder {
  listingType?: string
  type?: string
  busListingType?: string
  equipmentListingType?: string
}

function asRawListingTypeHolder(raw: unknown): RawListingTypeHolder {
  if (raw && typeof raw === 'object') {
    return raw as RawListingTypeHolder
  }
  return {}
}

function getErrorStatus(err: unknown): {
  hasResponse: boolean
  status?: number
} {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { status?: number } }).response
    if (resp && typeof resp === 'object') {
      return { hasResponse: true, status: resp.status }
    }
  }
  return { hasResponse: false }
}

export function useMyListingsScreen() {
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSubFilter, setActiveSubFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const isChangingStatus = useRef(false)

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useAllMyListings(activeCategory)

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      // 1. Check Category Match
      if (activeCategory !== 'all') {
        if (activeCategory === 'cars' && item.entityType !== 'car') return false
        if (activeCategory === 'buses' && item.entityType !== 'bus') return false
        if (activeCategory === 'equipment' && item.entityType !== 'equipment') return false
        if (activeCategory === 'operators' && item.entityType !== 'operator') return false
        if (activeCategory === 'parts' && item.entityType !== 'part') return false
        if (activeCategory === 'services' && item.entityType !== 'service') return false
        if (activeCategory === 'jobs' && item.entityType !== 'job') return false
      }

      // 2. Check SubFilter Match
      if (!activeSubFilter || activeSubFilter === 'all' || activeSubFilter.startsWith('all_')) {
        return true
      }

      // Normalized Status filters
      if (activeSubFilter === 'ACTIVE') {
        return item.normalizedStatus === 'active'
      }
      if (activeSubFilter === 'DRAFT') {
        return item.normalizedStatus === 'draft'
      }
      if (activeSubFilter === 'EXPIRED') {
        return item.normalizedStatus === 'expired'
      }
      
      if (activeSubFilter === 'ARCHIVED') {
        return item.rawStatus === 'ARCHIVED'
      }

      // Entity-specific granular subfilters
      const raw = (item.raw || {}) as Record<string, any>
      const rawType = String(
        raw.listingType ||
        raw.busListingType ||
        raw.busType ||
        raw.equipmentType ||
        raw.operatorType ||
        ''
      ).toUpperCase()
      const rawPartCat = String(raw.partCategory || '').toUpperCase()
      const rawServiceType = String(raw.serviceType || '').toUpperCase()
      const rawJobType = String(raw.jobType || raw.employmentType || '').toUpperCase()
      const rawCond = String(raw.condition || '').toUpperCase()

      if (rawType === activeSubFilter) return true
      if (rawPartCat === activeSubFilter) return true
      if (rawServiceType === activeSubFilter) return true
      if (rawJobType === activeSubFilter) return true
      if (rawCond === activeSubFilter) return true

      return false
    })
  }, [items, activeCategory, activeSubFilter])

  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    setActiveSubFilter('all') // reset sub-filter on category tab switch
  }

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleDelete = (item: MyListingItem) => {
    // ════════════════════════════════════════════════════════════
    // OPERATOR DELETION FLOW (Request-based instead of immediate)
    // ════════════════════════════════════════════════════════════
    if (item.entityType === 'operator') {
      dialogService.confirm(
        'طلب حذف البروفايل',
        'سيتم رفع طلب لإدارة التطبيق لحذف البروفايل المهني. هل أنت متأكد من رغبتك في الحذف؟',
        async () => {
          try {
            await equipmentApi.deleteOperator(item.id)
            await queryClient.invalidateQueries({ queryKey: ENTITY_QUERY_KEYS['operator'] })
            dialogService.alert('تم بنجاح', 'تم إرسال طلب حذف البروفايل للإدارة وسوف يتم مراجعته.', 'success')
          } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء إرسال طلب الحذف'
            dialogService.alert('خطأ', Array.isArray(msg) ? msg[0] : msg)
          }
        },
        'إرسال الطلب',
        'إلغاء',
        true
      )
      return
    }

    // ════════════════════════════════════════════════════════════
    // STANDARD DELETION FLOW (Immediate deletion for all other types)
    // ════════════════════════════════════════════════════════════
    dialogService.confirm(
      'حذف الإعلان',
      'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
      async () => {
        try {
          switch (item.entityType) {
            case 'car':
              await listingsApi.remove(item.id)
              break
            case 'bus':
              await busesApi.remove(item.id)
              break
            case 'equipment':
              await equipmentApi.delete(item.id)
              break
            case 'part':
              await partsApi.remove(item.id)
              break
            case 'service':
              await servicesApi.remove(item.id)
              break
            case 'job':
              await jobsApi.deleteJob(item.id)
              break
          }

          await queryClient.invalidateQueries({
            queryKey: ENTITY_QUERY_KEYS[item.entityType],
          })
          dialogService.alert('تم', 'تم حذف الإعلان بنجاح', 'success')
        } catch {
          dialogService.alert('خطأ', 'حدث خطأ أثناء الحذف')
        }
      },
      'حذف',
      'إلغاء',
      true
    )
  }

  const handleCancelDeletionRequest = (item: MyListingItem) => {
    if (!item.pendingDeletionRequest) return

    dialogService.confirm(
      'إلغاء طلب الحذف',
      'هل أنت متأكد من رغبتك في إلغاء طلب حذف البروفايل؟',
      async () => {
        try {
          await equipmentApi.cancelOperatorDeletionRequest(item.pendingDeletionRequest!.id)
          await queryClient.invalidateQueries({ queryKey: ENTITY_QUERY_KEYS['operator'] })
          dialogService.alert('تم بنجاح', 'تم إلغاء طلب حذف البروفايل بنجاح.', 'success')
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء إلغاء الطلب'
          dialogService.alert('خطأ', Array.isArray(msg) ? msg[0] : msg)
        }
      },
      'تأكيد الإلغاء',
      'تراجع'
    )
  }

  const isEditSupported = (entityType: MyListingEntityType): boolean => {
    return (
      entityType === 'car' ||
      entityType === 'bus' ||
      entityType === 'equipment' ||
      entityType === 'operator' ||
      entityType === 'part' ||
      entityType === 'service'
    )
  }

  const handleEdit = (item: MyListingItem) => {
    if (
      (item.entityType === 'car' || item.entityType === 'bus') &&
      (item.rawStatus === 'SOLD' || item.rawStatus === 'SUSPENDED')
    ) {
      dialogService.alert(
        'تنبيه',
        'لا يمكن تعديل الإعلان إذا كان مباعاً أو موقوفاً.',
        'warning'
      )
      return
    }

    switch (item.entityType) {
      case 'car':
        router.push(`/post/edit/${item.id}` as any)
        break
      case 'bus':
        router.push(`/post/edit/${item.id}?type=bus` as any)
        break
      case 'equipment':
        router.push(`/equipment/edit/${item.id}` as any)
        break
      case 'operator':
        router.push(`/equipment/operators/edit/${item.id}` as any)
        break
      case 'part':
        router.push(`/post/edit/${item.id}?type=parts` as any)
        break
      case 'service':
        router.push(`/post/edit/${item.id}?type=services` as any)
        break
      default:
        break
    }
  }

  const handleView = (item: MyListingItem) => {
    switch (item.entityType) {
      case 'car':
        router.push(`/cars/${item.id}` as any)
        break
      case 'bus':
        router.push(`/buses/${item.id}` as any)
        break
      case 'equipment':
        router.push(`/equipment/${item.id}` as any)
        break
      case 'operator':
        router.push(`/equipment/operators/${item.id}` as any)
        break
      case 'part':
        router.push(`/parts/${item.id}` as any)
        break
      case 'service':
        router.push(`/services/${item.id}` as any)
        break
      case 'job':
        router.push(`/jobs/${item.id}` as any)
        break
    }
  }

  const groupedSections = useMemo<GroupedSectionData[]>(() => {
    if (activeCategory !== 'all') return []
    return MY_LISTINGS_SECTIONS_CONFIG.map((config) => ({
      config,
      items: filteredData.filter((item) => item.entityType === config.entityType),
    })).filter((section) => section.items.length > 0)
  }, [activeCategory, filteredData])

  const handleStatusChange = (item: MyListingItem) => {
    const raw = asRawListingTypeHolder(item.raw)
    const status = (item.rawStatus || 'ACTIVE') as ListingStatus
    let allActions: OwnerAction[] = []

    if (item.entityType === 'car') {
      const carType = String(raw.listingType || raw.type || 'SALE')
      allActions = buildCarOwnerActions(status, carType)
    } else if (item.entityType === 'bus') {
      const busType = String(
        raw.busListingType || raw.listingType || 'BUS_SALE'
      ) as BusListingType
      allActions = buildBusOwnerActions(status, busType)
    } else if (item.entityType === 'equipment') {
      const eqType = String(
        raw.equipmentListingType || raw.listingType || 'EQUIPMENT_SALE'
      ) as EquipmentListingType
      allActions = buildEquipmentOwnerActions(status, eqType)
    }

    const statusActions = allActions.filter(
      (action) => action.id !== 'edit' && action.id !== 'delete'
    )

    if (statusActions.length === 0) {
      dialogService.alert('تنبيه', 'لا يوجد إجراءات متاحة لهذه الحالة', 'warning')
      return
    }

    const options: DialogOption[] = statusActions.map((action) => ({
      text: action.label,
      icon: action.icon,
      onPress: () => confirmStatusChange(item, action),
    }))

    dialogService.showOptions('تغيير الحالة', options)
  }

  const confirmStatusChange = (item: MyListingItem, action: OwnerAction) => {
    if (isChangingStatus.current) return

    if (action.id === 'restore' || action.id === 'submit') {
      const user = useAuthStore.getState().user
      if (!user?.phone) {
        promptProfilePhoneRequired()
        return
      }
    }

    const confirmTitle = action.confirmTitle || 'تأكيد الإجراء'
    const confirmMessage =
      action.confirmMessage || 'هل أنت متأكد من تغيير حالة الإعلان؟'
    const confirmLabel = action.confirmLabel || 'تأكيد'

    // Add a slight delay to allow the bottom sheet Modal to unmount
    // before the confirm Modal attempts to mount (fixes iOS Modal collision)
    setTimeout(() => {
      dialogService.confirm(
        confirmTitle,
        confirmMessage,
        async () => {
          if (isChangingStatus.current) return
          isChangingStatus.current = true
          try {
            const version = item.version || 1
            if (item.entityType === 'car') {
              const carAction = CAR_STATUS_ACTION[action.id]
              if (!carAction) return
              await listingsApi.updateStatus(item.id, carAction, version)
            } else if (item.entityType === 'bus') {
              const targetStatus = OWNER_STATUS_TARGET[action.id]
              if (!targetStatus) return
              await busesApi.update(item.id, { version, status: targetStatus })
              await invalidateBusListingQueries(queryClient, item.id)
            } else if (item.entityType === 'equipment') {
              const targetStatus = OWNER_STATUS_TARGET[action.id]
              if (!targetStatus) return
              await equipmentApi.update(item.id, { version, status: targetStatus })
              await invalidateEquipmentListingQueries(queryClient, item.id)
            } else {
              return
            }

            // Immediately refetch all queries to update the UI
            await refetch()

            dialogService.alert('تم', 'تم تغيير حالة الإعلان بنجاح', 'success')
          } catch (err: unknown) {
            const { hasResponse, status } = getErrorStatus(err)
            if (!hasResponse) {
              dialogService.alert(
                'خطأ في الاتصال',
                'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.'
              )
            } else if (status === 403) {
              dialogService.alert('غير مصرح', 'لا يمكن استعادة إعلان تم بيعه بالفعل.')
            } else if (status === 409) {
              dialogService.alert(
                'تحديث مطلوب',
                'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
              )
              handleRefresh()
            } else if (status === 429) {
              dialogService.alert(
                'محاولات كثيرة',
                'لقد قمت بعدة محاولات متتالية، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
              )
            } else {
              dialogService.alert('خطأ', 'حدث خطأ أثناء تغيير الحالة')
            }
          } finally {
            isChangingStatus.current = false
          }
        },
        confirmLabel,
        'إلغاء'
      )
    }, 400)
  }

  return {
    activeCategory,
    activeSubFilter,
    handleSelectCategory,
    setActiveSubFilter,
    filteredData,
    groupedSections,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    handleRefresh,
    isRefreshing,
    handleDelete,
    handleEdit,
    handleView,
    handleStatusChange,
    handleCancelDeletionRequest,
    isEditSupported,
  }
}
