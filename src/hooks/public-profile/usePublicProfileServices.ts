import { servicesApi } from '../../api/services'
import { Service } from '../../types/listing.types'
import { mapServiceToCard } from '../../utils/mappers'
import { PublicProfileApiPage, usePublicProfilePagedVertical } from './usePublicProfilePagedVertical'

function fetchServicePage(params: Record<string, unknown>): Promise<PublicProfileApiPage<Service>> {
  return servicesApi.getAll(params).then((response) => response.data)
}

export function usePublicProfileServices(userId: string, enabled = true) {
  return usePublicProfilePagedVertical<Service>({
    userId,
    enabled,
    vertical: 'service',
    filters: { userId },
    fetchPage: fetchServicePage,
    mapItem: mapServiceToCard,
  })
}
