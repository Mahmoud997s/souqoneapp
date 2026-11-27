import { useContext } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, QueryClient, QueryClientContext } from '@tanstack/react-query'
import { chatApi } from '../api/chat'
import { ChatRoom, ChatMessage } from '../types/listing.types'
import { parseListEnvelope } from '../utils/parseListEnvelope'
import { toastService } from '../store/toastStore'
import { useSocketStore } from '../store/socketStore'

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

export const CHAT_ROOMS_QUERY_KEY = ['chat-rooms'] as const

async function fetchChatRooms(): Promise<ChatRoom[]> {
  const res = await chatApi.getRooms({ includeArchived: true })
  const { items } = parseListEnvelope<ChatRoom>(normalizeChatEnvelope(res.data))
  return items
}

export function computeChatUnreadTotal(rooms: ChatRoom[] | undefined): number {
  if (!Array.isArray(rooms)) return 0
  return rooms.reduce((sum, r) => {
    if (r.archived) return sum
    return sum + Math.max(0, r.unreadCount ?? 0)
  }, 0)
}

export const CHAT_POLL_FALLBACK_MS = 60000

export function getChatRoomsRefetchInterval(
  isSocketConnected: boolean,
  appState: AppStateStatus = AppState.currentState
): number | false {
  if (isSocketConnected && appState === 'active') {
    return false
  }
  return CHAT_POLL_FALLBACK_MS
}

export function useChatRooms() {
  const isSocketConnected = useSocketStore((s) => s.isConnected)
  return useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    queryFn: fetchChatRooms,
    refetchInterval: () =>
      getChatRoomsRefetchInterval(isSocketConnected, AppState.currentState),
  })
}

const FALLBACK_DISABLED_CLIENT = new QueryClient()

export function useChatTabUnreadCount(enabled = true): number {
  const ctxClient = useContext(QueryClientContext)
  const isSocketConnected = useSocketStore((s) => s.isConnected)
  const { data } = useQuery(
    {
      queryKey: CHAT_ROOMS_QUERY_KEY,
      queryFn: fetchChatRooms,
      refetchInterval: () =>
        getChatRoomsRefetchInterval(isSocketConnected, AppState.currentState),
      enabled: enabled && !!ctxClient,
      select: computeChatUnreadTotal,
    },
    ctxClient ?? FALLBACK_DISABLED_CLIENT
  )
  return ctxClient ? (data ?? 0) : 0
}

export function useArchiveRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roomId, archive }: { roomId: string; archive: boolean }) =>
      chatApi.archiveRoom(roomId, archive),
    onMutate: async ({ roomId, archive }) => {
      await qc.cancelQueries({ queryKey: ['chat-rooms'] })
      const previousRooms = qc.getQueryData<ChatRoom[]>(['chat-rooms'])
      qc.setQueryData<ChatRoom[]>(['chat-rooms'], (old) =>
        old ? old.map((r) => (r.id === roomId ? { ...r, archived: archive } : r)) : old
      )
      return { previousRooms }
    },
    onError: (_err, { archive }, context) => {
      if (context?.previousRooms !== undefined) {
        qc.setQueryData(['chat-rooms'], context.previousRooms)
      }
      toastService.show({
        kind: 'error',
        title: archive ? 'تعذّرت أرشفة المحادثة' : 'تعذّرت استعادة المحادثة',
      })
    },
    onSuccess: (_data, { archive }) => {
      toastService.show({
        kind: 'success',
        title: archive ? 'تمت أرشفة المحادثة' : 'تمت استعادة المحادثة',
      })
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

export function useMarkRoomRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roomId: string) => chatApi.markRoomRead(roomId),
    onMutate: async (roomId) => {
      await qc.cancelQueries({ queryKey: ['chat-rooms'] })
      const previousRooms = qc.getQueryData<ChatRoom[]>(['chat-rooms'])
      qc.setQueryData<ChatRoom[]>(['chat-rooms'], (old) =>
        old ? old.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)) : old
      )
      return { previousRooms }
    },
    onError: (_err, _roomId, context) => {
      if (context?.previousRooms !== undefined) {
        qc.setQueryData(['chat-rooms'], context.previousRooms)
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
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
