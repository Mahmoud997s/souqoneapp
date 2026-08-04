import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocalMessage } from '../hooks/useChatRoomLogic'

interface ChatMessagesState {
  messagesByRoom: Record<string, LocalMessage[]>
  addMessages: (roomId: string, messages: LocalMessage[]) => void
  addMessage: (roomId: string, message: LocalMessage) => void
  removeMessage: (roomId: string, messageId: string) => void
  updateMessage: (roomId: string, messageId: string, updates: Partial<LocalMessage>) => void
  markRoomAsRead: (roomId: string, currentUserId: string) => void
  clearRoom: (roomId: string) => void
}

export const useChatMessagesStore = create<ChatMessagesState>()(
  persist(
    (set, get) => ({
      messagesByRoom: {},

      addMessages: (roomId, newMessages) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] || []
          
          // Merge avoiding duplicates based on message ID
          const merged = [...existing]
          const existingIds = new Set(existing.map(m => m.id))
          
          newMessages.forEach(msg => {
            if (!existingIds.has(msg.id)) {
              merged.push(msg)
            } else {
              // Update existing
              const index = merged.findIndex(m => m.id === msg.id)
              if (index !== -1) {
                merged[index] = { ...merged[index], ...msg }
              }
            }
          })

          // Keep sorted by date
          merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: merged
            }
          }
        })
      },

      addMessage: (roomId, message) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] || []
          
          // Prevent duplicates
          if (existing.some(m => m.id === message.id)) {
             return state
          }
          
          const updated = [...existing, message]
          updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: updated
            }
          }
        })
      },

      removeMessage: (roomId, messageId) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] || []
          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: existing.filter(m => m.id !== messageId)
            }
          }
        })
      },

      updateMessage: (roomId, messageId, updates) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] || []
          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: existing.map(m => m.id === messageId ? { ...m, ...updates } : m)
            }
          }
        })
      },

      markRoomAsRead: (roomId, currentUserId) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] || []
          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: existing.map(m => m.senderId === currentUserId ? { ...m, isRead: true } : m)
            }
          }
        })
      },

      clearRoom: (roomId) => {
        set((state) => {
          const newMap = { ...state.messagesByRoom }
          delete newMap[roomId]
          return { messagesByRoom: newMap }
        })
      }
    }),
    {
      name: 'chat-messages-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only keep the last 50 messages per room in local storage to prevent bloating
      partialize: (state) => {
        const minimizedMessages: Record<string, LocalMessage[]> = {}
        Object.keys(state.messagesByRoom).forEach(roomId => {
          const msgs = state.messagesByRoom[roomId]
          minimizedMessages[roomId] = msgs.slice(-50)
        })
        return { messagesByRoom: minimizedMessages }
      }
    }
  )
)
