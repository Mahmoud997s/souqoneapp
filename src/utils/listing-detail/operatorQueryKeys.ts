import { QueryClient } from '@tanstack/react-query'

/**
 * Single source of truth for operator listing query keys across the mobile application.
 */
export const operatorQueryKeys = {
  detail: (id: string, isAuthenticated?: boolean) =>
    isAuthenticated !== undefined
      ? (['operator-detail', id, isAuthenticated ? 'auth' : 'guest'] as const)
      : (['operator-detail', id] as const),
  detailPrefix: (id: string) => ['operator-detail', id] as const,
  reviews: (id: string) => ['reviews', id] as const,
  operators: (params?: unknown) => ['operators', params] as const,
  operatorsInfinite: (params?: unknown) => ['operators-infinite', params] as const,
  operatorItem: (id: string) => ['operator-item', id] as const,
  myOperators: () => ['my-operators'] as const,
  myListings: () => ['my-listings'] as const,
  listings: (params?: unknown) => ['listings', params] as const,
}

export interface InvalidateOperatorListingOptions {
  removeDetail?: boolean
}

/**
 * Invalidates (or removes) all cached queries related to an operator listing:
 * 1. Detail query for the specific operator ID (['operator-detail', id] and legacy ['operator-item', id]).
 * 2. Prefix invalidation for operators standard and infinite browse queries (['operators'], ['operators-infinite']).
 * 3. Current user's operator listings (['my-operators']).
 * 4. Current user's combined listings (['my-listings']).
 * 5. Reviews query for the operator ID (['reviews', id]).
 * 6. General home listings (['listings']).
 */
export async function invalidateOperatorListingQueries(
  queryClient: QueryClient,
  id?: string,
  options?: InvalidateOperatorListingOptions
): Promise<void> {
  if (id) {
    if (options?.removeDetail) {
      queryClient.removeQueries({ queryKey: operatorQueryKeys.detailPrefix(id) })
      queryClient.removeQueries({ queryKey: operatorQueryKeys.operatorItem(id) })
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: operatorQueryKeys.detailPrefix(id) }),
        queryClient.invalidateQueries({ queryKey: operatorQueryKeys.operatorItem(id) }),
      ])
    }
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.reviews(id) })
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['operators'] }),
    queryClient.invalidateQueries({ queryKey: ['operators-infinite'] }),
    queryClient.invalidateQueries({ queryKey: operatorQueryKeys.myOperators() }),
    queryClient.invalidateQueries({ queryKey: operatorQueryKeys.myListings() }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ])
}
