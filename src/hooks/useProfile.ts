import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, QueryClient, QueryClientContext } from '@tanstack/react-query'
import { usersApi } from '../api/users'
import { notificationsApi } from '../api/notifications'
import { PublicProfile } from '../types/profile.types'
import { NotificationItem } from '../types/api.types'
import { parseListEnvelope } from '../utils/parseListEnvelope'
import { getMutationErrorMessage } from '../utils/listing-detail/getDetailErrorKind'
import { toastService } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const
export const UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY = ['notifications-unread-count'] as const

const fallbackQueryClient = new QueryClient()

export function clampUnreadCount(raw: unknown): number {
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(num) || num <= 0) return 0
  return Math.floor(num)
}

function isNotificationUnreadInCache(cacheData: unknown, id: string): boolean {
  if (!cacheData || typeof cacheData !== 'object') return true
  const pages = (cacheData as { pages?: Array<{ items?: Array<{ id?: string; isRead?: boolean }> }> }).pages
  if (!Array.isArray(pages)) return true
  for (const page of pages) {
    const found = page?.items?.find((item) => item.id === id)
    if (found) {
      return found.isRead !== true
    }
  }
  return true
}

/**
 * Normalizes legacy `{ data: [...] }` envelopes to `{ items: [...] }` safely.
 */
function normalizeNotificationsEnvelope(raw: unknown): unknown {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    !('items' in raw) &&
    Array.isArray((raw as Record<string, unknown>).data)
  ) {
    const record = raw as Record<string, unknown>
    return { ...record, items: record.data }
  }
  return raw
}

export function usePublicProfile(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('A user id is required')
      const res = await usersApi.getById(userId)
      return res.data
    },
    enabled: Boolean(userId),
    retry: false,
  })
}

export function useUnreadNotificationsCount(): number {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const contextClient = useContext(QueryClientContext)

  const { data } = useQuery<number>(
    {
      queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY,
      queryFn: async () => {
        try {
          const res = await notificationsApi.getUnreadCount()
          return clampUnreadCount(res.data?.count)
        } catch {
          return 0
        }
      },
      enabled: Boolean(contextClient && isLoggedIn),
      staleTime: 30_000,
    },
    contextClient ?? fallbackQueryClient
  )

  if (!isLoggedIn || !contextClient) return 0
  return clampUnreadCount(data)
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await notificationsApi.getAll({ page: pageParam, limit: 15 })
      const { items, meta } = parseListEnvelope<NotificationItem>(normalizeNotificationsEnvelope(res.data))
      return { 
        items, 
        meta: meta ?? { page: pageParam, totalPages: 1 } 
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined
    }
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      await qc.cancelQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
      const prev = qc.getQueryData(NOTIFICATIONS_QUERY_KEY)
      const prevCount = qc.getQueryData<number>(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)
      qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, 0)
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => ({ ...item, isRead: true }))
          }))
        }
      })
      return { prev, prevCount }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, context?.prev)
      if (context?.prevCount !== undefined) {
        qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, context.prevCount)
      }
      const message = getMutationErrorMessage(err, 'تعذر تعليم الإشعارات كمقروءة')
      toastService.show({ kind: 'error', title: message })
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      await qc.cancelQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
      const prev = qc.getQueryData(NOTIFICATIONS_QUERY_KEY)
      const prevCount = qc.getQueryData<number>(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)
      if (isNotificationUnreadInCache(prev, id)) {
        qc.setQueryData<number>(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, (old) =>
          Math.max(0, clampUnreadCount(old) - 1)
        )
      }
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => item.id === id ? { ...item, isRead: true } : item)
          }))
        }
      })
      return { prev, prevCount }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, context?.prev)
      if (context?.prevCount !== undefined) {
        qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, context.prevCount)
      }
      const message = getMutationErrorMessage(err, 'تعذر تحديث حالة الإشعار')
      toastService.show({ kind: 'error', title: message })
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteOne(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      await qc.cancelQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
      const prev = qc.getQueryData(NOTIFICATIONS_QUERY_KEY)
      const prevCount = qc.getQueryData<number>(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY)
      if (isNotificationUnreadInCache(prev, id)) {
        qc.setQueryData<number>(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, (old) =>
          Math.max(0, clampUnreadCount(old) - 1)
        )
      }
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: any) => item.id !== id)
          }))
        }
      })
      return { prev, prevCount }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(NOTIFICATIONS_QUERY_KEY, context?.prev)
      if (context?.prevCount !== undefined) {
        qc.setQueryData(UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY, context.prevCount)
      }
      const message = getMutationErrorMessage(err, 'تعذر حذف الإشعار')
      toastService.show({ kind: 'error', title: message })
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: UNREAD_NOTIFICATIONS_COUNT_QUERY_KEY })
    },
  })
}

export function useDeleteAllReadNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.deleteAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData(['notifications'])
      qc.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: any) => !item.isRead)
          }))
        }
      })
      return { prev }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(['notifications'], context?.prev)
      const message = getMutationErrorMessage(err, 'تعذر حذف الإشعارات المقروءة')
      toastService.show({ kind: 'error', title: message })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
