import fs from 'fs'
import path from 'path'
import { renderHook, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { CHAT_MEDIA_MAX_BYTES } from '../../constants/chatMedia'
import {
  resolveChatUploadMime,
  validateChatMediaSize,
  buildChatMediaFormData,
} from '../../utils/chatMediaUpload'

jest.setTimeout(30000)

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return { Ionicons: (props: { name: string }) => <Text testID={`ionicon-${props.name}`} /> }
})

jest.mock('../../services/socket', () => {
  const sock = { emit: jest.fn(), on: jest.fn(), off: jest.fn(), connected: true }
  return {
    getSocket: () => sock,
    socketService: {
      listen: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(() => Promise.resolve(sock)),
      disconnect: jest.fn(),
      getSocket: () => sock,
    },
  }
})

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
    chat: jest.fn(),
  },
}))

jest.mock('../../api/chat', () => ({
  chatApi: {
    getRooms: jest.fn(() => Promise.resolve({ data: [] })),
    getMessages: jest.fn(() => Promise.resolve({ data: [] })),
    sendMessage: jest.fn(() =>
      Promise.resolve({
        data: {
          id: 'srv-msg-1',
          senderId: 'user-me',
          content: '',
          type: 'AUDIO',
          mediaUrl: 'https://cdn.example/chat/voice.m4a',
          createdAt: '2026-11-27T12:00:00.000Z',
        },
      })
    ),
    markRoomRead: jest.fn(() => Promise.resolve({ data: {} })),
  },
}))

import { uploadsApi } from '../../api/uploads'
import { useChatRoomLogic } from '../../hooks/useChatRoomLogic'
import { useChatMessagesStore } from '../../store/chatMessagesStore'
import { useAuthStore } from '../../store/authStore'

describe('D-403 — Chat Media Upload to POST /uploads/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useChatMessagesStore.getState().reset()
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: 'user-me', username: 'me', displayName: 'أنا' } as never,
    })
  })

  it('1. resolveChatUploadMime maps all backend-allowed extensions and falls back to image/jpeg', () => {
    const cases: Array<[string, string]> = [
      ['voice.m4a', 'audio/m4a'],
      ['clip.mp4', 'audio/mp4'],
      ['sound.aac', 'audio/aac'],
      ['track.mp3', 'audio/mpeg'],
      ['note.ogg', 'audio/ogg'],
      ['rec.webm', 'audio/webm'],
      ['wave.wav', 'audio/wav'],
      ['doc.pdf', 'application/pdf'],
      ['photo.jpg', 'image/jpeg'],
      ['photo.jpeg', 'image/jpeg'],
      ['pic.png', 'image/png'],
      ['pic.webp', 'image/webp'],
      ['pic.avif', 'image/avif'],
      ['ios.heic', 'image/heic'],
      ['ios.heif', 'image/heif'],
      ['unknown.xyz', 'image/jpeg'],
    ]
    for (const [name, expected] of cases) {
      expect(resolveChatUploadMime(name)).toBe(expected)
    }

    const fd = buildChatMediaFormData('file:///tmp/contract.pdf', 'contract.pdf')
    const appendSpy = jest.spyOn(FormData.prototype, 'append')
    const fd2 = buildChatMediaFormData('file:///tmp/voice.m4a', 'voice.m4a')
    expect(fd).toBeInstanceOf(FormData)
    expect(fd2).toBeInstanceOf(FormData)
    expect(appendSpy).toHaveBeenCalledWith('file', {
      uri: 'file:///tmp/voice.m4a',
      type: 'audio/m4a',
      name: 'voice.m4a',
    })
    appendSpy.mockRestore()
  })

  it('2. validateChatMediaSize enforces 10MB for images/PDF and 5MB for audio', () => {
    expect(validateChatMediaSize(CHAT_MEDIA_MAX_BYTES.IMAGE, 'img.jpg', 'IMAGE')).toEqual({ valid: true })
    expect(validateChatMediaSize(CHAT_MEDIA_MAX_BYTES.IMAGE + 1, 'img.jpg', 'IMAGE')).toEqual({
      valid: false,
      reason: 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)',
    })

    expect(validateChatMediaSize(CHAT_MEDIA_MAX_BYTES.PDF, 'doc.pdf', 'FILE')).toEqual({ valid: true })
    expect(validateChatMediaSize(CHAT_MEDIA_MAX_BYTES.PDF + 1, 'doc.pdf', 'FILE')).toEqual({
      valid: false,
      reason: 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)',
    })

    expect(validateChatMediaSize(CHAT_MEDIA_MAX_BYTES.AUDIO, 'voice.m4a', 'VOICE')).toEqual({ valid: true })
    expect(validateChatMediaSize(CHAT_MEDIA_MAX_BYTES.AUDIO + 1, 'voice.m4a', 'VOICE')).toEqual({
      valid: false,
      reason: 'حجم الملف يتجاوز الحد المسموح (5 ميجابايت)',
    })
  })

  it('3. handleSend and handleRetry in useChatRoomLogic call uploadsApi.chat (never uploadsApi.single)', async () => {
    ;(uploadsApi.chat as jest.Mock).mockResolvedValue({
      data: { url: 'https://cdn.example/chat/voice.m4a' },
    })

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )

    const { result } = await renderHook(() => useChatRoomLogic('room-d403'), { wrapper })

    await act(async () => {
      await result.current.handleSend('', 'file:///tmp/voice.m4a', 'VOICE', {
        name: 'voice.m4a',
        size: 1024,
        duration: 4,
      })
    })

    expect(uploadsApi.chat).toHaveBeenCalledTimes(1)
    expect(uploadsApi.single).not.toHaveBeenCalled()

    // Now test handleRetry with a failed local file message
    await act(async () => {
      useChatMessagesStore.getState().addMessage('room-d403', {
        id: 'failed-file-1',
        senderId: 'user-me',
        content: '',
        createdAt: '2026-11-27T11:00:00.000Z',
        type: 'FILE',
        mediaUrl: 'file:///tmp/invoice.pdf',
        fileName: 'invoice.pdf',
        fileSize: 2048,
        error: true,
      })
    })

    await act(async () => {
      await result.current.handleRetry('failed-file-1')
    })

    expect(uploadsApi.chat).toHaveBeenCalledTimes(2)
    expect(uploadsApi.single).not.toHaveBeenCalled()
  })

  it('4. pre-check size blocks upload and surfaces Arabic error, and 400 backend Arabic message is preserved', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )

    const { result } = await renderHook(() => useChatRoomLogic('room-d403-err'), { wrapper })

    // Oversized audio -> blocked before calling uploadsApi.chat
    await act(async () => {
      await result.current.handleSend('', 'file:///tmp/big.m4a', 'VOICE', {
        name: 'big.m4a',
        size: CHAT_MEDIA_MAX_BYTES.AUDIO + 100,
      })
    })
    expect(uploadsApi.chat).not.toHaveBeenCalled()
    let msgs = useChatMessagesStore.getState().messagesByRoom['room-d403-err']
    expect(msgs[0].error).toBe(true)
    expect(msgs[0].errorReason).toBe('حجم الملف يتجاوز الحد المسموح (5 ميجابايت)')

    // Backend 400 Arabic message -> preserved in errorReason
    ;(uploadsApi.chat as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'امتداد الملف لا يطابق نوعه الحقيقي' },
      },
    })

    await act(async () => {
      await result.current.handleSend('', 'file:///tmp/bad.pdf', 'FILE', {
        name: 'bad.pdf',
        size: 1024,
      })
    })

    msgs = useChatMessagesStore.getState().messagesByRoom['room-d403-err']
    const failed400 = msgs.find((m) => m.fileName === 'bad.pdf')
    expect(failed400?.error).toBe(true)
    expect(failed400?.errorReason).toBe('امتداد الملف لا يطابق نوعه الحقيقي')
  })

  it('5. non-chat upload callers stay on uploadsApi.single while useChatRoomLogic has zero uploadsApi.single calls', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const chatHookSrc = fs.readFileSync(
      path.join(repoRoot, 'src', 'hooks', 'useChatRoomLogic.ts'),
      'utf8'
    )
    expect(chatHookSrc).not.toContain('uploadsApi.single')
    expect(chatHookSrc).toContain('uploadsApi.chat')

    const uploadsSrc = fs.readFileSync(path.join(repoRoot, 'src', 'api', 'uploads.ts'), 'utf8')
    expect(uploadsSrc).toContain("postUploadFile('/uploads'")
    expect(uploadsSrc).toContain("postUploadFile('/uploads/chat'")
  })
})
