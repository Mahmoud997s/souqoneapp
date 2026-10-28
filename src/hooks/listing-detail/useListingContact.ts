import { useState, useCallback } from 'react'
import { Linking } from 'react-native'
import { router, useRouter } from 'expo-router'
import { contactApi, ContactInfo } from '../../api/contact'
import { chatApi } from '../../api/chat'
import { useRequireAuth } from './useRequireAuth'
import { getDetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'

export type ContactEntityType =
  | 'LISTING'
  | 'BUS_LISTING'
  | 'EQUIPMENT_LISTING'
  | 'OPERATOR_LISTING'
  | 'SPARE_PART'
  | 'CAR_SERVICE'
  | 'DRIVER_JOB'
  | 'JOB'
  | 'DRIVER_PROFILE'
  | 'EMPLOYER_PROFILE'
  | 'CARRIER_PROFILE'
  | 'TRANSPORT_REQUEST'
  | (string & {})

export interface UseListingContactReturn {
  busy: boolean
  error: string | null
  phone: string | null
  whatsappNumber: string | null
  contactInfo: ContactInfo | null
  call: () => Promise<void>
  whatsApp: () => Promise<void>
  chat: () => Promise<void>
  getContact: () => Promise<ContactInfo | null>
}

function extractErrorMessage(err: any, fallback: string): string {
  const kind = getDetailErrorKind(err)
  if (kind === 'offline') {
    return 'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً'
  }
  if (kind === 'timeout') {
    return 'انتهت مهلة الاتصال بالخادم. يرجى إعادة المحاولة'
  }
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
 * Secure contact interaction hook for listings across all verticals.
 * Supports all 12 backend entity types:
 * - LISTING, BUS_LISTING, EQUIPMENT_LISTING, OPERATOR_LISTING
 * - SPARE_PART, CAR_SERVICE, DRIVER_JOB, JOB
 * - DRIVER_PROFILE, EMPLOYER_PROFILE, CARRIER_PROFILE, TRANSPORT_REQUEST
 *
 * Gated on authentication via useRequireAuth.
 * - call(): opens tel: URL, or falls back to chat if phone is null.
 * - whatsApp(): opens whatsapp://send URL, or falls back to chat if whatsappNumber is null.
 * - chat(): creates/opens a chat room via chatApi.createRoom.
 * - Surfaces backend Arabic error messages in reactive error state.
 * - Strictly zero PII logging (never logs phone or WhatsApp numbers).
 */
export function useListingContact(
  entityType: ContactEntityType,
  id: string,
  redirectPath: string,
  listingTitle?: string
): UseListingContactReturn {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)

  const { requireAuth } = useRequireAuth()

  let navRouter: any = router
  try {
    if (typeof useRouter === 'function') {
      const r = useRouter()
      if (r && typeof r.push === 'function') {
        navRouter = r
      }
    }
  } catch {}

  const startChatInternal = useCallback(async () => {
    try {
      const res = await chatApi.createRoom({
        entityType,
        entityId: id,
      })
      if (res.data?.id) {
        navRouter.push(`/chat/${res.data.id}` as any)
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'تعذر فتح المحادثة'))
    }
  }, [entityType, id, navRouter])

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

  const getContact = useCallback(async (): Promise<ContactInfo | null> => {
    try {
      const res = await contactApi.getContact(entityType, id)
      if (res.data) {
        setContactInfo(res.data)
        return res.data
      }
      return null
    } catch (err: any) {
      setError(extractErrorMessage(err, 'تعذر جلب بيانات الاتصال'))
      return null
    }
  }, [entityType, id])

  const call = useCallback(async () => {
    if (busy) return
    requireAuth(redirectPath, () => {
      setBusy(true)
      setError(null)
      ;(async () => {
        try {
          let info = contactInfo
          if (!info) {
            const res = await contactApi.getContact(entityType, id)
            info = res.data ?? null
            setContactInfo(info)
          }
          const phone = info?.phone
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
  }, [busy, contactInfo, entityType, id, redirectPath, requireAuth, startChatInternal])

  const whatsApp = useCallback(async () => {
    if (busy) return
    requireAuth(redirectPath, () => {
      setBusy(true)
      setError(null)
      ;(async () => {
        try {
          let info = contactInfo
          if (!info) {
            const res = await contactApi.getContact(entityType, id)
            info = res.data ?? null
            setContactInfo(info)
          }
          const whatsappNumber = info?.whatsappNumber
          if (whatsappNumber) {
            const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '')
            const messageText = listingTitle
              ? `مرحباً، بخصوص إعلانك: ${listingTitle}`
              : 'مرحباً، بخصوص إعلانك'
            const encodedMsg = encodeURIComponent(messageText)
            try {
              await Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`)
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
  }, [busy, contactInfo, entityType, id, redirectPath, listingTitle, requireAuth, startChatInternal])

  return {
    busy,
    error,
    phone: contactInfo?.phone ?? null,
    whatsappNumber: contactInfo?.whatsappNumber ?? null,
    contactInfo,
    call,
    whatsApp,
    chat,
    getContact,
  }
}
