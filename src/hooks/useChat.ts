import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { chatApi } from '../api/chat'
import { ChatRoom, ChatMessage } from '../types/listing.types'
import { parseListEnvelope } from '../utils/parseListEnvelope'

/**
 * Normalizes legacy `{ data: [...] }` envelopes to `{ items: [...] }` so
 * `parseListEnvelope` validates strict array/envelope contracts safely.
 */
function normalizeChatEnvelope(raw: unknown): unknown {
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

export function useChatRooms() {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const res = await chatApi.getRooms()
      const { items } = parseListEnvelope<ChatRoom>(normalizeChatEnvelope(res.data))
      return items
    },
    refetchInterval: 15000,
  })
}

export function useChatMessagesInfinite(roomId: string) {
  return useInfiniteQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await chatApi.getMessages(roomId, pageParam, 30)
      const { items, meta } = parseListEnvelope<ChatMessage>(normalizeChatEnvelope(res.data))
      return {
        messages: items,
        pageNumber: typeof meta?.page === 'number' ? meta.page : pageParam,
        totalPages: typeof meta?.totalPages === 'number' ? meta.totalPages : undefined,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      if (typeof lastPageData.totalPages === 'number') {
        return lastPageData.pageNumber < lastPageData.totalPages ? lastPageData.pageNumber + 1 : undefined
      }
      if (lastPageData.messages.length < 30) {
        return undefined
      }
      return lastPageData.pageNumber + 1
    },
    enabled: !!roomId,
    select: (data) => ({
      pages: data.pages.map((p) => p.messages),
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
