import React, { useEffect, useRef } from 'react'
import { useToastStore } from '../../store/toastStore'
import { FeedbackOverlayHost } from './ToastOverlayHost'

let modalHostCounter = 0

/**
 * Isolated overlay host rendered inside native <Modal> trees so GlobalToast notices,
 * DecisionToastCard, and GlassActionSheet appear above open modals without colliding
 * with test mocks of GlobalToast.
 */
export function ModalToastHost() {
  const hostIdRef = useRef<string | null>(null)
  if (!hostIdRef.current) {
    hostIdRef.current = `modal-toast-host-${++modalHostCounter}`
  }
  const hostId = hostIdRef.current

  useEffect(() => {
    const store = useToastStore.getState()
    store.registerModalHost(hostId)
    return () => {
      useToastStore.getState().unregisterModalHost(hostId)
    }
  }, [hostId])

  const isTopModalHost = useToastStore(
    (s) => s.modalHostIds[s.modalHostIds.length - 1] === hostId
  )
  if (!isTopModalHost) {
    return null
  }
  return <FeedbackOverlayHost />
}
