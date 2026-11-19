import { mapDialogAlertToToast } from '../store/dialogStore';
import { toastService } from '../store/toastStore';
import {
  getDetailErrorKind,
  getMutationErrorMessage,
} from './listing-detail/getDetailErrorKind';

const DEFAULT_ERROR_TITLE = 'خطأ';

/**
 * Displays a unified error or offline toast based on the normalized error kind
 * without inferring icons from Arabic message text.
 */
export function showErrorDialog(
  err: unknown,
  fallbackMessage: string,
  title?: string
): void {
  const kind = getDetailErrorKind(err);
  const isOffline = kind === 'offline' || kind === 'timeout';
  const dialogType = isOffline ? 'offline' : 'error';
  const message = getMutationErrorMessage(err, fallbackMessage);
  const payload = mapDialogAlertToToast(title ?? DEFAULT_ERROR_TITLE, message, dialogType);
  toastService.show({
    ...payload,
    dedupeKey: isOffline ? 'network-offline' : undefined,
  });
}
