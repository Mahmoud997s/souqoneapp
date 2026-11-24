import { apiClient } from './client'
import { ChatRoom, ChatMessage } from '../types/listing.types'

export const CHAT_CONVERSATIONS_ALLOWED_PARAMS = ['search', 'includeArchived'] as const

export interface GetChatRoomsParams {
  search?: string
  includeArchived?: boolean
}

export function buildGetChatRoomsParams(params?: GetChatRoomsParams): Record<string, string | boolean> | undefined {
  if (!params) return undefined
  const out: Record<string, string | boolean> = {}
  if (params.includeArchived === true) {
    out.includeArchived = true
  }
  const trimmedSearch = params.search?.trim()
  if (trimmedSearch) {
    out.search = trimmedSearch
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export const chatApi = {
  getRooms: (params?: GetChatRoomsParams) => {
    const queryParams = buildGetChatRoomsParams(params)
    return apiClient.get<ChatRoom[]>(
      '/chat/conversations',
      queryParams ? { params: queryParams } : undefined
    )
  },
  getMessages: (roomId: string, page = 1, limit = 30) =>
    apiClient.get<ChatMessage[]>(`/chat/conversations/${roomId}?page=${page}&limit=${limit}`),
  createRoom: (data: { entityType: string; entityId: string; receiverId?: string; listingId?: string }) =>
    apiClient.post<ChatRoom>('/chat/conversations', data),
  sendMessage: (roomId: string, data: { content?: string; type?: string; mediaUrl?: string }) =>
    apiClient.post<ChatMessage>(`/chat/conversations/${roomId}/messages`, data),
  archiveRoom: (id: string, archive: boolean) =>
    apiClient.patch<{ message: string }>(`/chat/conversations/${id}/archive`, { archive }),
  markRoomRead: (id: string) =>
    apiClient.patch<{ message?: string }>(`/chat/conversations/${id}/read`),
}
