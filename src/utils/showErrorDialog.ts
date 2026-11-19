import { toastService } from '../store/toastStore';
import {
  getDetailErrorKind,
  getMutationErrorMessage,
} from './listing-detail/getDetailErrorKind';

/**
 * Displays a unified error or offline toast based on the normalized error kind
 * without inferring icons from Arabic message text.
 */
export function showErrorDialog(
  err: unknown,
  fallbackMessage: string,
  _title?: string
): void {
  const kind = getDetailErrorKind(err);
  const isOffline = kind === 'offline' || kind === 'timeout';
  const message = getMutationErrorMessage(err, fallbackMessage);
  toastService.show({
    kind: 'error',
    title: message,
    dedupeKey: isOffline ? 'network-offline' : undefined,
  });
}
