import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { invalidateCarListingQueries } from '../../utils/listing-detail/queryKeys'

/**
 * Mutation hook for deleting an existing car listing.
 * On success, removes the detail query from cache (since it no longer exists)
 * and invalidates all affected list queries via invalidateCarListingQueries.
 */
export function useDeleteCarListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await listingsApi.remove(id)
    },
    onSuccess: async (_, id) => {
      await invalidateCarListingQueries(queryClient, id, { removeDetail: true })
    },
  })
}
