import { busesApi } from '../../api/buses'
import { BusListing } from '../../types/bus.types'
import { mapBusToCard } from '../../utils/mappers'
import { PublicProfileApiPage } from './usePublicProfilePagedVertical'
import { usePublicProfilePagedVertical } from './usePublicProfilePagedVertical'

function fetchBusPage(params: Record<string, unknown>): Promise<PublicProfileApiPage<BusListing>> {
  return busesApi.getAll(params).then((response) => response.data)
}

export function usePublicProfileBuses(userId: string, enabled = true) {
  return usePublicProfilePagedVertical<BusListing>({
    userId,
    enabled,
    vertical: 'bus',
    filters: { userId },
    fetchPage: fetchBusPage,
    mapItem: mapBusToCard,
  })
}
