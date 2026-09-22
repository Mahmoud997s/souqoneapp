import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../../api/listings'
import { invalidateCarListingQueries } from '../../utils/listing-detail/queryKeys'

export type CarListingStatusAction = 'submit' | 'mark-sold' | 'archive' | 'restore'

export interface ChangeCarListingStatusParams {
  id: string
  action: CarListingStatusAction
  version: number
}

/**
 * Mutation hook for changing a car listing's status ('submit' | 'mark-sold' | 'archive' | 'restore').
 * On success, automatically invalidates both the detail query and all affected list queries
 * via invalidateCarListingQueries.
 */
export function useChangeCarListingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action, version }: ChangeCarListingStatusParams) => {
      const res = await listingsApi.updateStatus(id, action, version)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateCarListingQueries(queryClient, variables.id)
    },
  })
}
