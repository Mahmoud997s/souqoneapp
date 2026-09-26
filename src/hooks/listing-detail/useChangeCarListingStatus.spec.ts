import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useChangeCarListingStatus } from './useChangeCarListingStatus'
import { listingsApi } from '../../api/listings'
import * as queryKeysModule from '../../utils/listing-detail/queryKeys'

jest.mock('../../api/listings', () => ({
  listingsApi: {
    updateStatus: jest.fn(),
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

function renderStatusHook(queryClient: QueryClient) {
  let hookValue: ReturnType<typeof useChangeCarListingStatus> | undefined

  function Consumer() {
    hookValue = useChangeCarListingStatus()
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

describe('useChangeCarListingStatus', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('successfully calls listingsApi.updateStatus and triggers invalidateCarListingQueries', async () => {
    const invalidateSpy = jest.spyOn(queryKeysModule, 'invalidateCarListingQueries')
    const mockResponse = { id: 'car-789', status: 'SOLD', version: 3 }

    ;(listingsApi.updateStatus as jest.Mock).mockResolvedValueOnce({
      data: mockResponse,
    })

    const hook = renderStatusHook(queryClient)
    await waitFor(() => expect(hook.current).toBeDefined())

    await act(async () => {
      await hook.current!.mutateAsync({
        id: 'car-789',
        action: 'mark-sold',
        version: 2,
      })
    })

    expect(listingsApi.updateStatus).toHaveBeenCalledTimes(1)
    expect(listingsApi.updateStatus).toHaveBeenCalledWith('car-789', 'mark-sold', 2)

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenCalledWith(queryClient, 'car-789')
  })

  it('surfaces error and does NOT invalidate queries when API fails', async () => {
    const invalidateSpy = jest.spyOn(queryKeysModule, 'invalidateCarListingQueries')

    ;(listingsApi.updateStatus as jest.Mock).mockRejectedValueOnce(
      new Error('Status update rejected')
    )

    const hook = renderStatusHook(queryClient)
    await waitFor(() => expect(hook.current).toBeDefined())

    await act(async () => {
      await expect(
        hook.current!.mutateAsync({
          id: 'car-789',
          action: 'archive',
          version: 2,
        })
      ).rejects.toThrow('Status update rejected')
    })

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
