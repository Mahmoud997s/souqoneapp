import { useMemo, useCallback } from 'react'
import { useMyCarsInfinite } from './queries/useMyCarsInfinite'
import { useMyBusesInfinite } from './queries/useMyBusesInfinite'
import { useMyServicesInfinite } from './queries/useMyServicesInfinite'
import { useMyJobsInfinite } from './queries/useMyJobsInfinite'
import { useMyEquipment } from './queries/useMyEquipment'
import { useMyOperators } from './queries/useMyOperators'
import { useMyParts } from './queries/useMyParts'
import { normalizeAndMerge, extractArray } from '../utils/normalizeAndMerge'
import { MyListingItem } from '../types/my-listings.types'

export interface UseAllMyListingsResult {
  items: MyListingItem[]
  isLoading: boolean
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
  const jobs = useMyJobsInfinite()
  const equipment = useMyEquipment()
  const operators = useMyOperators()
  const parts = useMyParts()

  const items = useMemo(() => {
    return normalizeAndMerge({
      cars: extractPagesItems(cars.data?.pages),
      buses: extractPagesItems(buses.data?.pages),
      services: extractPagesItems(services.data?.pages),
      jobs: extractPagesItems(jobs.data?.pages),
      equipment: equipment.data,
      operators: operators.data,
      parts: parts.data,
    })
  }, [
    cars.data,
    buses.data,
    services.data,
    jobs.data,
    equipment.data,
    operators.data,
    parts.data,
  ])

  // Initial loading: wait for ALL queries to settle before showing items
  // This prevents the screen from showing only cars if cars finishes first.
  const isLoading = [
    cars.status,
    buses.status,
    services.status,
    jobs.status,
    equipment.status,
    operators.status,
    parts.status,
  ].some((status) => status === 'pending')

  // Isolate fetching next page to only the active category tab
  const isFetchingNextPage = useMemo(() => {
    if (activeCategory === 'cars') return cars.isFetchingNextPage
    if (activeCategory === 'buses') return buses.isFetchingNextPage
    if (activeCategory === 'services') return services.isFetchingNextPage
    if (activeCategory === 'jobs') return jobs.isFetchingNextPage
    if (activeCategory === 'all') {
      return cars.isFetchingNextPage || buses.isFetchingNextPage || services.isFetchingNextPage || jobs.isFetchingNextPage
    }
    return false
  }, [activeCategory, cars.isFetchingNextPage, buses.isFetchingNextPage, services.isFetchingNextPage, jobs.isFetchingNextPage])

  // Isolate has next page to only the active category tab
  const hasNextPage = useMemo(() => {
    if (activeCategory === 'cars') return Boolean(cars.hasNextPage)
    if (activeCategory === 'buses') return Boolean(buses.hasNextPage)
    if (activeCategory === 'services') return Boolean(services.hasNextPage)
    if (activeCategory === 'jobs') return Boolean(jobs.hasNextPage)
    if (activeCategory === 'all') {
      return Boolean(cars.hasNextPage || buses.hasNextPage || services.hasNextPage || jobs.hasNextPage)
    }
    return false
  }, [activeCategory, cars.hasNextPage, buses.hasNextPage, services.hasNextPage, jobs.hasNextPage])

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
    if ((activeCategory === 'jobs' || activeCategory === 'all') && jobs.hasNextPage && !jobs.isFetchingNextPage) {
      jobs.fetchNextPage()
    }
  }, [
    activeCategory,
    cars.hasNextPage, cars.isFetchingNextPage, cars.fetchNextPage,
    buses.hasNextPage, buses.isFetchingNextPage, buses.fetchNextPage,
    services.hasNextPage, services.isFetchingNextPage, services.fetchNextPage,
    jobs.hasNextPage, jobs.isFetchingNextPage, jobs.fetchNextPage,
  ])

  const refetch = useCallback(async () => {
    await Promise.allSettled([
      cars.refetch(),
      buses.refetch(),
      services.refetch(),
      jobs.refetch(),
      equipment.refetch(),
      operators.refetch(),
      parts.refetch(),
    ])
  }, [
    cars.refetch,
    buses.refetch,
    services.refetch,
    jobs.refetch,
    equipment.refetch,
    operators.refetch,
    parts.refetch,
  ])

  return {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  }
}
