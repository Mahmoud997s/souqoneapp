import { dialogService } from '../store/dialogStore'
import { getDetailErrorKind, getMutationErrorMessage } from './listing-detail/getDetailErrorKind'
import { getPublishRateLimitErrorMessage } from './publishRateLimitError'
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

export interface MappedBackendErrorsResult {
  fieldErrors: Record<string, string>
  firstInvalidStep: number | null
}

export interface HandlePublishMutationErrorOptions {
  error: unknown
  isEdit: boolean
  fallbackMessage: string
  onRetry?: () => void
  onRefetchVersion?: () => Promise<void>
  mapBackendErrors?: (errorResponse: unknown) => MappedBackendErrorsResult
  onFieldErrors?: (fieldErrors: Record<string, string>, firstInvalidStep: number | null) => void
}

/**
 * Shared submit-mutation error handler matching cars' canonical branching:
 * - 409 on edit: confirm dialog that refetches latest version (or conflict alert if no refetcher)
 * - 409 on create: similar-ad alert
 * - 429: existing rate-limit message
 * - 400: map backend field errors to fields, jump to firstInvalidStep, and alert
 * - offline / timeout / other: delegates to showPublishErrorDialog
 */
export function handlePublishMutationError({
  error,
  isEdit,
  fallbackMessage,
  onRetry,
  onRefetchVersion,
  mapBackendErrors,
  onFieldErrors,
}: HandlePublishMutationErrorOptions): void {
  const errObj = error as { response?: { status?: number; data?: unknown } } | null | undefined
  const status = errObj?.response?.status

  if (status === 409) {
    if (isEdit) {
      if (onRefetchVersion) {
        dialogService.confirm(
          'تحديث مطلوب',
          'هذا الإعلان تم تعديله من جهاز آخر. سيتم جلب أحدث نسخة من السيرفر لتتمكن من حفظ تعديلاتك الحالية دون فقدانها.',
          async () => {
            try {
              await onRefetchVersion()
              dialogService.alert('تم', 'تم تحديث النسخة، يمكنك الآن مراجعة بياناتك ومحاولة الحفظ مجدداً.', 'success')
            } catch {
              dialogService.alert('خطأ', 'تعذر جلب البيانات.')
            }
          },
          'تحديث الآن',
          'إلغاء'
        )
      } else {
        dialogService.alert('خطأ', 'تم تعديل هذا الإعلان مؤخراً أو يوجد تعارض في البيانات.')
      }
    } else {
      dialogService.alert('خطأ', 'تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.')
    }
    return
  }

  if (status === 429) {
    dialogService.alert('خطأ', getPublishRateLimitErrorMessage(error))
    return
  }

  if (status === 400) {
    if (mapBackendErrors && onFieldErrors) {
      const mapped = mapBackendErrors(errObj?.response?.data)
      if (Object.keys(mapped.fieldErrors).length > 0) {
        onFieldErrors(mapped.fieldErrors, mapped.firstInvalidStep)
        const firstMsg = Object.values(mapped.fieldErrors)[0]
        dialogService.alert('تنبيه في المدخلات', firstMsg || 'يرجى مراجعة الحقول المشار إليها بالأحمر')
        return
      }
    }
    dialogService.alert('خطأ', getMutationErrorMessage(error, fallbackMessage))
    return
  }

  showPublishErrorDialog({
    error,
    fallbackMessage,
    onRetry,
  })
}
