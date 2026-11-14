import { dialogService } from '../store/dialogStore'
import { getDetailErrorKind } from './listing-detail/getDetailErrorKind'
import { showErrorDialog } from './showErrorDialog'

export interface PublishErrorDialogOptions {
  error: unknown
  fallbackMessage: string
  onRetry?: () => void
}

/**
 * Unified publish/upload error dialog for all 7 listing creation/edit screens.
 * - `offline`: shows 'لا يوجد اتصال' with 'offline' icon and optional 'إعادة المحاولة' action.
 * - `timeout`: shows 'انتهت مهلة الاتصال' with 'offline' icon and NO retry button/auto-retry
 *   (until backend idempotency/duplicate guard D-B13 is merged).
 * - All other errors (400/401/403/409/429/500): delegates to showErrorDialog (red 'error' icon).
 */
export function showPublishErrorDialog({
  error,
  fallbackMessage,
  onRetry,
}: PublishErrorDialogOptions): void {
  const kind = getDetailErrorKind(error)

  if (kind === 'offline') {
    const message = 'تعذر الاتصال بالإنترنت. تحقق من اتصالك وأعد المحاولة.'
    if (onRetry) {
      dialogService.show({
        type: 'offline',
        title: 'لا يوجد اتصال',
        message,
        actions: [
          { text: 'إغلاق', style: 'cancel' },
          { text: 'إعادة المحاولة', style: 'default', onPress: onRetry },
        ],
      })
    } else {
      dialogService.alert('لا يوجد اتصال', message, 'offline')
    }
    return
  }

  if (kind === 'timeout') {
    dialogService.alert(
      'انتهت مهلة الاتصال',
      'انتهت مهلة الاتصال بالخادم. يرجى التحقق من اتصالك قبل المحاولة مجدداً.',
      'offline'
    )
    return
  }

  showErrorDialog(error, fallbackMessage)
}
