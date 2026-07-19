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
      const messages = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? [])
      return {
        messages,
        pageNumber: pageParam,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData, allPages) => {
      if (lastPageData.messages.length < 30) {
        return undefined
      }
      return lastPageData.pageNumber + 1
    },
    enabled: !!roomId,
    select: (data) => ({
      pages: data.pages.map(p => p.messages),
      pageParams: data.pageParams,
    }),
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
