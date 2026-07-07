import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { chatApi } from '../api/chat'

export function useChatRooms() {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const res = await chatApi.getRooms()
      const raw = res.data as any
      return Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? [])
    },
    refetchInterval: 15000,
  })
}

export function useChatMessagesInfinite(roomId: string) {
  return useInfiniteQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await chatApi.getMessages(roomId, pageParam, 30)
      const raw = res.data as any
      return Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? [])
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer than 30 items, there are no more pages
      return lastPage.length === 30 ? allPages.length + 1 : undefined
    },
    enabled: !!roomId,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string; receiverId: string }) =>
      chatApi.createRoom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-rooms'] }),
  })
}
