import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { servicesApi } from '../../api/services'
import { useServices } from '../../hooks/useServices'
import { useInfiniteServices } from '../../hooks/useInfiniteServices'
import { ListContractError } from '../../utils/parseListEnvelope'

jest.mock('../../api/services', () => ({
  servicesApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}))

jest.mock('../../utils/mappers', () => ({
  mapServiceToCard: (item: any) => ({
    id: item.id,
    title: item.title || item.name || item.id,
    raw: item,
  }),
}))

const mockedGetAll = jest.mocked(servicesApi.getAll)

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

describe('Services Hooks with S1 parseListEnvelope Contract (D-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient?.clear()
  })

  describe('useServices (single query hook)', () => {
    it('returns mapped cards on valid { items, meta } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'svc-1', title: 'فحص كمبيوتر شامل' }],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('svc-1')
      expect(result.current.data?.[0].title).toBe('فحص كمبيوتر شامل')
    })

    it('returns mapped cards on direct array response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [{ id: 'svc-arr-1', title: 'غسيل وتلميع داخلي' }],
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('svc-arr-1')
    })

    it('returns empty array [] on valid empty { items: [], meta } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        },
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('enters isError state when response is malformed object missing items', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { error: 'Internal Server Error' },
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError state when response is null', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: null,
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError state when response is primitive number', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: 12345,
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('enters isError state when items is not an array', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { items: { id: 'single-object' } },
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('enters isError state when meta is corrupted (page > totalPages)', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'svc-1' }],
          meta: { total: 10, page: 5, limit: 10, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(() => useServices({ limit: 20 }, { retry: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })

  describe('useInfiniteServices (infinite query hook)', () => {
    it('returns items, rawItems, and computes nextPage correctly when page < totalPages', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'svc-p1', title: 'تغيير زيوت' }],
          meta: { total: 30, page: 1, limit: 10, totalPages: 3 },
        },
      } as never)

      const { result } = await renderHook(() => useInfiniteServices({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const firstPage = result.current.data?.pages[0]
      expect(firstPage?.items).toHaveLength(1)
      expect(firstPage?.rawItems).toEqual([{ id: 'svc-p1', title: 'تغيير زيوت' }])
      expect(firstPage?.nextPage).toBe(2)
      expect(result.current.hasNextPage).toBe(true)
    })

    it('returns mapped items and nextPage undefined on direct array response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [{ id: 'svc-direct-1', title: 'صيانة مكيف' }],
      } as never)

      const { result } = await renderHook(() => useInfiniteServices({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const firstPage = result.current.data?.pages[0]
      expect(firstPage?.items).toHaveLength(1)
      expect(firstPage?.nextPage).toBeUndefined()
      expect(result.current.hasNextPage).toBe(false)
    })

    it('computes nextPage as undefined and hasNextPage false on last page', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'svc-p3' }],
          meta: { total: 30, page: 3, limit: 10, totalPages: 3 },
        },
      } as never)

      const { result } = await renderHook(() => useInfiniteServices({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const lastPage = result.current.data?.pages[0]
      expect(lastPage?.nextPage).toBeUndefined()
      expect(result.current.hasNextPage).toBe(false)
    })

    it('enters isError state when infinite query encounters null response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: null,
      } as never)

      const { result } = await renderHook(() => useInfiniteServices({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('enters isError state when infinite query encounters malformed object', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { success: false, message: 'Bad Gateway' },
      } as never)

      const { result } = await renderHook(() => useInfiniteServices({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })

    it('enters isError state when infinite query encounters primitive number', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: 999,
      } as never)

      const { result } = await renderHook(() => useInfiniteServices({ limit: 10 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })
})
