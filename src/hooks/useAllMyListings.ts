import { useMemo, useCallback } from 'react'
import { useMyCarsInfinite } from './queries/useMyCarsInfinite'
import { useMyBusesInfinite } from './queries/useMyBusesInfinite'
import { useMyServicesInfinite } from './queries/useMyServicesInfinite'
import { useMyEquipment } from './queries/useMyEquipment'
import { useMyParts } from './queries/useMyParts'
import { normalizeAndMerge, extractArray } from '../utils/normalizeAndMerge'
import { MyListingItem } from '../types/my-listings.types'

export interface UseAllMyListingsResult {
  items: MyListingItem[]
  isLoading: boolean
  isError: boolean
  error: unknown
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  refetch: () => Promise<void>
}

function extractPagesItems(pages?: any[]): any[] {
  if (!pages || !Array.isArray(pages)) return []
  return pages.flatMap((page) => extractArray(page))
}

export function useAllMyListings(activeCategory: string = 'all'): UseAllMyListingsResult {
  const cars = useMyCarsInfinite()
  const buses = useMyBusesInfinite()
  const services = useMyServicesInfinite()
  const equipment = useMyEquipment()
  const parts = useMyParts()

  const items = useMemo(() => {
    return normalizeAndMerge({
      cars: extractPagesItems(cars.data?.pages),
      buses: extractPagesItems(buses.data?.pages),
      services: extractPagesItems(services.data?.pages),
      jobs: [],
      equipment: equipment.data,
      operators: [],
      parts: parts.data,
    })
  }, [
    cars.data,
    buses.data,
    services.data,
    equipment.data,
    parts.data,
  ])

  // Active category queries used for error and status discrimination
  const activeQueries = useMemo(() => {
    switch (activeCategory) {
      case 'cars':
        return [cars]
      case 'buses':
        return [buses]
      case 'services':
        return [services]
      case 'equipment':
        return [equipment]
      case 'parts':
        return [parts]
      default:
        return [cars, buses, services, equipment, parts]
    }
  }, [activeCategory, cars, buses, services, equipment, parts])

  const isError = useMemo(() => {
    return activeQueries.some((q) => q.isError)
  }, [activeQueries])

  const error = useMemo(() => {
    return activeQueries.find((q) => q.isError)?.error ?? null
  }, [activeQueries])

  // Initial loading: wait for ALL queries to settle before showing items
  // This prevents the screen from showing only cars if cars finishes first.
  const isLoading = [
    cars.status,
    buses.status,
    services.status,
    equipment.status,
    parts.status,
  ].some((status) => status === 'pending')

  // Isolate fetching next page to only the active category tab
  const isFetchingNextPage = useMemo(() => {
    if (activeCategory === 'cars') return cars.isFetchingNextPage
    if (activeCategory === 'buses') return buses.isFetchingNextPage
    if (activeCategory === 'services') return services.isFetchingNextPage
    if (activeCategory === 'all') {
      return cars.isFetchingNextPage || buses.isFetchingNextPage || services.isFetchingNextPage
    }
    return false
  }, [activeCategory, cars.isFetchingNextPage, buses.isFetchingNextPage, services.isFetchingNextPage])

  // Isolate has next page to only the active category tab
  const hasNextPage = useMemo(() => {
    if (activeCategory === 'cars') return Boolean(cars.hasNextPage)
    if (activeCategory === 'buses') return Boolean(buses.hasNextPage)
    if (activeCategory === 'services') return Boolean(services.hasNextPage)
    if (activeCategory === 'all') {
      return Boolean(cars.hasNextPage || buses.hasNextPage || services.hasNextPage)
    }
    return false
  }, [activeCategory, cars.hasNextPage, buses.hasNextPage, services.hasNextPage])

  const fetchNextPage = useCallback(() => {
    if ((activeCategory === 'cars' || activeCategory === 'all') && cars.hasNextPage && !cars.isFetchingNextPage) {
      cars.fetchNextPage()
    }
    if ((activeCategory === 'buses' || activeCategory === 'all') && buses.hasNextPage && !buses.isFetchingNextPage) {
      buses.fetchNextPage()
    }
    if ((activeCategory === 'services' || activeCategory === 'all') && services.hasNextPage && !services.isFetchingNextPage) {
      services.fetchNextPage()
    }
  }, [
    activeCategory,
    cars.hasNextPage, cars.isFetchingNextPage, cars.fetchNextPage,
    buses.hasNextPage, buses.isFetchingNextPage, buses.fetchNextPage,
    services.hasNextPage, services.isFetchingNextPage, services.fetchNextPage,
  ])

  const refetch = useCallback(async () => {
    await Promise.allSettled([
      cars.refetch(),
      buses.refetch(),
      services.refetch(),
      equipment.refetch(),
      parts.refetch(),
    ])
  }, [
    cars.refetch,
    buses.refetch,
    services.refetch,
    equipment.refetch,
    parts.refetch,
  ])

  return {
    items,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  }
}
