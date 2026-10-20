import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBusSimilarListings, UseBusSimilarListingsResult, SimilarBusItem } from './useBusSimilarListings'
import { busesApi } from '../../api/buses'

jest.mock('../../api/buses', () => ({
  busesApi: {
    getSimilar: jest.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderSimilarBusesHook(
  id: string,
  limit: number | undefined,
  queryClient: QueryClient
) {
  let hookValue: UseBusSimilarListingsResult | undefined

  function Consumer() {
    hookValue = limit !== undefined ? useBusSimilarListings(id, limit) : useBusSimilarListings(id)
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
    get current(): UseBusSimilarListingsResult {
      if (!hookValue) {
        throw new Error('Hook value not yet populated')
      }
      return hookValue
    },
    ...rendered,
  }
}

describe('useBusSimilarListings', () => {
  const mockBuses: SimilarBusItem[] = [
    {
      id: 'bus-sim-1',
      title: 'تويوتا كوستر 2021',
      price: 16000,
      busListingType: 'BUS_SALE',
      busType: 'COASTER',
      make: 'Toyota',
      model: 'Coaster',
      year: 2021,
      capacity: 30,
    } as any,
    {
      id: 'bus-sim-2',
      title: 'ميتسوبيشي روزا 2020',
      price: 14500,
      busListingType: 'BUS_SALE',
      busType: 'COASTER',
      make: 'Mitsubishi',
      model: 'Rosa',
      year: 2020,
      capacity: 26,
    } as any,
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('success: returns items array with isLoading: false and isError: false', async () => {
    ;(busesApi.getSimilar as jest.Mock).mockResolvedValueOnce({
      data: mockBuses,
    })
    const queryClient = createTestQueryClient()

    const hook = renderSimilarBusesHook('bus-123', 8, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.isError).toBe(false)
    expect(hook.current.items).toHaveLength(2)
    expect(hook.current.items[0].id).toBe('bus-sim-1')
    expect(busesApi.getSimilar).toHaveBeenCalledWith('bus-123', 8)
  })

  it('404 gracefully returns empty array without error (isError: false)', async () => {
    const error404 = {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Not found' } },
    }
    ;(busesApi.getSimilar as jest.Mock).mockRejectedValueOnce(error404)
    const queryClient = createTestQueryClient()

    const hook = renderSimilarBusesHook('bus-123', 8, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.isError).toBe(false)
    expect(hook.current.items).toEqual([])
  })

  it('other error: returns isError: true and empty items array', async () => {
    const error500 = {
      isAxiosError: true,
      response: { status: 500, data: { message: 'Server error' } },
    }
    ;(busesApi.getSimilar as jest.Mock).mockRejectedValueOnce(error500)
    const queryClient = createTestQueryClient()

    const hook = renderSimilarBusesHook('bus-123', 8, queryClient)

    await waitFor(() => {
      expect(hook.current.isLoading).toBe(false)
    })

    expect(hook.current.isError).toBe(true)
    expect(hook.current.items).toEqual([])
  })
})
