import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '../api/listings'
import { favoritesApi } from '../api/favorites'
import { parseListEnvelope } from '../utils/parseListEnvelope'
import { 
  mapListingToCard, 
  mapServiceToCard,
  mapPartToCard,
  mapBusToCard,
  mapEquipmentToCard,
  mapOperatorToCard,
} from '../utils/mappers'

export function useListings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: async () => {
      const res = await listingsApi.getAll(params)
      const { items } = parseListEnvelope(res.data)
      return items.map(mapListingToCard)
    },
  })
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await listingsApi.getById(id)
      return res.data
    },
    enabled: !!id,
  })
}

export function useMyListings() {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const res = await listingsApi.getMy()
      const { items } = parseListEnvelope(res.data)
      return items.map(mapListingToCard)
    },
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await favoritesApi.getAll()
      const { items: arr } = parseListEnvelope<any>(res.data)
      return arr.map((item: any) => {
        let rawItem;
        let cat;
        
        // If the underlying entity was deleted but the favorite record remains, skip it
        if (!item.listing && !item.job && !item.carService && !item.sparePart && !item.busListing && !item.equipmentListing && !item.operatorListing && !item.entity) {
          return null;
        }
        
        switch (item.entityType) {
          case 'JOB':
            return null;
          case 'CAR_SERVICE':
            rawItem = item.carService ?? item.entity ?? item;
            cat = 'services';
            break;
          case 'SPARE_PART':
            rawItem = item.sparePart ?? item.entity ?? item;
            cat = 'parts';
            break;
          case 'BUS_LISTING':
            rawItem = item.busListing ?? item.entity ?? item;
            cat = 'buses';
            break;
          case 'EQUIPMENT_LISTING':
            rawItem = item.equipmentListing ?? item.entity ?? item;
            cat = 'equipment';
            break;
          case 'OPERATOR_LISTING':
            rawItem = item.operatorListing ?? item.entity ?? item;
            cat = 'operators';
            break;
          case 'LISTING':
          default:
            rawItem = item.listing ?? item.entity ?? item;
            cat = rawItem.category?.toLowerCase() || 'cars';
            break;
        }

        if (rawItem && !rawItem.id && item.entityId) {
          rawItem.id = item.entityId;
        }
        rawItem = { ...rawItem, category: cat };
        
        switch (cat) {
          case 'jobs': return null;
          case 'services': return mapServiceToCard(rawItem);
          case 'parts': return mapPartToCard(rawItem);
          case 'buses': return mapBusToCard(rawItem);
          case 'equipment': return mapEquipmentToCard(rawItem);
          case 'operators': return mapOperatorToCard(rawItem);
          default: return mapListingToCard(rawItem);
        }
      }).filter((item: any) => item !== null) as import('../types/unified-card.types').UnifiedCardItem[]
    },
  })
}
