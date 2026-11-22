import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useListingNavigation } from '../navigation/useListingNavigation'
import { useAllMyListings } from './useAllMyListings'
import {
  useMyListingOwnerActions,
  MY_LISTING_ENTITY_QUERY_KEYS,
} from './useMyListingOwnerActions'
import { resolveOwnerActionSuccessToastTitle } from '../utils/listing-detail/ownerActionToast'
import { toastService, type ActionSheetOption } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { promptProfilePhoneRequired } from '../utils/profilePhoneGuard'
import { listingsApi } from '../api/listings'
import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { MyListingEntityType, MyListingItem } from '../types/my-listings.types'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../components/profile/my-listings/sections.config'
import { GroupedSectionData } from '../components/profile/my-listings/MyListingsAllView'
import type { OwnerAction } from '../components/listing-detail/OwnerManageBar'
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
import { showErrorDialog } from '../utils/showErrorDialog'
import { getPublishRateLimitErrorMessage } from '../utils/publishRateLimitError'

const STATUS_OPTION_CONFIRM_DELAY_MS = 400

const ENTITY_QUERY_KEYS = MY_LISTING_ENTITY_QUERY_KEYS

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
  const { openListing, editListing } = useListingNavigation()
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSubFilter, setActiveSubFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const isChangingStatus = useRef(false)
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current)
        statusTimeoutRef.current = null
      }
    }
  }, [])

  const {
    items,
    isLoading,
    isError,
    error,
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
        if (activeCategory === 'parts' && item.entityType !== 'part') return false
        if (activeCategory === 'services' && item.entityType !== 'service') return false
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
        ''
      ).toUpperCase()
      const rawPartCat = String(raw.partCategory || '').toUpperCase()
      const rawServiceType = String(raw.serviceType || '').toUpperCase()
      const rawCond = String(raw.condition || '').toUpperCase()

      if (rawType === activeSubFilter) return true
      if (rawPartCat === activeSubFilter) return true
      if (rawServiceType === activeSubFilter) return true
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

  const {
    getBusyAction,
    handleDelete,
    handleCancelDeletionRequest,
  } = useMyListingOwnerActions()

  const isEditSupported = (entityType: MyListingEntityType): boolean => {
    return (
      entityType === 'car' ||
      entityType === 'bus' ||
      entityType === 'equipment' ||
      entityType === 'part' ||
      entityType === 'service'
    )
  }

  const handleEdit = (item: MyListingItem) => {
    if (
      (item.entityType === 'car' || item.entityType === 'bus') &&
      (item.rawStatus === 'SOLD' || item.rawStatus === 'SUSPENDED')
    ) {
      toastService.show({
        kind: 'warning',
        title: 'لا يمكن تعديل الإعلان إذا كان مباعاً أو موقوفاً',
      })
      return
    }

    void editListing(item.entityType, item.id)
  }

  const handleView = (item: MyListingItem) => {
    openListing(item.entityType, item.id)
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
      toastService.show({ kind: 'warning', title: 'لا يوجد إجراءات متاحة لهذه الحالة' })
      return
    }

    const options: ActionSheetOption[] = statusActions.map((action) => ({
      text: action.label,
      icon: action.icon,
      onPress: () => confirmStatusChange(item, action),
    }))

    toastService.showActionSheet({ title: 'تغيير الحالة', options })
  }

  const confirmStatusChange = (item: MyListingItem, action: OwnerAction) => {
    if (!isMountedRef.current || isChangingStatus.current) return

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

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current)
    }

    // Add a slight delay to allow the bottom sheet Modal to unmount
    // before the confirm Modal attempts to mount (fixes iOS Modal collision)
    statusTimeoutRef.current = setTimeout(() => {
      statusTimeoutRef.current = null
      if (!isMountedRef.current) return
      toastService.confirm({
        title: confirmTitle,
        message: confirmMessage,
        intent: action.tone === 'danger' ? 'danger' : 'primary',
        confirmLabel,
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
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

            toastService.show({
              kind: 'success',
              title: resolveOwnerActionSuccessToastTitle(action.id),
            })
          } catch (err: unknown) {
            const { hasResponse, status } = getErrorStatus(err)
            if (!hasResponse) {
              showErrorDialog(
                err,
                'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.',
                'خطأ في الاتصال'
              )
            } else if (status === 403) {
              toastService.show({
                kind: 'error',
                title: 'لا يمكن استعادة إعلان تم بيعه بالفعل',
              })
            } else if (status === 409) {
              toastService.show({
                kind: 'error',
                title: 'تم تعديل الإعلان من جهاز آخر، يرجى التحديث والمحاولة مجدداً',
              })
              handleRefresh()
            } else if (status === 429) {
              toastService.show({
                kind: 'error',
                title: getPublishRateLimitErrorMessage(err),
              })
            } else {
              showErrorDialog(err, 'حدث خطأ أثناء تغيير الحالة')
            }
          } finally {
            isChangingStatus.current = false
          }
        },
      })
    }, STATUS_OPTION_CONFIRM_DELAY_MS)
  }

  return {
    activeCategory,
    activeSubFilter,
    handleSelectCategory,
    setActiveSubFilter,
    filteredData,
    groupedSections,
    isLoading,
    isError,
    error,
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
    getBusyAction,
    isEditSupported,
  }
}
