import { QueryClient } from '@tanstack/react-query'

/**
 * Single source of truth for equipment listing query keys across the application.
 */
export const equipmentQueryKeys = {
  detail: (id: string, isAuthenticated?: boolean) =>
    isAuthenticated !== undefined
      ? (['equipment-detail', id, isAuthenticated ? 'auth' : 'guest'] as const)
      : (['equipment-detail', id] as const),
  detailPrefix: (id: string) => ['equipment-detail', id] as const,
  similar: (id: string, limit = 8) => ['equipment-similar', id, limit] as const,
  equipment: (params?: unknown) => ['equipment', params] as const,
  equipmentInfinite: (params?: unknown) => ['equipment-infinite', params] as const,
  equipmentItem: (id: string) => ['equipment-item', id] as const,
  myEquipment: () => ['my-equipment'] as const,
  myListings: () => ['my-listings'] as const,
  legacyEquipment: (id: string) => ['equipment', id] as const,
  listings: (params?: unknown) => ['listings', params] as const,
}

export interface InvalidateEquipmentListingOptions {
  removeDetail?: boolean
}

/**
 * Invalidates (or removes) all cached queries related to an equipment listing:
 * 1. Detail query for the specific equipment ID (invalidated or removed depending on options).
 * 2. Legacy 'equipment' and 'equipment-item' detail queries for backward compatibility.
 * 3. Prefix invalidation for equipment standard browse queries (['equipment']).
 * 4. Prefix invalidation for equipment infinite browse queries (['equipment-infinite']).
 * 5. Current user's equipment listings (['my-equipment']).
 * 6. Current user's combined listings (['my-listings']).
 * 7. General home listings (['listings']).
 */
export async function invalidateEquipmentListingQueries(
  queryClient: QueryClient,
  id?: string,
  options?: InvalidateEquipmentListingOptions
): Promise<void> {
  if (id) {
    if (options?.removeDetail) {
      queryClient.removeQueries({ queryKey: equipmentQueryKeys.detailPrefix(id) })
      queryClient.removeQueries({ queryKey: equipmentQueryKeys.equipmentItem(id) })
      queryClient.removeQueries({ queryKey: equipmentQueryKeys.legacyEquipment(id) })
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.detailPrefix(id) }),
        queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.equipmentItem(id) }),
        queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.legacyEquipment(id) }),
      ])
    }
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['equipment'] }),
    queryClient.invalidateQueries({ queryKey: ['equipment-infinite'] }),
    queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.myEquipment() }),
    queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.myListings() }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ])
}
