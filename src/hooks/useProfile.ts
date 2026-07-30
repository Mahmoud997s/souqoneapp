import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { usersApi } from '../api/users'
import { notificationsApi } from '../api/notifications'

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await usersApi.getById(userId)
      return res.data as any
    },
    enabled: !!userId,
  })
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await notificationsApi.getAll({ page: pageParam, limit: 15 })
      const data = res.data as any
      return { 
        items: Array.isArray(data) ? data : (data?.items ?? data?.data ?? []), 
        meta: data?.meta ?? { page: pageParam, totalPages: 1 } 
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
    onError: (err, newTodo, context) => qc.setQueryData(['notifications'], context?.prev),
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
    onError: (err, newTodo, context) => qc.setQueryData(['notifications'], context?.prev),
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
    onError: (err, newTodo, context) => qc.setQueryData(['notifications'], context?.prev),
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
    onError: (err, newTodo, context) => qc.setQueryData(['notifications'], context?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
