import { QueryClient } from '@tanstack/react-query'

/**
 * Single source of truth for listing query keys across the application.
 */
export const listingKeys = {
  detail: (id: string) => ['listing', id] as const,
  carsInfinite: (params?: unknown) => ['car-listings-infinite', params] as const,
  carsListings: (params?: unknown) => ['car-listings', params] as const,
  homeListings: (params?: unknown) => ['listings', params] as const,
  myCars: () => ['my-cars'] as const,
}

export interface InvalidateCarListingOptions {
  removeDetail?: boolean
}

/**
 * Invalidates (or removes) all cached queries related to a car listing:
 * 1. Detail query for the specific listing ID (invalidated or removed depending on options).
 * 2. Prefix invalidation for car infinite browse queries (all filter variants).
 * 3. Prefix invalidation for car standard browse queries (all filter variants).
 * 4. Prefix invalidation for home / general listings (all filter variants).
 * 5. Prefix invalidation for current user's car listings (my-cars).
 *
 * Note on React Query behavior: By default, queryClient.invalidateQueries({ queryKey })
 * performs a partial/prefix match (exact: false). This guarantees that all variations of
 * cached list parameters are invalidated.
 */
export async function invalidateCarListingQueries(
  queryClient: QueryClient,
  id?: string,
  options?: InvalidateCarListingOptions
): Promise<void> {
  if (id) {
    if (options?.removeDetail) {
      queryClient.removeQueries({ queryKey: listingKeys.detail(id) })
    } else {
      await queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) })
    }
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['car-listings-infinite'] }),
    queryClient.invalidateQueries({ queryKey: ['car-listings'] }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
    queryClient.invalidateQueries({ queryKey: ['my-cars'] }),
  ])
}
