import { dialogService } from '../store/dialogStore';
import {
  getDetailErrorKind,
  getMutationErrorMessage,
} from './listing-detail/getDetailErrorKind';

const DEFAULT_ERROR_TITLE = 'خطأ';

/**
 * Displays a unified error or offline dialog based on the normalized error kind
 * without inferring icons from Arabic message text.
 */
export function showErrorDialog(
  err: unknown,
  fallbackMessage: string,
  title?: string
): void {
  const kind = getDetailErrorKind(err);
  const dialogType = kind === 'offline' || kind === 'timeout' ? 'offline' : 'error';
  const message = getMutationErrorMessage(err, fallbackMessage);
  dialogService.alert(title ?? DEFAULT_ERROR_TITLE, message, dialogType);
}
