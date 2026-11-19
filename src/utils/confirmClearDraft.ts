import { toastService } from '../store/toastStore'

/**
 * Shared draft-clear decision toast + success notice for all wizards and draft screens.
 */
export function confirmClearDraft(onClear: () => void, message?: string): void {
  toastService.confirm({
    title: 'مسح المسودة',
    message:
      message ??
      'هل أنت متأكد من رغبتك في مسح كافة البيانات والبدء من جديد؟',
    intent: 'danger',
    confirmLabel: 'مسح',
    cancelLabel: 'إلغاء',
    onConfirm: () => {
      onClear()
      toastService.show({
        kind: 'success',
        title: 'تم مسح المسودة',
      })
    },
  })
}
