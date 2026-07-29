/**
 * Global Dialog Store (Zustand)
 * Allows showing AppDialog from anywhere — including Hooks and API client —
 * without needing React context or component hierarchy.
 */
import { create } from 'zustand';
import { DialogType, DialogAction, DialogOption } from '../components/ui/AppDialog';

interface DialogState {
  visible: boolean;
  type: DialogType;
  title?: string;
  message?: string;
  actions: DialogAction[];
  options: DialogOption[];

  // Actions
  show: (config: {
    type?: DialogType;
    title?: string;
    message?: string;
    actions?: DialogAction[];
    options?: DialogOption[];
  }) => void;
  hide: () => void;

  /** Simple alert replacement */
  alert: (title: string, message?: string, type?: DialogType) => void;

  /** Confirm dialog replacement */
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
    destructive?: boolean,
  ) => void;

  /** Options bottom sheet replacement */
  showOptions: (title: string, opts: DialogOption[]) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  visible: false,
  type: 'info',
  title: undefined,
  message: undefined,
  actions: [],
  options: [],

  show: (config) =>
    set({
      visible: true,
      type: config.type ?? 'info',
      title: config.title,
      message: config.message,
      actions: config.actions ?? [],
      options: config.options ?? [],
    }),

  hide: () => set({ visible: false }),

  alert: (title, message, type = 'info') =>
    set({
      visible: true,
      type,
      title,
      message,
      actions: [{ text: 'حسناً', style: 'default' }],
      options: [],
    }),

  confirm: (title, message, onConfirm, confirmText = 'تأكيد', cancelText = 'إلغاء', destructive = false) =>
    set({
      visible: true,
      type: 'confirm',
      title,
      message,
      options: [],
      actions: [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
      ],
    }),

  showOptions: (title, opts) =>
    set({
      visible: true,
      type: 'options',
      title,
      options: opts,
      actions: [],
    }),
}));

/**
 * Imperative API — usable OUTSIDE React components (hooks, API client, etc.)
 * Usage: dialogService.alert('خطأ', 'تعذر الاتصال')
 */
export const dialogService = {
  show: (config: {
    type?: DialogType;
    title?: string;
    message?: string;
    actions?: DialogAction[];
    options?: DialogOption[];
  }) => {
    useDialogStore.getState().show(config);
  },
  alert: (title: string, message?: string, type: DialogType = 'info') => {
    useDialogStore.getState().alert(title, message, type);
  },
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
    destructive?: boolean,
  ) => {
    useDialogStore.getState().confirm(title, message, onConfirm, confirmText, cancelText, destructive);
  },
  showOptions: (title: string, opts: DialogOption[]) => {
    useDialogStore.getState().showOptions(title, opts);
  },
  hide: () => {
    useDialogStore.getState().hide();
  },
};
