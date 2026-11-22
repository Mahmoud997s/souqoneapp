import { act } from '@testing-library/react-native'
import {
  useToastStore,
  toastService,
  resolveToastDuration,
} from '../../store/toastStore'

describe('D-366 toastStore unified durations, deduplication, decision pause, and LIFO hosts', () => {
  beforeEach(() => {
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
  })

  afterEach(() => {
    act(() => {
      toastService.hide()
      useToastStore.getState().resolveDecision('cancel')
      toastService.hideActionSheet()
    })
  })

  it('assigns exact D-366 durations by kind and preserves 5000ms for favourites', () => {
    expect(resolveToastDuration({ kind: 'success', title: 'تم الحفظ' })).toBe(3000)
    expect(resolveToastDuration({ kind: 'info', title: 'معلومة' })).toBe(4000)
    expect(resolveToastDuration({ kind: 'warning', title: 'تنبيه' })).toBe(4000)
    expect(resolveToastDuration({ kind: 'neutral', title: 'إشعار' })).toBe(4000)
    expect(resolveToastDuration({ kind: 'error', title: 'حدث خطأ' })).toBeNull()
    expect(
      resolveToastDuration({
        kind: 'info',
        title: 'تمت إضافة الإعلان إلى المفضلة',
        icon: 'heart',
      })
    ).toBe(5000)
  })

  it('keeps error toasts sticky (durationMs = null) until explicitly dismissed', () => {
    act(() => {
      toastService.show({ kind: 'error', title: 'مفيش اتصال بالإنترنت', dedupeKey: 'network-offline' })
    })

    expect(useToastStore.getState().current?.title).toBe('مفيش اتصال بالإنترنت')
    expect(useToastStore.getState().current?.durationMs).toBeNull()

    act(() => {
      toastService.dismissByDedupeKey('network-offline')
    })

    expect(useToastStore.getState().current).toBeNull()
  })

  it('coalesces rapid toasts with the same dedupeKey by keeping id and incrementing revision', () => {
    act(() => {
      toastService.show({ kind: 'success', title: 'تم الحفظ', dedupeKey: 'settings-save' })
    })
    const first = useToastStore.getState().current
    expect(first?.revision).toBe(0)

    act(() => {
      toastService.show({ kind: 'success', title: 'تم الحفظ', dedupeKey: 'settings-save' })
    })

    const second = useToastStore.getState().current
    expect(second?.id).toBe(first?.id)
    expect(second?.revision).toBe(1)
  })

  it('queues active regular toast in queuedNotice while a decision toast is open and restores it after decision resolves', () => {
    act(() => {
      toastService.show({ kind: 'info', title: 'إشعار قيد العرض' })
    })
    expect(useToastStore.getState().current?.title).toBe('إشعار قيد العرض')

    const onConfirm = jest.fn()
    act(() => {
      toastService.confirm({
        title: 'تسجيل الخروج؟',
        intent: 'primary',
        confirmLabel: 'خروج',
        cancelLabel: 'إلغاء',
        onConfirm,
      })
    })

    expect(useToastStore.getState().activeDecision?.title).toBe('تسجيل الخروج؟')
    expect(useToastStore.getState().current).toBeNull()
    expect(useToastStore.getState().queuedNotice?.title).toBe('إشعار قيد العرض')

    act(() => {
      useToastStore.getState().resolveDecision('cancel')
    })

    expect(useToastStore.getState().activeDecision).toBeNull()
    expect(useToastStore.getState().current?.title).toBe('إشعار قيد العرض')
  })

  it('tracks LIFO modal toast hosts so only the top-most registered host is active', () => {
    act(() => {
      useToastStore.getState().registerModalHost('modal-1')
      useToastStore.getState().registerModalHost('modal-2')
    })

    expect(useToastStore.getState().modalHostIds).toEqual(['modal-1', 'modal-2'])

    act(() => {
      useToastStore.getState().unregisterModalHost('modal-2')
    })

    expect(useToastStore.getState().modalHostIds).toEqual(['modal-1'])
  })
})
