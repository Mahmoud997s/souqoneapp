import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { Listing } from '../../types/listing.types'
import { invalidateCarListingQueries } from '../../utils/listing-detail/queryKeys'

export interface UpdateCarListingParams {
  id: string
  data: Partial<Listing> & { version: number }
}

/**
 * Checks whether an error is caused by optimistic concurrency control conflict (HTTP 409).
 * Occurs when the listing was modified by another session/device and the version counter is stale.
 */
export function isOptimisticLockError(error: unknown): boolean {
  return (error as any)?.response?.status === 409
}

/**
 * Mutation hook for updating an existing car listing.
 * On success, automatically invalidates the detail query and all affected list queries
 * via invalidateCarListingQueries.
 */
export function useUpdateCarListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateCarListingParams) => {
      const res = await listingsApi.update(id, data)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateCarListingQueries(queryClient, variables.id)
    },
  })
}
