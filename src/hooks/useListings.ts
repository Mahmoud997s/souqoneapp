import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '../api/listings'
import { favoritesApi } from '../api/favorites'
import { 
  mapListingToCard, 
  mapJobToCard,
  mapServiceToCard,
  mapPartToCard,
  mapBusToCard,
  mapEquipmentToCard,
} from '../utils/mappers'

export function useListings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: async () => {
      try {
        const res = await listingsApi.getAll(params);
        const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map(mapListingToCard);
      } catch (err) {
        throw err;
      }
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
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map(mapListingToCard)
    },
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await favoritesApi.getAll()
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      const arr = Array.isArray(raw) ? raw : []
      return arr.map((item: any) => {
        let rawItem;
        let cat;
        
        // If the underlying entity was deleted but the favorite record remains, skip it
        if (!item.listing && !item.job && !item.carService && !item.sparePart && !item.busListing && !item.equipmentListing && !item.entity) {
          return null;
        }
        
        switch (item.entityType) {
          case 'JOB':
            rawItem = item.job ?? item.entity ?? item;
            cat = 'jobs';
            break;
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
          case 'jobs': return mapJobToCard(rawItem);
          case 'services': return mapServiceToCard(rawItem);
          case 'parts': return mapPartToCard(rawItem);
          case 'buses': return mapBusToCard(rawItem);
          case 'equipment': return mapEquipmentToCard(rawItem);
          default: return mapListingToCard(rawItem);
        }
      }).filter((item: any) => item !== null) as import('../components/cards/UnifiedCard').UnifiedCardItem[]
    },
  })
}
