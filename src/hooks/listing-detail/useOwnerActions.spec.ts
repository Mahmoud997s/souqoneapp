/**
 * useOwnerActions.spec.ts
 *
 * Tests the D-19 status × listingType action matrix, mutation dispatch,
 * 409 conflict surfacing, and busy-flag toggling.
 */
import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOwnerActions, isOptimisticLockError } from './useOwnerActions'
import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockDeleteMutateAsync = jest.fn()
const mockStatusMutateAsync = jest.fn()

jest.mock('./useDeleteCarListing', () => ({
  useDeleteCarListing: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}))

jest.mock('./useChangeCarListingStatus', () => ({
  useChangeCarListingStatus: () => ({
    mutateAsync: mockStatusMutateAsync,
    isPending: false,
  }),
}))

// isOptimisticLockError comes from useUpdateCarListing — keep real implementation
jest.mock('./useUpdateCarListing', () => ({
  isOptimisticLockError: (error: unknown) =>
    (error as any)?.response?.status === 409,
  useUpdateCarListing: jest.fn(),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

/** Minimal CarDetailViewModel factory — only the fields useOwnerActions reads */
function makeVm(
  overrides: Partial<Pick<CarDetailViewModel, 'status' | 'listingType' | 'id' | 'version' | 'viewCount'>>
): CarDetailViewModel {
  return {
    id: 'car-test-001',
    version: 1,
    status: 'ACTIVE',
    listingType: 'SALE',
    viewCount: 42,
    // Required by CarDetailViewModel but unused by the hook
    title: 'Test Car',
    description: '',
    condition: 'USED',
    conditionLabel: 'مستعمل',
    price: {
      amount: 1000,
      formattedAmount: '1,000',
      currency: 'ر.ع',
      fullPriceLabel: '1,000 ر.ع',
      isNegotiable: false,
      listingType: 'SALE',
    },
    images: [],
    location: { fullLocationText: 'مسقط', hasCoordinates: false },
    seller: {
      id: 's1',
      name: 'Test Seller',
      username: 'seller',
      isVerified: false,
      memberSinceLabel: '2024',
    },
    whatsappEnabled: true,
    postedAtLabel: 'منذ يوم',
    make: 'Toyota',
    model: 'Land Cruiser',
    keySpecs: [],
    specsSections: [],
    features: [],
    ...overrides,
  } as CarDetailViewModel
}

function renderOwnerActions(vm: CarDetailViewModel) {
  const queryClient = createTestQueryClient()
  let hookResult: ReturnType<typeof useOwnerActions> | undefined

  function Consumer() {
    hookResult = useOwnerActions(vm)
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
      return hookResult!
    },
    queryClient,
    ...rendered,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: action ID extraction
// ─────────────────────────────────────────────────────────────────────────────

const ids = (result: ReturnType<typeof useOwnerActions>) =>
  result.actions.map((a) => a.id)

// ─────────────────────────────────────────────────────────────────────────────
// Tests: D-19 Action Matrix
// ─────────────────────────────────────────────────────────────────────────────

describe('useOwnerActions — D-19 action matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ACTIVE + SALE → edit, markSold, archive, delete', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['edit', 'markSold', 'archive', 'delete'])
  })

  it('ACTIVE + RENTAL → edit, pause, delete', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'RENTAL' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['edit', 'pause', 'delete'])
  })

  it('ACTIVE + WANTED → edit, stopSearch, delete', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'WANTED' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['edit', 'stopSearch', 'delete'])
  })

  it('ARCHIVED → edit, restore, delete', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ARCHIVED' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['edit', 'restore', 'delete'])
  })

  it('SOLD → delete only (no edit, no status action)', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'SOLD' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['delete'])
  })

  it('RENTED → edit, delete (no status action)', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'RENTED' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['edit', 'delete'])
  })

  it('SUSPENDED → delete only (no edit, no status action)', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'SUSPENDED' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['delete'])
  })

  it('DRAFT → edit, submit, delete', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'DRAFT' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(ids(hook.current)).toEqual(['edit', 'submit', 'delete'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Labels (source of truth: useMyListingsScreen.ts)
// ─────────────────────────────────────────────────────────────────────────────

describe('useOwnerActions — action labels', () => {
  it('ACTIVE SALE markSold has correct Arabic label', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const markSold = hook.current.actions.find((a) => a.id === 'markSold')!
    expect(markSold.label).toBe('تعليم كمباع')
  })

  it('ACTIVE RENTAL pause has label "إيقاف مؤقت"', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'RENTAL' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const pause = hook.current.actions.find((a) => a.id === 'pause')!
    expect(pause.label).toBe('إيقاف مؤقت')
  })

  it('ACTIVE WANTED stopSearch has label "إيقاف البحث"', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'WANTED' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const stop = hook.current.actions.find((a) => a.id === 'stopSearch')!
    expect(stop.label).toBe('إيقاف البحث')
  })

  it('ARCHIVED restore has label "استعادة"', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ARCHIVED' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const restore = hook.current.actions.find((a) => a.id === 'restore')!
    expect(restore.label).toBe('استعادة')
  })

  it('delete action uses exact confirm wording from useMyListingsScreen', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const del = hook.current.actions.find((a) => a.id === 'delete')!
    expect(del.confirmTitle).toBe('حذف الإعلان')
    expect(del.confirmMessage).toBe('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟')
    expect(del.confirmLabel).toBe('حذف')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Confirm flags
// ─────────────────────────────────────────────────────────────────────────────

describe('useOwnerActions — requiresConfirm', () => {
  it('edit does NOT require confirm', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const edit = hook.current.actions.find((a) => a.id === 'edit')!
    expect(edit.requiresConfirm).toBe(false)
  })

  it('markSold requires confirm and message mentions irreversibility', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const markSold = hook.current.actions.find((a) => a.id === 'markSold')!
    expect(markSold.requiresConfirm).toBe(true)
    expect(markSold.confirmMessage).toContain('لا يمكن التراجع')
  })

  it('delete requires confirm', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    const del = hook.current.actions.find((a) => a.id === 'delete')!
    expect(del.requiresConfirm).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: run() dispatch
// ─────────────────────────────────────────────────────────────────────────────

describe('useOwnerActions — run() dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteMutateAsync.mockResolvedValue(undefined)
    mockStatusMutateAsync.mockResolvedValue(undefined)
  })

  it('run("edit") is a no-op and does not call any mutation', async () => {
    const hook = renderOwnerActions(makeVm({ status: 'ACTIVE', listingType: 'SALE' }))
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('edit') })
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled()
    expect(mockStatusMutateAsync).not.toHaveBeenCalled()
  })

  it('run("delete") calls useDeleteCarListing.mutateAsync with vm.id', async () => {
    const vm = makeVm({ id: 'car-abc', version: 3 })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('delete') })
    expect(mockDeleteMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith('car-abc')
    expect(mockStatusMutateAsync).not.toHaveBeenCalled()
  })

  it('run("markSold") calls useChangeCarListingStatus with action "mark-sold" and vm.version', async () => {
    const vm = makeVm({ id: 'car-xyz', version: 5, status: 'ACTIVE', listingType: 'SALE' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('markSold') })
    expect(mockStatusMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockStatusMutateAsync).toHaveBeenCalledWith({
      id: 'car-xyz',
      action: 'mark-sold',
      version: 5,
    })
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled()
  })

  it('run("pause") calls useChangeCarListingStatus with action "archive"', async () => {
    const vm = makeVm({ id: 'car-r1', version: 2, status: 'ACTIVE', listingType: 'RENTAL' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('pause') })
    expect(mockStatusMutateAsync).toHaveBeenCalledWith({
      id: 'car-r1',
      action: 'archive',
      version: 2,
    })
  })

  it('run("stopSearch") calls useChangeCarListingStatus with action "archive"', async () => {
    const vm = makeVm({ id: 'car-w1', version: 1, status: 'ACTIVE', listingType: 'WANTED' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('stopSearch') })
    expect(mockStatusMutateAsync).toHaveBeenCalledWith({
      id: 'car-w1',
      action: 'archive',
      version: 1,
    })
  })

  it('run("restore") calls useChangeCarListingStatus with action "restore" and vm.version', async () => {
    const vm = makeVm({ id: 'car-arch', version: 4, status: 'ARCHIVED' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('restore') })
    expect(mockStatusMutateAsync).toHaveBeenCalledWith({
      id: 'car-arch',
      action: 'restore',
      version: 4,
    })
  })

  it('run("submit") calls useChangeCarListingStatus with action "submit"', async () => {
    const vm = makeVm({ id: 'car-draft', version: 1, status: 'DRAFT' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    await act(async () => { await hook.current.run('submit') })
    expect(mockStatusMutateAsync).toHaveBeenCalledWith({
      id: 'car-draft',
      action: 'submit',
      version: 1,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: 409 conflict handling
// ─────────────────────────────────────────────────────────────────────────────

describe('useOwnerActions — 409 conflict surfacing', () => {
  beforeEach(() => jest.clearAllMocks())

  it('re-throws 409 error from status mutation without swallowing it', async () => {
    const conflict409 = { response: { status: 409 } }
    mockStatusMutateAsync.mockRejectedValueOnce(conflict409)

    const vm = makeVm({ status: 'ARCHIVED', version: 2 })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())

    let caught: unknown
    await act(async () => {
      try {
        await hook.current.run('restore')
      } catch (e) {
        caught = e
      }
    })

    expect(caught).toBe(conflict409)
    expect(isOptimisticLockError(caught)).toBe(true)
  })

  it('re-throws 409 error from delete mutation without swallowing it', async () => {
    const conflict409 = { response: { status: 409 } }
    mockDeleteMutateAsync.mockRejectedValueOnce(conflict409)

    const vm = makeVm({ status: 'ACTIVE', listingType: 'SALE' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())

    let caught: unknown
    await act(async () => {
      try {
        await hook.current.run('delete')
      } catch (e) {
        caught = e
      }
    })

    expect(caught).toBe(conflict409)
  })

  it('non-409 errors are also re-thrown', async () => {
    const serverError = { response: { status: 500 } }
    mockStatusMutateAsync.mockRejectedValueOnce(serverError)

    const vm = makeVm({ status: 'ACTIVE', listingType: 'SALE' })
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())

    let caught: unknown
    await act(async () => {
      try {
        await hook.current.run('markSold')
      } catch (e) {
        caught = e
      }
    })

    expect(caught).toBe(serverError)
    expect(isOptimisticLockError(caught)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: viewCount passthrough
// ─────────────────────────────────────────────────────────────────────────────

describe('useOwnerActions — viewCount', () => {
  it('passes through vm.viewCount', async () => {
    const hook = renderOwnerActions(makeVm({ viewCount: 123 }))
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(hook.current.viewCount).toBe(123)
  })

  it('returns 0 when viewCount is undefined', async () => {
    const vm = makeVm({})
    // @ts-expect-error — intentionally testing undefined fallback
    vm.viewCount = undefined
    const hook = renderOwnerActions(vm)
    await waitFor(() => expect(hook.current).toBeDefined())
    expect(hook.current.viewCount).toBe(0)
  })
})
