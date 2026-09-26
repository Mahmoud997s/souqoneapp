import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDeleteCarListing } from './useDeleteCarListing'
import { listingsApi } from '../../api/listings'
import * as queryKeysModule from '../../utils/listing-detail/queryKeys'

jest.mock('../../api/listings', () => ({
  listingsApi: {
    remove: jest.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderDeleteHook(queryClient: QueryClient) {
  let hookValue: ReturnType<typeof useDeleteCarListing> | undefined

  function Consumer() {
    hookValue = useDeleteCarListing()
    return null
  }

  const rendered = render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Consumer)
    )
  )

  return {
    get current() {
      return hookValue
    },
    ...rendered,
  }
}

describe('useDeleteCarListing', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('successfully calls listingsApi.remove and triggers invalidateCarListingQueries with removeDetail: true', async () => {
    const invalidateSpy = jest.spyOn(queryKeysModule, 'invalidateCarListingQueries')
    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries')

    ;(listingsApi.remove as jest.Mock).mockResolvedValueOnce({ data: { success: true } })

    const hook = renderDeleteHook(queryClient)
    await waitFor(() => expect(hook.current).toBeDefined())

    await act(async () => {
      await hook.current!.mutateAsync('car-delete-123')
    })

    expect(listingsApi.remove).toHaveBeenCalledTimes(1)
    expect(listingsApi.remove).toHaveBeenCalledWith('car-delete-123')

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenCalledWith(queryClient, 'car-delete-123', {
      removeDetail: true,
    })

    expect(removeQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['listing', 'car-delete-123'],
    })
  })

  it('surfaces error and does NOT invalidate or remove queries when API fails', async () => {
    const invalidateSpy = jest.spyOn(queryKeysModule, 'invalidateCarListingQueries')
    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries')

    ;(listingsApi.remove as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'))

    const hook = renderDeleteHook(queryClient)
    await waitFor(() => expect(hook.current).toBeDefined())

    await act(async () => {
      await expect(hook.current!.mutateAsync('car-delete-123')).rejects.toThrow('Delete failed')
    })

    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(removeQueriesSpy).not.toHaveBeenCalled()
  })
})
