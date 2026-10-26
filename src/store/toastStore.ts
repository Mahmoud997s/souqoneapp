import { create } from 'zustand'

export const TOAST_DURATION_MS = 5000

export type ToastKind = 'success' | 'neutral' | 'error'

export interface ToastConfig {
  id?: string
  kind: ToastKind
  title: string
  message?: string
  durationMs?: number
}

interface ToastState {
  current: ToastConfig | null
  show: (config: ToastConfig) => void
  hide: () => void
}

let toastIdCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (config: ToastConfig) => {
    const id = config.id || `toast-${++toastIdCounter}`
    set({
      current: {
        ...config,
        id,
        durationMs: config.durationMs ?? TOAST_DURATION_MS,
      },
    })
  },
  hide: () => set({ current: null }),
}))

export const toastService = {
  show: (config: ToastConfig) => useToastStore.getState().show(config),
  hide: () => useToastStore.getState().hide(),
}
