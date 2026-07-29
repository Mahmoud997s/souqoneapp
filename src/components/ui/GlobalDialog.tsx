/**
 * GlobalDialog — مكون واحد يُضاف في root layout
 * يقرأ من dialogStore ويعرض AppDialog عالمياً
 */
import React from 'react';
import { AppDialog } from './AppDialog';
import { useDialogStore } from '../../store/dialogStore';

export function GlobalDialog() {
  const { visible, type, title, message, actions, options, hide } = useDialogStore();

  return (
    <AppDialog
      visible={visible}
      type={type}
      title={title}
      message={message}
      actions={actions}
      options={options}
      onClose={hide}
      onBackdropPress={hide}
    />
  );
}
