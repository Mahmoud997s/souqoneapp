import { QueryClient } from '@tanstack/react-query'

/**
 * Single source of truth for spare parts query keys across the application.
 */
export const partQueryKeys = {
  detail: (id: string, isAuthenticated?: boolean) =>
    isAuthenticated !== undefined
      ? (['parts-detail', id, isAuthenticated ? 'auth' : 'guest'] as const)
      : (['parts-detail', id] as const),
  detailPrefix: (id: string) => ['parts-detail', id] as const,
  parts: (params?: unknown) => ['parts', params] as const,
  partsInfinite: (params?: unknown) => ['parts-infinite', params] as const,
  partItem: (id: string) => ['parts-item', id] as const,
  legacyPart: (id: string) => ['parts', id] as const,
  myParts: () => ['my-parts'] as const,
  myListings: () => ['my-listings'] as const,
  listings: (params?: unknown) => ['listings', params] as const,
}

export interface InvalidatePartListingOptions {
  removeDetail?: boolean
}

/**
 * Invalidates (or removes) all cached queries related to a spare part listing.
 */
export async function invalidatePartListingQueries(
  queryClient: QueryClient,
  id?: string,
  options?: InvalidatePartListingOptions
): Promise<void> {
  if (id) {
    if (options?.removeDetail) {
      queryClient.removeQueries({ queryKey: partQueryKeys.detailPrefix(id) })
      queryClient.removeQueries({ queryKey: partQueryKeys.partItem(id) })
      queryClient.removeQueries({ queryKey: partQueryKeys.legacyPart(id) })
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: partQueryKeys.detailPrefix(id) }),
        queryClient.refetchQueries({ queryKey: partQueryKeys.detailPrefix(id) }),
        queryClient.invalidateQueries({ queryKey: partQueryKeys.partItem(id) }),
        queryClient.invalidateQueries({ queryKey: partQueryKeys.legacyPart(id) }),
      ])
    }
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['parts'] }),
    queryClient.invalidateQueries({ queryKey: ['parts-infinite'] }),
    queryClient.invalidateQueries({ queryKey: partQueryKeys.myParts() }),
    queryClient.invalidateQueries({ queryKey: partQueryKeys.myListings() }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ])
}
