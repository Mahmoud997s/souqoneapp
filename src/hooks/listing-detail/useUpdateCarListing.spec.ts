import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpdateCarListing, isOptimisticLockError } from './useUpdateCarListing'
import { listingsApi } from '../../api/listings'
import * as queryKeysModule from '../../utils/listing-detail/queryKeys'

jest.mock('../../api/listings', () => ({
  listingsApi: {
    update: jest.fn(),
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

function renderUpdateHook(queryClient: QueryClient) {
  let hookValue: ReturnType<typeof useUpdateCarListing> | undefined

  function Consumer() {
    hookValue = useUpdateCarListing()
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

describe('useUpdateCarListing', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
  })

  it('successfully calls listingsApi.update and triggers invalidateCarListingQueries', async () => {
    const invalidateSpy = jest.spyOn(queryKeysModule, 'invalidateCarListingQueries')
    const mockUpdatedListing = { id: 'car-123', title: 'تويوتا كامري 2023', version: 2 }

    ;(listingsApi.update as jest.Mock).mockResolvedValueOnce({
      data: mockUpdatedListing,
    })

    const hook = renderUpdateHook(queryClient)
    await waitFor(() => expect(hook.current).toBeDefined())

    await act(async () => {
      await hook.current!.mutateAsync({
        id: 'car-123',
        data: { title: 'تويوتا كامري 2023', version: 1 } as any,
      })
    })

    expect(listingsApi.update).toHaveBeenCalledTimes(1)
    expect(listingsApi.update).toHaveBeenCalledWith('car-123', {
      title: 'تويوتا كامري 2023',
      version: 1,
    })

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenCalledWith(queryClient, 'car-123')
  })

  it('surfaces error and does NOT invalidate queries when API fails', async () => {
    const invalidateSpy = jest.spyOn(queryKeysModule, 'invalidateCarListingQueries')
    const networkError = new Error('Network failure')

    ;(listingsApi.update as jest.Mock).mockRejectedValueOnce(networkError)

    const hook = renderUpdateHook(queryClient)
    await waitFor(() => expect(hook.current).toBeDefined())

    await act(async () => {
      await expect(
        hook.current!.mutateAsync({
          id: 'car-123',
          data: { version: 1 } as any,
        })
      ).rejects.toThrow('Network failure')
    })

    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('correctly detects optimistic lock conflict error (HTTP 409)', () => {
    const conflictError = {
      response: {
        status: 409,
        data: { message: 'Listing has been modified by another process' },
      },
    }
    const badRequestError = {
      response: {
        status: 400,
        data: { message: 'Invalid payload' },
      },
    }
    const genericError = new Error('Unknown error')

    expect(isOptimisticLockError(conflictError)).toBe(true)
    expect(isOptimisticLockError(badRequestError)).toBe(false)
    expect(isOptimisticLockError(genericError)).toBe(false)
    expect(isOptimisticLockError(null)).toBe(false)
    expect(isOptimisticLockError(undefined)).toBe(false)
  })
})
