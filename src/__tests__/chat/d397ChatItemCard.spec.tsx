import React from 'react'
import fs from 'fs'
import path from 'path'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ChatItemCard } from '../../components/chat/ChatItemCard'
import type { ChatRoom } from '../../types/listing.types'

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}))

const createRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: 'room-1',
  entityType: 'CAR',
  entityId: 'car-1',
  archived: false,
  unreadCount: 2,
  updatedAt: new Date().toISOString(),
  participants: [
    { id: 'user-1', username: 'me', displayName: 'أنا' },
    { id: 'user-2', username: 'mohammed', displayName: 'محمد الكندي' },
  ],
  listing: {
    id: 'car-1',
    title: 'تويوتا كامري 2022',
    price: 9500,
    userId: 'user-2',
  },
  lastMessage: {
    id: 'msg-1',
    senderId: 'user-2',
    content: 'هل السيارة متاحة؟',
    createdAt: new Date().toISOString(),
    type: 'TEXT',
  },
  ...overrides,
})

describe('D-397 — ChatItemCard & Text Hygiene', () => {
  it('2. ChatItemCard row is 76px high with no border/shadow, formats 99+ badge and media labels without emoji', async () => {
    const room = createRoom({
      unreadCount: 120,
      lastMessage: {
        id: 'm2',
        senderId: 'user-2',
        content: '',
        createdAt: new Date().toISOString(),
        type: 'IMAGE',
      },
    })
    await render(
      <ChatItemCard
        room={room}
        currentUserId="user-1"
        onPress={jest.fn()}
        onArchive={jest.fn()}
        onPin={jest.fn()}
        onMarkRead={jest.fn()}
      />
    )
    const row = screen.getByTestId('chat-row-room-1')
    const flatStyle = StyleSheet.flatten(row.props.style)
    expect(flatStyle.height).toBe(76)
    expect(flatStyle.borderWidth).toBeUndefined()
    expect(flatStyle.shadowOpacity).toBeUndefined()
    expect(screen.getByText('99+')).toBeTruthy()
    expect(screen.getByText('صورة')).toBeTruthy()
    expect(screen.getByText('تويوتا كامري 2022 · 9,500 ر.ع')).toBeTruthy()
  })

  it('3. mark-as-read action renders only when unreadCount > 0 and calls markRoomRead', async () => {
    const onMarkRead = jest.fn()
    const unreadRoom = createRoom({ id: 'r-unread', unreadCount: 3 })
    await render(
      <ChatItemCard
        room={unreadRoom}
        currentUserId="user-1"
        onPress={jest.fn()}
        onMarkRead={onMarkRead}
      />
    )
    const markReadBtn = screen.getByTestId('chat-swipe-mark-read-r-unread')
    fireEvent.press(markReadBtn)
    expect(onMarkRead).toHaveBeenCalledWith(unreadRoom)

    await render(
      <ChatItemCard
        room={createRoom({ id: 'r-read', unreadCount: 0 })}
        currentUserId="user-1"
        onPress={jest.fn()}
        onMarkRead={onMarkRead}
      />
    )
    expect(screen.queryByTestId('chat-swipe-mark-read-r-read')).toBeNull()
  })

  it('7. "نهائياً" and emoji characters are absent from chat list files', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const checkedFiles = [
      path.join(repoRoot, 'app', '(tabs)', 'chat.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'ChatItemCard.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'ChatListSkeleton.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'ChatConnectionBanner.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'ChatFilterTabs.tsx'),
      path.join(repoRoot, 'src', 'components', 'chat', 'ChatListHeader.tsx'),
    ]
    const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u

    for (const file of checkedFiles) {
      const content = fs.readFileSync(file, 'utf8')
      expect(content).not.toContain('نهائياً')
      expect(emojiRegex.test(content)).toBe(false)
    }
  })
})
