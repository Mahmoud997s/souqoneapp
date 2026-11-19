import {
  toastService,
  type ActionSheetOption,
  type ToastConfig,
  type ToastKind,
} from './toastStore'

export type DialogType =
  | 'info'
  | 'success'
  | 'error'
  | 'warning'
  | 'offline'
  | 'confirm'
  | 'options'

export interface DialogAction {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive' | 'primary'
}

export interface DialogOption {
  text: string
  icon?: string
  onPress?: () => void
  style?: 'default' | 'destructive'
}

const GENERIC_DIALOG_TITLES = new Set([
  'خطأ',
  'نجاح',
  'تنبيه',
  'تم',
  'تم بنجاح',
  'عذراً',
  'انقطاع الاتصال',
  'تنبيه في المدخلات',
  'غير مصرح',
  'محاولات كثيرة',
])

export function mapDialogTypeToToastKind(type: DialogType = 'info'): ToastKind {
  switch (type) {
    case 'success':
      return 'success'
    case 'error':
    case 'offline':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
    case 'confirm':
    case 'options':
    default:
      return 'info'
  }
}

export function mapDialogAlertToToast(
  title?: string,
  message?: string,
  type: DialogType = 'info',
  iconVariant?: DialogType | 'destructive'
): ToastConfig {
  const effectiveType =
    iconVariant && iconVariant !== 'destructive' ? iconVariant : type
  const kind = mapDialogTypeToToastKind(effectiveType)
  const cleanTitle = title?.trim() ?? ''
  const cleanMessage = message?.trim() ?? ''
  const icon =
    effectiveType === 'offline' ? 'cloud-offline-outline' : undefined

  if (cleanTitle && cleanMessage) {
    if (GENERIC_DIALOG_TITLES.has(cleanTitle)) {
      return {
        kind,
        ...(icon ? { icon } : {}),
        title: cleanMessage,
      }
    }
    return {
      kind,
      ...(icon ? { icon } : {}),
      title: cleanTitle,
      message: cleanMessage,
    }
  }

  return {
    kind,
    ...(icon ? { icon } : {}),
    title: cleanTitle || cleanMessage || 'تنبيه',
  }
}

/**
 * Stateless compatibility facade preserving `dialogService` signatures for callers
 * (including Window-1 files that cannot be edited in D-366).
 * All UI presentation routes through `toastService` (`GlobalToast` / `DecisionToastCard` / `GlassActionSheet`).
 */
export const dialogService = {
  show: (config: {
    type?: DialogType
    iconVariant?: DialogType | 'destructive'
    title?: string
    message?: string
    actions?: DialogAction[]
    options?: DialogOption[]
  }) => {
    const actions = config.actions ?? []
    const options = config.options ?? []

    if (config.type === 'options' || options.length > 0 || actions.length > 2) {
      const sheetOptions: ActionSheetOption[] =
        options.length > 0
          ? options.map((opt) => ({
              text: opt.text,
              icon: opt.icon,
              onPress: opt.onPress,
              style: opt.style,
            }))
          : actions
              .filter((a) => a.style !== 'cancel')
              .map((a) => ({
                text: a.text,
                onPress: a.onPress,
                style: a.style === 'destructive' ? 'destructive' : 'default',
              }))
      const cancelAction = actions.find((a) => a.style === 'cancel')
      toastService.showActionSheet({
        title: config.title,
        options: sheetOptions,
        cancelLabel: cancelAction?.text,
        onCancel: cancelAction?.onPress,
      })
      return
    }

    if (actions.length === 2 || config.type === 'confirm') {
      const cancelIdx = actions.findIndex((a) => a.style === 'cancel')
      const cancelAction = cancelIdx >= 0 ? actions[cancelIdx] : actions[0]
      const confirmAction =
        cancelIdx >= 0 ? actions[cancelIdx === 0 ? 1 : 0] : actions[1]
      const isDanger =
        config.iconVariant === 'destructive' ||
        confirmAction?.style === 'destructive'

      toastService.confirm({
        title: config.title || config.message || 'تأكيد',
        message:
          config.title && config.message ? config.message : undefined,
        intent: isDanger ? 'danger' : 'primary',
        confirmLabel: confirmAction?.text ?? 'تأكيد',
        cancelLabel: cancelAction?.text ?? 'إلغاء',
        onConfirm: () => {
          confirmAction?.onPress?.()
        },
        onCancel: cancelAction?.onPress,
      })
      return
    }

    toastService.show(
      mapDialogAlertToToast(
        config.title,
        config.message,
        config.type ?? 'info',
        config.iconVariant
      )
    )
  },

  alert: (title: string, message?: string, type: DialogType = 'info') => {
    toastService.show(mapDialogAlertToToast(title, message, type))
  },

  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    destructive = false
  ) => {
    toastService.confirm({
      title: title || message,
      message: title && message ? message : undefined,
      intent: destructive ? 'danger' : 'primary',
      confirmLabel: confirmText,
      cancelLabel: cancelText,
      onConfirm,
    })
  },

  showOptions: (title: string, opts: DialogOption[]) => {
    toastService.showActionSheet({
      title,
      options: opts.map((opt) => ({
        text: opt.text,
        icon: opt.icon,
        onPress: opt.onPress,
        style: opt.style,
      })),
    })
  },

  hide: () => {
    toastService.hide()
    toastService.hideActionSheet(false)
  },
}
