import { create } from 'zustand'

export const TOAST_DURATION_MS = 5000
export const TOAST_DURATION_SUCCESS_MS = 3000
export const TOAST_DURATION_INFO_MS = 4000

export type ToastKind = 'success' | 'error' | 'info' | 'warning' | 'neutral'

export interface ToastConfig {
  id?: string
  kind: ToastKind
  icon?: string
  title: string
  message?: string
  dedupeKey?: string
  durationMs?: number | null
  revision?: number
}

export interface ToastItem extends ToastConfig {
  id: string
  durationMs: number | null
  revision?: number
}

export type DecisionIntent = 'danger' | 'primary'

export interface DecisionConfig {
  id?: string
  title: string
  message?: string
  intent: DecisionIntent
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export interface DecisionItem extends DecisionConfig {
  id: string
}

export interface ActionSheetOption {
  text: string
  icon?: string
  onPress?: () => void
  style?: 'default' | 'destructive'
  testID?: string
}

export interface ActionSheetConfig {
  id?: string
  title?: string
  options: ActionSheetOption[]
  cancelLabel?: string
  onCancel?: () => void
}

export interface ActionSheetItem extends ActionSheetConfig {
  id: string
}

export function resolveToastDuration(config: ToastConfig): number | null {
  if (config.durationMs !== undefined) {
    return config.durationMs
  }
  if (
    config.icon === 'heart' ||
    config.icon === 'heart-dislike-outline' ||
    config.title === 'تمت إضافة الإعلان إلى المفضلة' ||
    config.title === 'تمت إزالة الإعلان من المفضلة'
  ) {
    return TOAST_DURATION_MS
  }
  if (config.kind === 'error') {
    return null
  }
  if (config.kind === 'success') {
    return TOAST_DURATION_SUCCESS_MS
  }
  return TOAST_DURATION_INFO_MS
}

interface ToastState {
  current: ToastItem | null
  queuedNotice: ToastItem | null
  activeDecision: DecisionItem | null
  decisionQueue: DecisionItem[]
  activeSheet: ActionSheetItem | null
  modalHostIds: string[]
  show: (config: ToastConfig) => void
  hide: () => void
  dismissByDedupeKey: (dedupeKey: string) => void
  confirm: (config: DecisionConfig) => void
  resolveDecision: (outcome: 'confirm' | 'cancel') => void
  showActionSheet: (config: ActionSheetConfig) => void
  hideActionSheet: (invokeCancel?: boolean) => void
  registerModalHost: (hostId: string) => void
  unregisterModalHost: (hostId: string) => void
}

let toastIdCounter = 0
let decisionIdCounter = 0
let sheetIdCounter = 0

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  queuedNotice: null,
  activeDecision: null,
  decisionQueue: [],
  activeSheet: null,
  modalHostIds: [],

  show: (config: ToastConfig) => {
    const durationMs = resolveToastDuration(config)
    const state = get()

    // While a decision toast is open, never overwrite it: coalesce/hold in queuedNotice
    if (state.activeDecision) {
      const existingQueued = state.queuedNotice
      const canCoalesceQueued =
        Boolean(existingQueued) &&
        ((Boolean(config.dedupeKey) && existingQueued?.dedupeKey === config.dedupeKey) ||
          (Boolean(config.id) && existingQueued?.id === config.id))

      const queuedItem: ToastItem = canCoalesceQueued && existingQueued
        ? {
            ...config,
            id: existingQueued.id,
            durationMs,
            revision: (existingQueued.revision ?? 0) + 1,
          }
        : {
            ...config,
            id: config.id || `toast-${++toastIdCounter}`,
            durationMs,
            revision: 0,
          }

      set({ queuedNotice: queuedItem })
      return
    }

    const existing = state.current
    const canCoalesceCurrent =
      Boolean(existing) &&
      ((Boolean(config.dedupeKey) && existing?.dedupeKey === config.dedupeKey) ||
        (Boolean(config.id) && existing?.id === config.id))

    if (canCoalesceCurrent && existing) {
      set({
        current: {
          ...config,
          id: existing.id,
          durationMs,
          revision: (existing.revision ?? 0) + 1,
        },
      })
      return
    }

    const id = config.id || `toast-${++toastIdCounter}`
    set({
      current: {
        ...config,
        id,
        durationMs,
        revision: 0,
      },
    })
  },

  hide: () => set({ current: null }),

  dismissByDedupeKey: (dedupeKey: string) => {
    const state = get()
    const nextCurrent = state.current?.dedupeKey === dedupeKey ? null : state.current
    const nextQueued = state.queuedNotice?.dedupeKey === dedupeKey ? null : state.queuedNotice
    if (nextCurrent !== state.current || nextQueued !== state.queuedNotice) {
      set({ current: nextCurrent, queuedNotice: nextQueued })
    }
  },

  confirm: (config: DecisionConfig) => {
    const item: DecisionItem = {
      ...config,
      id: config.id || `decision-${++decisionIdCounter}`,
    }
    const state = get()
    if (!state.activeDecision) {
      set({
        activeDecision: item,
        current: null,
      })
      return
    }
    set({
      decisionQueue: [...state.decisionQueue, item],
    })
  },

  resolveDecision: (outcome: 'confirm' | 'cancel') => {
    const state = get()
    const active = state.activeDecision
    if (!active) return

    const [nextDecision, ...remainingQueue] = state.decisionQueue
    if (nextDecision) {
      set({
        activeDecision: nextDecision,
        decisionQueue: remainingQueue,
      })
    } else {
      const promotedNotice = state.queuedNotice
      set({
        activeDecision: null,
        decisionQueue: [],
        current: promotedNotice ?? state.current,
        queuedNotice: null,
      })
    }

    if (outcome === 'confirm') {
      void active.onConfirm()
    } else {
      active.onCancel?.()
    }
  },

  showActionSheet: (config: ActionSheetConfig) => {
    const item: ActionSheetItem = {
      ...config,
      id: config.id || `sheet-${++sheetIdCounter}`,
    }
    set({ activeSheet: item })
  },

  hideActionSheet: (invokeCancel = false) => {
    const active = get().activeSheet
    if (!active) return
    set({ activeSheet: null })
    if (invokeCancel) {
      active.onCancel?.()
    }
  },

  registerModalHost: (hostId: string) => {
    set((state) => {
      if (state.modalHostIds.includes(hostId)) return state
      return { modalHostIds: [...state.modalHostIds, hostId] }
    })
  },

  unregisterModalHost: (hostId: string) => {
    set((state) => {
      if (!state.modalHostIds.includes(hostId)) return state
      return { modalHostIds: state.modalHostIds.filter((id) => id !== hostId) }
    })
  },
}))

export const toastService = {
  show: (config: ToastConfig) => useToastStore.getState().show(config),
  hide: () => useToastStore.getState().hide(),
  dismissByDedupeKey: (dedupeKey: string) =>
    useToastStore.getState().dismissByDedupeKey(dedupeKey),
  confirm: (config: DecisionConfig) => useToastStore.getState().confirm(config),
  showActionSheet: (config: ActionSheetConfig) =>
    useToastStore.getState().showActionSheet(config),
  hideActionSheet: (invokeCancel?: boolean) =>
    useToastStore.getState().hideActionSheet(invokeCancel),
}
