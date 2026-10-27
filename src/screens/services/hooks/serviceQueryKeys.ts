import type { QueryClient } from '@tanstack/react-query'

/**
 * Standard query keys for Car Service listing data fetching & cache invalidation.
 */
export const serviceQueryKeys = {
  all: ['services'] as const,
  lists: () => [...serviceQueryKeys.all, 'list'] as const,
  infinite: () => [...serviceQueryKeys.all, 'infinite'] as const,
  my: () => [...serviceQueryKeys.all, 'my'] as const,
  details: () => [...serviceQueryKeys.all, 'detail'] as const,
  detail: (id: string, auth: boolean) =>
    ['services-detail', id, auth ? 'auth' : 'guest'] as const,
}

export interface InvalidateServiceListingQueriesOptions {
  /**
   * If true, also removes the specific detail query from the cache (e.g. after deletion).
   */
  removeDetail?: boolean
}

/**
 * Invalidate all queries related to service listings (infinite lists, my services, general listings)
 * and optionally the detail query for a specific service ID.
 */
export async function invalidateServiceListingQueries(
  queryClient: QueryClient,
  id?: string,
  options?: InvalidateServiceListingQueriesOptions
): Promise<void> {
  const promises: Promise<unknown>[] = [
    queryClient.invalidateQueries({ queryKey: ['services'] }),
    queryClient.invalidateQueries({ queryKey: ['services-infinite'] }),
    queryClient.invalidateQueries({ queryKey: ['my-services'] }),
    queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ]

  if (id) {
    if (options?.removeDetail) {
      queryClient.removeQueries({ queryKey: ['services-detail', id] })
    } else {
      promises.push(
        queryClient.invalidateQueries({ queryKey: ['services-detail', id] })
      )
    }
  }

  await Promise.all(promises)
}
