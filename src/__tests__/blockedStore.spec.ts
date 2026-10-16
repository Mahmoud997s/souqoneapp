import { useBlockedStore } from '../store/blockedStore'

describe('blockedStore', () => {
  beforeEach(() => {
    useBlockedStore.getState().clear()
  })

  it('initializes with default unblocked state', () => {
    const state = useBlockedStore.getState()
    expect(state.isBlocked).toBe(false)
    expect(state.code).toBeNull()
    expect(state.suspendedUntil).toBeNull()
  })

  it('sets blocked state for ACCOUNT_BANNED', () => {
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED' })
    const state = useBlockedStore.getState()
    expect(state.isBlocked).toBe(true)
    expect(state.code).toBe('ACCOUNT_BANNED')
    expect(state.suspendedUntil).toBeNull()
  })

  it('sets blocked state for ACCOUNT_SUSPENDED with date', () => {
    const isoDate = '2026-12-31T23:59:59.000Z'
    useBlockedStore.getState().setBlocked({
      code: 'ACCOUNT_SUSPENDED',
      suspendedUntil: isoDate,
    })
    const state = useBlockedStore.getState()
    expect(state.isBlocked).toBe(true)
    expect(state.code).toBe('ACCOUNT_SUSPENDED')
    expect(state.suspendedUntil).toBe(isoDate)
  })

  it('clears blocked state properly on clear()', () => {
    useBlockedStore.getState().setBlocked({
      code: 'ACCOUNT_SUSPENDED',
      suspendedUntil: '2026-11-15T10:00:00.000Z',
    })
    expect(useBlockedStore.getState().isBlocked).toBe(true)

    useBlockedStore.getState().clear()
    const state = useBlockedStore.getState()
    expect(state.isBlocked).toBe(false)
    expect(state.code).toBeNull()
    expect(state.suspendedUntil).toBeNull()
  })
})
