import { equipmentApi } from '../../api/equipment'
import { EquipmentListing } from '../../types/equipment.types'
import { mapEquipmentToCard } from '../../utils/mappers'
import { PublicProfileApiPage } from './usePublicProfilePagedVertical'
import { usePublicProfilePagedVertical } from './usePublicProfilePagedVertical'

function fetchEquipmentPage(params: Record<string, unknown>): Promise<PublicProfileApiPage<EquipmentListing>> {
  return equipmentApi.getAll(params).then((response) => response.data)
}

export function usePublicProfileEquipment(userId: string, enabled = true) {
  return usePublicProfilePagedVertical<EquipmentListing>({
    userId,
    enabled,
    vertical: 'equipment',
    filters: { userId, status: 'ACTIVE' },
    fetchPage: fetchEquipmentPage,
    mapItem: mapEquipmentToCard,
  })
}
