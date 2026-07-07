import { create } from 'zustand'

interface ChatState {
  activeRoomId: string | null
  setActiveRoomId: (id: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoomId: null,
  setActiveRoomId: (id) => set({ activeRoomId: id }),
}))
