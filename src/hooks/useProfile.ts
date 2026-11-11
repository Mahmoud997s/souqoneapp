import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { usersApi } from '../api/users'
import { notificationsApi } from '../api/notifications'
import { PublicProfile } from '../types/profile.types'
import { NotificationItem } from '../types/api.types'
import { parseListEnvelope } from '../utils/parseListEnvelope'
import { getMutationErrorMessage } from '../utils/listing-detail/getDetailErrorKind'
import { useToastStore } from '../store/toastStore'

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

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
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
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData(['notifications'])
      qc.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => ({ ...item, isRead: true }))
          }))
        }
      })
      return { prev }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(['notifications'], context?.prev)
      const message = getMutationErrorMessage(err, 'تعذر تعليم الإشعارات كمقروءة')
      useToastStore.getState().show({ kind: 'error', title: message })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData(['notifications'])
      qc.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => item.id === id ? { ...item, isRead: true } : item)
          }))
        }
      })
      return { prev }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(['notifications'], context?.prev)
      const message = getMutationErrorMessage(err, 'تعذر تحديث حالة الإشعار')
      useToastStore.getState().show({ kind: 'error', title: message })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteOne(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData(['notifications'])
      qc.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((item: any) => item.id !== id)
          }))
        }
      })
      return { prev }
    },
    onError: (err, _vars, context) => {
      qc.setQueryData(['notifications'], context?.prev)
      const message = getMutationErrorMessage(err, 'تعذر حذف الإشعار')
      useToastStore.getState().show({ kind: 'error', title: message })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
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
      useToastStore.getState().show({ kind: 'error', title: message })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
