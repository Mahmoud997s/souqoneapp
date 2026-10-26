import { useToastStore, toastService, TOAST_DURATION_MS } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ current: null })
  })

  it('has TOAST_DURATION_MS constant equal to 5000 ms', () => {
    expect(TOAST_DURATION_MS).toBe(5000)
  })

  it('shows toast with default duration 5000 ms when durationMs is omitted', () => {
    toastService.show({
      kind: 'success',
      title: 'تمت إضافة الإعلان إلى المفضلة',
      message: 'تويوتا كامري 2023',
    })

    const current = useToastStore.getState().current
    expect(current).toBeTruthy()
    expect(current?.kind).toBe('success')
    expect(current?.title).toBe('تمت إضافة الإعلان إلى المفضلة')
    expect(current?.message).toBe('تويوتا كامري 2023')
    expect(current?.durationMs).toBe(5000)
  })

  it('replaces active toast immediately with newest toast (no stacking)', () => {
    toastService.show({
      kind: 'success',
      title: 'إعلان 1',
    })
    expect(useToastStore.getState().current?.title).toBe('إعلان 1')

    toastService.show({
      kind: 'neutral',
      title: 'إعلان 2',
    })
    expect(useToastStore.getState().current?.title).toBe('إعلان 2')
    expect(useToastStore.getState().current?.kind).toBe('neutral')
  })

  it('hides active toast on hide() call', () => {
    toastService.show({
      kind: 'success',
      title: 'تمت إضافة الإعلان إلى المفضلة',
    })
    expect(useToastStore.getState().current).not.toBeNull()

    toastService.hide()
    expect(useToastStore.getState().current).toBeNull()
  })
})
