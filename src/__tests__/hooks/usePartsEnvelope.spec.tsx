import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { partsApi } from '../../api/parts'
import { useParts } from '../../hooks/useParts'
import { useInfiniteParts } from '../../hooks/useInfiniteParts'
import { ListContractError } from '../../utils/parseListEnvelope'

jest.mock('../../api/parts', () => ({
  partsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}))

jest.mock('../../utils/mappers', () => ({
  mapPartToCard: (item: any) => ({
    id: item.id,
    title: item.title || item.name || item.id,
    raw: item,
  }),
}))

const mockedGetAll = jest.mocked(partsApi.getAll)

let queryClient: QueryClient

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Parts Hooks with S1 parseListEnvelope Contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient?.clear()
  })

  describe('useParts (single query hook)', () => {
    it('returns mapped cards on valid { items, meta } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'part-1', title: 'Front Bumper' }],
          meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(() => useParts({ limit: 15 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('part-1')
      expect(result.current.data?.[0].title).toBe('Front Bumper')
    })

    it('returns empty array [] on valid empty { items: [] } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [],
          meta: { total: 0, page: 1, limit: 15, totalPages: 0 },
        },
      } as never)

      const { result } = await renderHook(() => useParts({ limit: 15 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('enters isError state when response is malformed object missing items', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { error: 'Internal Server Error' },
      } as never)

      const { result } = await renderHook(() => useParts({ limit: 15 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError state when response is null or undefined', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: null,
      } as never)

      const { result } = await renderHook(() => useParts({ limit: 15 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError state when items is not an array', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { items: { id: 'single-object' } },
      } as never)

      const { result } = await renderHook(() => useParts({ limit: 15 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('enters isError state when meta is corrupted (page > totalPages)', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'part-1' }],
          meta: { total: 10, page: 5, limit: 10, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(() => useParts({ limit: 15 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })

  describe('useInfiniteParts (infinite query hook)', () => {
    it('returns items, rawItems, and computes nextPage correctly when page < totalPages', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'part-p1' }],
          meta: { total: 30, page: 1, limit: 10, totalPages: 3 },
        },
      } as never)

      const { result } = await renderHook(() => useInfiniteParts({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const firstPage = result.current.data?.pages[0]
      expect(firstPage?.items).toHaveLength(1)
      expect(firstPage?.rawItems).toEqual([{ id: 'part-p1' }])
      expect(firstPage?.nextPage).toBe(2)
      expect(result.current.hasNextPage).toBe(true)
    })

    it('computes nextPage as undefined and hasNextPage false on last page', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'part-p3' }],
          meta: { total: 30, page: 3, limit: 10, totalPages: 3 },
        },
      } as never)

      const { result } = await renderHook(() => useInfiniteParts({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const lastPage = result.current.data?.pages[0]
      expect(lastPage?.nextPage).toBeUndefined()
      expect(result.current.hasNextPage).toBe(false)
    })

    it('enters isError state when infinite query encounters malformed response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { success: false, message: 'Bad Gateway' },
      } as never)

      const { result } = await renderHook(() => useInfiniteParts({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('enters isError state when infinite query receives corrupted meta', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'part-1' }],
          meta: { total: 20, page: 3, limit: 10, totalPages: 2 },
        },
      } as never)

      const { result } = await renderHook(() => useInfiniteParts({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })
})
