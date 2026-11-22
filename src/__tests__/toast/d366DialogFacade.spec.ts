import { dialogService } from '../../store/dialogStore'
import { useToastStore } from '../../store/toastStore'

describe('D-366 dialogService stateless facade compatibility', () => {
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

  it('routes dialogService.alert to toastService.show with mapped kind and offline icon', () => {
    dialogService.alert('خطأ', 'البيانات غير صحيحة', 'error')
    expect(useToastStore.getState().current).toMatchObject({
      kind: 'error',
      title: 'البيانات غير صحيحة',
    })

    dialogService.alert('انقطاع الاتصال', 'تحقق من الإنترنت', 'offline')
    expect(useToastStore.getState().current).toMatchObject({
      kind: 'error',
      icon: 'cloud-offline-outline',
      title: 'تحقق من الإنترنت',
    })

    dialogService.alert('عنوان مخصص', 'تفاصيل الرسالة', 'info')
    expect(useToastStore.getState().current).toMatchObject({
      kind: 'info',
      title: 'عنوان مخصص',
      message: 'تفاصيل الرسالة',
    })
  })

  it('routes dialogService.confirm and dialogService.show(confirm) to toastService.confirm', () => {
    const onConfirm = jest.fn()
    dialogService.confirm('حذف الحساب', 'هل أنت متأكد؟', onConfirm, 'حذف', 'تراجع', true)

    expect(useToastStore.getState().activeDecision).toMatchObject({
      title: 'حذف الحساب',
      message: 'هل أنت متأكد؟',
      intent: 'danger',
      confirmLabel: 'حذف',
      cancelLabel: 'تراجع',
    })

    useToastStore.getState().activeDecision?.onConfirm()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('routes dialogService.showOptions to toastService.showActionSheet', () => {
    const onSelect = jest.fn()
    dialogService.showOptions('خيارات', [{ text: 'خيار 1', onPress: onSelect }])

    expect(useToastStore.getState().activeSheet?.title).toBe('خيارات')
    expect(useToastStore.getState().activeSheet?.options).toHaveLength(1)
  })
})
