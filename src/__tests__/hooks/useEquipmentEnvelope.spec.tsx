import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'
import {
  useEquipment,
  useEquipmentInfinite,
  useOperatorsInfinite,
  useMyOperators,
} from '../../hooks/useEquipment'
import { ListContractError } from '../../utils/parseListEnvelope'

jest.mock('../../api/equipment', () => ({
  equipmentApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getOperators: jest.fn(),
    getMyOperators: jest.fn(),
  },
}))

jest.mock('../../utils/mappers', () => ({
  mapEquipmentToCard: (item: any) => ({
    id: item.id,
    title: item.title || item.id,
    category: 'equipment',
    raw: item,
  }),
  mapOperatorToCard: (item: any) => ({
    id: item.id,
    title: item.title || item.id,
    category: 'operators',
    raw: item,
  }),
}))

const mockedGetAll = jest.mocked(equipmentApi.getAll)
const mockedGetOperators = jest.mocked(equipmentApi.getOperators)
const mockedGetMyOperators = jest.mocked(equipmentApi.getMyOperators)

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

describe('Equipment Hooks with S1 parseListEnvelope Contract (D-264)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient?.clear()
  })

  describe('useEquipment (single query hook)', () => {
    it('returns mapped cards on valid { items, meta } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'eq-1', title: 'حفارة كاتربيلر 320D' }],
          meta: { total: 1, page: 1, limit: 8, totalPages: 1 },
        },
      } as never)

      const { result } = await renderHook(() => useEquipment({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('eq-1')
      expect(result.current.data?.[0].title).toBe('حفارة كاتربيلر 320D')
    })

    it('returns mapped cards on direct array response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [{ id: 'eq-arr-1', title: 'رافعة شوكية' }],
      } as never)

      const { result } = await renderHook(() => useEquipment({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].id).toBe('eq-arr-1')
    })

    it('returns empty array [] on valid empty { items: [] } response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [],
          meta: { total: 0, page: 1, limit: 8, totalPages: 0 },
        },
      } as never)

      const { result } = await renderHook(() => useEquipment({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('enters isError with ListContractError when response is null', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: null,
      } as never)

      const { result } = await renderHook(() => useEquipment({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError with ListContractError when response is empty object {} without items', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {},
      } as never)

      const { result } = await renderHook(() => useEquipment({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.data).toBeUndefined()
    })

    it('enters isError with ListContractError when items is not an array', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { items: { id: 'not-an-array' } },
      } as never)

      const { result } = await renderHook(() => useEquipment({ limit: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })

  describe('useEquipmentInfinite (infinite query hook)', () => {
    it('extracts items, meta, and computes nextPage when page < totalPages', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'eq-p1', title: 'شيول كوماتسو' }],
          meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
        },
      } as never)

      const { result } = await renderHook(() => useEquipmentInfinite(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const firstPage = result.current.data?.pages[0]
      expect(firstPage?.items).toHaveLength(1)
      expect(firstPage?.meta).toEqual({ total: 25, page: 1, limit: 10, totalPages: 3 })
      expect(firstPage?.nextPage).toBe(2)
      expect(result.current.hasNextPage).toBe(true)
    })

    it('computes nextPage undefined and hasNextPage false on final page', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: {
          items: [{ id: 'eq-p3', title: 'مولد كهرباء' }],
          meta: { total: 25, page: 3, limit: 10, totalPages: 3 },
        },
      } as never)

      const { result } = await renderHook(() => useEquipmentInfinite(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const lastPage = result.current.data?.pages[0]
      expect(lastPage?.meta).toEqual({ total: 25, page: 3, limit: 10, totalPages: 3 })
      expect(lastPage?.nextPage).toBeUndefined()
      expect(result.current.hasNextPage).toBe(false)
    })

    it('supports direct array response without meta (hasNextPage: false)', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: [{ id: 'eq-direct', title: 'كمبريسر هواء' }],
      } as never)

      const { result } = await renderHook(() => useEquipmentInfinite(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages[0].items).toHaveLength(1)
      expect(result.current.data?.pages[0].nextPage).toBeUndefined()
      expect(result.current.hasNextPage).toBe(false)
    })

    it('enters isError with ListContractError on malformed infinite response', async () => {
      mockedGetAll.mockResolvedValueOnce({
        data: { ok: false },
      } as never)

      const { result } = await renderHook(() => useEquipmentInfinite(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(ListContractError)
    })
  })

  describe('useOperatorsInfinite & useMyOperators contract', () => {
    it('extracts operators { items, meta } cleanly and rejects malformed payload', async () => {
      mockedGetOperators.mockResolvedValueOnce({
        data: {
          items: [{ id: 'op-1', title: 'مشغل حفارة' }],
          meta: { total: 12, page: 1, limit: 10, totalPages: 2 },
        },
      } as never)

      const { result } = await renderHook(() => useOperatorsInfinite(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages[0].items).toHaveLength(1)
      expect(result.current.data?.pages[0].nextPage).toBe(2)

      mockedGetOperators.mockResolvedValueOnce({
        data: null,
      } as never)

      const { result: errResult } = await renderHook(() => useOperatorsInfinite({ q: 'bad' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(errResult.current.isError).toBe(true))
      expect(errResult.current.error).toBeInstanceOf(ListContractError)
    })

    it('accepts direct array for useMyOperators and rejects empty object', async () => {
      mockedGetMyOperators.mockResolvedValueOnce({
        data: [{ id: 'my-op-1', title: 'مشغل كرين' }],
      } as never)

      const { result } = await renderHook(() => useMyOperators(true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(1)

      mockedGetMyOperators.mockResolvedValueOnce({
        data: {},
      } as never)

      const queryClient2 = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { result: errResult } = await renderHook(() => useMyOperators(true), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient2}>{children}</QueryClientProvider>
        ),
      })

      await waitFor(() => expect(errResult.current.isError).toBe(true))
      expect(errResult.current.error).toBeInstanceOf(ListContractError)
      queryClient2.clear()
    })
  })
})
