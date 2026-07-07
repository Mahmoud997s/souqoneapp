import { apiClient } from './client'
import { ChatRoom, ChatMessage } from '../types/listing.types'

export const chatApi = {
  getRooms:    ()                                  => apiClient.get<ChatRoom[]>('/chat/conversations'),
  getMessages: (roomId: string, page = 1, limit = 30) => apiClient.get<ChatMessage[]>(`/chat/conversations/${roomId}?page=${page}&limit=${limit}`),
  createRoom:  (data: { entityType: string; entityId: string; receiverId?: string; listingId?: string }) =>
                 apiClient.post<ChatRoom>('/chat/conversations', data),
  sendMessage: (roomId: string, data: { content: string; type?: string; mediaUrl?: string }) =>
                 apiClient.post<ChatMessage>(`/chat/conversations/${roomId}/messages`, data),
}
