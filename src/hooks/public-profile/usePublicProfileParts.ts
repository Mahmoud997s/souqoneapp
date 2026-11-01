import { partsApi } from '../../api/parts'
import { Part } from '../../types/listing.types'
import { mapPartToCard } from '../../utils/mappers'
import { PublicProfileApiPage, usePublicProfilePagedVertical } from './usePublicProfilePagedVertical'

function fetchPartPage(params: Record<string, unknown>): Promise<PublicProfileApiPage<Part>> {
  return partsApi.getAll(params).then((response) => response.data)
}

export function usePublicProfileParts(userId: string, enabled = true) {
  return usePublicProfilePagedVertical<Part>({
    userId,
    enabled,
    vertical: 'part',
    filters: { sellerId: userId },
    fetchPage: fetchPartPage,
    mapItem: mapPartToCard,
  })
}
