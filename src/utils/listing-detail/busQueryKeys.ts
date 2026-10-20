import { QueryClient } from '@tanstack/react-query'

/**
 * Single source of truth for bus listing query keys across the application.
 */
export const busQueryKeys = {
  detail: (id: string, isAuthenticated?: boolean) =>
    isAuthenticated !== undefined
      ? (['bus-detail', id, isAuthenticated ? 'auth' : 'guest'] as const)
      : (['bus-detail', id] as const),
  detailPrefix: (id: string) => ['bus-detail', id] as const,
  similar: (id: string, limit = 8) => ['bus-similar', id, limit] as const,
  buses: (params?: unknown) => ['buses', params] as const,
  busesInfinite: (params?: unknown) => ['buses_infinite', params] as const,
  myBuses: () => ['my-buses'] as const,
  myListings: () => ['my-listings'] as const,
  legacyBus: (id: string) => ['bus', id] as const,
  listings: (params?: unknown) => ['listings', params] as const,
}

export interface InvalidateBusListingOptions {
  removeDetail?: boolean
}

/**
 * Invalidates (or removes) all cached queries related to a bus listing:
 * 1. Detail query for the specific bus ID (invalidated or removed depending on options).
 * 2. Legacy 'bus' detail query for backward compatibility.
 * 3. Prefix invalidation for bus standard browse queries (['buses']).
 * 4. Prefix invalidation for bus infinite browse queries (['buses_infinite']).
 * 5. Current user's bus listings (['my-buses'] used in useMyBusesInfinite).
 * 6. Current user's combined listings (['my-listings']).
 * 7. General home listings (['listings']).
 */
export async function invalidateBusListingQueries(
  queryClient: QueryClient,
  id?: string,
  options?: InvalidateBusListingOptions
): Promise<void> {
  if (id) {
    if (options?.removeDetail) {
      queryClient.removeQueries({ queryKey: ['bus-detail', id] })
      queryClient.removeQueries({ queryKey: ['bus', id] })
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bus-detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['bus', id] }),
      ])
    }
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['buses'] }),
    queryClient.invalidateQueries({ queryKey: ['buses_infinite'] }),
    queryClient.invalidateQueries({ queryKey: ['my-buses'] }),
    queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ])
}
