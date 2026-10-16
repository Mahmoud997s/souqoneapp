import { create } from 'zustand'

export type BlockedCode = 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED'

export interface BlockedState {
  isBlocked: boolean
  code: BlockedCode | null
  suspendedUntil: string | null
  setBlocked: (params: { code: BlockedCode; suspendedUntil?: string | null }) => void
  clear: () => void
}

export const useBlockedStore = create<BlockedState>((set) => ({
  isBlocked: false,
  code: null,
  suspendedUntil: null,

  setBlocked: ({ code, suspendedUntil }) => {
    set({
      isBlocked: true,
      code,
      suspendedUntil: suspendedUntil ?? null,
    })
  },

  clear: () => {
    set({
      isBlocked: false,
      code: null,
      suspendedUntil: null,
    })
  },
}))
