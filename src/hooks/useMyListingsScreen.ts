import { useState, useMemo, useCallback } from 'react'
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
import { MyListingItem, MyListingEntityType } from '../types/my-listings.types'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../components/profile/my-listings/sections.config'
import { GroupedSectionData } from '../components/profile/my-listings/MyListingsAllView'

const ENTITY_QUERY_KEYS: Record<MyListingEntityType, string[]> = {
  car: ['my-cars'],
  bus: ['my-buses'],
  equipment: ['my-equipment'],
  operator: ['my-operators'],
  part: ['my-parts'],
  service: ['my-services'],
  job: ['my-jobs'],
}

export function useMyListingsScreen() {
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSubFilter, setActiveSubFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

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
            case 'operator':
              await equipmentApi.deleteOperator(item.id)
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

  const isEditSupported = (entityType: MyListingEntityType): boolean => {
    return entityType === 'car' || entityType === 'equipment' || entityType === 'operator'
  }

  const handleEdit = (item: MyListingItem) => {
    switch (item.entityType) {
      case 'car':
        router.push(`/post/edit/${item.id}` as any)
        break
      case 'equipment':
        router.push(`/equipment/edit/${item.id}` as any)
        break
      case 'operator':
        router.push(`/equipment/operators/edit/${item.id}` as any)
        break
      default:
        break
    }
  }

  const handleView = (item: MyListingItem) => {
    switch (item.entityType) {
      case 'car':
        router.push(`/listings/${item.id}` as any)
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
    isEditSupported,
  }
}
