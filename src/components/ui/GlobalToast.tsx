import React from 'react'
import { useToastStore } from '../../store/toastStore'
import {
  FeedbackOverlayHost,
  TOAST_ENTER_OFFSET_Y,
  TOAST_EXIT_OFFSET_Y,
} from './ToastOverlayHost'
import { ModalToastHost } from './ModalToastHost'

export { TOAST_ENTER_OFFSET_Y, TOAST_EXIT_OFFSET_Y, ModalToastHost }

export function GlobalToast() {
  const hasModalHost = useToastStore((s) => s.modalHostIds.length > 0)
  if (hasModalHost) {
    return null
  }
  return <FeedbackOverlayHost />
}
