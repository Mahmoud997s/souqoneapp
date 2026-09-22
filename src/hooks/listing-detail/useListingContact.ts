import { useState, useCallback } from 'react'
import { Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { contactApi } from '../../api/contact'
import { chatApi } from '../../api/chat'
import { useRequireAuth } from './useRequireAuth'

export interface UseListingContactReturn {
  busy: boolean
  error: string | null
  call: () => Promise<void>
  whatsApp: () => Promise<void>
  chat: () => Promise<void>
}

function extractErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message ?? err?.message ?? fallback
  if (Array.isArray(msg)) {
    return msg.join('\n')
  }
  if (typeof msg === 'string') {
    return msg
  }
  return fallback
}

/**
 * useListingContact
 * Secure contact interaction hook for listings.
 * - Gated on authentication via useRequireAuth.
 * - call(): opens tel: URL, or falls back to chat if phone is null.
 * - whatsApp(): opens whatsapp://send URL, or falls back to chat if whatsappNumber is null.
 * - chat(): creates/opens a chat room via chatApi.createRoom.
 * - Surfaces backend Arabic error messages in reactive error state.
 * - Strictly zero PII logging (never logs phone or WhatsApp numbers).
 */
export function useListingContact(
  entityType: string,
  id: string,
  redirectPath: string
): UseListingContactReturn {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { requireAuth } = useRequireAuth()

  const startChatInternal = useCallback(async () => {
    try {
      const res = await chatApi.createRoom({
        entityType,
        entityId: id,
      })
      if (res.data?.id) {
        router.push(`/chat/${res.data.id}` as any)
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'تعذر فتح المحادثة'))
    }
  }, [entityType, id, router])

  const chat = useCallback(async () => {
    if (busy) return
    requireAuth(redirectPath, () => {
      setBusy(true)
      setError(null)
      ;(async () => {
        try {
          await startChatInternal()
        } finally {
          setBusy(false)
        }
      })()
    })
  }, [busy, redirectPath, requireAuth, startChatInternal])

  const call = useCallback(async () => {
    if (busy) return
    requireAuth(redirectPath, () => {
      setBusy(true)
      setError(null)
      ;(async () => {
        try {
          const res = await contactApi.getContact(entityType, id)
          const phone = res.data?.phone
          if (phone) {
            const cleanPhone = phone.replace(/[^0-9+]/g, '')
            try {
              await Linking.openURL(`tel:${cleanPhone}`)
            } catch {
              setError('تعذر فتح تطبيق الهاتف')
            }
          } else {
            // Fall back to chat when phone is absent
            await startChatInternal()
          }
        } catch (err: any) {
          setError(extractErrorMessage(err, 'تعذر جلب بيانات الاتصال'))
        } finally {
          setBusy(false)
        }
      })()
    })
  }, [busy, entityType, id, redirectPath, requireAuth, startChatInternal])

  const whatsApp = useCallback(async () => {
    if (busy) return
    requireAuth(redirectPath, () => {
      setBusy(true)
      setError(null)
      ;(async () => {
        try {
          const res = await contactApi.getContact(entityType, id)
          const whatsappNumber = res.data?.whatsappNumber
          if (whatsappNumber) {
            const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '')
            try {
              await Linking.openURL(`whatsapp://send?phone=${cleanPhone}`)
            } catch {
              setError('تعذر فتح تطبيق واتساب')
            }
          } else {
            // Fall back to chat when WhatsApp is disabled / absent
            await startChatInternal()
          }
        } catch (err: any) {
          setError(extractErrorMessage(err, 'تعذر جلب بيانات التواصل'))
        } finally {
          setBusy(false)
        }
      })()
    })
  }, [busy, entityType, id, redirectPath, requireAuth, startChatInternal])

  return {
    busy,
    error,
    call,
    whatsApp,
    chat,
  }
}
