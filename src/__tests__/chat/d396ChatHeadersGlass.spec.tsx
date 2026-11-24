import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { GlassNavBar } from '../../components/ui/GlassNavBar'
import { ChatRoomNavTitle } from '../../components/chat/ChatRoomNavTitle'
import { ChatListHeader } from '../../components/chat/ChatListHeader'
import ChatListScreen from '../../../app/(tabs)/chat'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useChat', () => ({
  useChatRooms: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    isRefetchError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useArchiveRoom: () => ({ mutate: jest.fn() }),
  useMarkRoomRead: () => ({ mutate: jest.fn() }),
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}))

jest.mock('../../store/pinStore', () => ({
  usePinStore: () => ({ pinnedIds: [], togglePin: jest.fn() }),
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  GlassSurface: 'GlassSurface',
  useGlassSupport: () => ({ mode: 'solid' }),
}))

describe('D-396 — Chat Headers Glass & Refresh Offset', () => {
  it('(a) neither chat screen uses AnimatedLinearGradient or navy hero gradient and deleted headers are gone', () => {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const chatListSrc = fs.readFileSync(path.join(repoRoot, 'app', '(tabs)', 'chat.tsx'), 'utf8')
    const chatRoomSrc = fs.readFileSync(path.join(repoRoot, 'app', 'chat', '[id].tsx'), 'utf8')

    expect(chatListSrc).not.toContain('AnimatedLinearGradient')
    expect(chatListSrc).not.toContain('Gradients.hero')
    expect(chatListSrc).not.toContain('ChatHeader')
    expect(chatRoomSrc).not.toContain('AnimatedLinearGradient')
    expect(chatRoomSrc).not.toContain('Gradients.hero')
    expect(chatRoomSrc).not.toContain('ChatRoomHeader')

    expect(fs.existsSync(path.join(repoRoot, 'src', 'components', 'chat', 'ChatHeader.tsx'))).toBe(false)
    expect(fs.existsSync(path.join(repoRoot, 'src', 'components', 'chat', 'ChatRoomHeader.tsx'))).toBe(false)
  })

  it('(b) ChatListScreen progressViewOffset equals measured headerHeight from ChatListHeader onLayout', async () => {
    await render(<ChatListScreen />)
    const list = screen.getByTestId('chat-list-flatlist')

    expect(list.props.refreshControl.props.progressViewOffset).toBe(44 + 136)

    const header = screen.getByTestId('chat-list-header')
    await act(async () => {
      fireEvent(header, 'layout', { nativeEvent: { layout: { height: 192 } } })
    })

    const updatedList = screen.getByTestId('chat-list-flatlist')
    expect(updatedList.props.refreshControl.props.progressViewOffset).toBe(192)
    expect(updatedList.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 198 })])
    )
  })

  it('(c) ChatRoomNavTitle keeps long name on 1 line and shows online/typing status only when active', async () => {
    const longName = 'عبدالرحمن بن محمد بن سعيد الحارثي للمعدات الثقيلة'
    const view = await render(
      <ChatRoomNavTitle displayName={longName} isOnline={true} isTyping={false} />
    )
    const nameEl = screen.getByTestId('chat-room-nav-title-name')
    expect(nameEl.props.numberOfLines).toBe(1)
    expect(nameEl.props.ellipsizeMode).toBe('tail')
    expect(screen.getByText('متصل الآن')).toBeTruthy()

    await view.rerender(
      <ChatRoomNavTitle displayName={longName} isOnline={false} isTyping={false} />
    )
    expect(screen.queryByTestId('chat-room-nav-title-status')).toBeNull()
    expect(screen.queryByText('غير متصل')).toBeNull()

    await view.rerender(
      <ChatRoomNavTitle displayName={longName} isOnline={true} isTyping={true} />
    )
    expect(screen.getByText('يكتب الآن')).toBeTruthy()
  })

  it('(d) bell, search clear, and GlassNavBar buttons have accessibilityLabel and >= 44pt touch target', async () => {
    const onSearchChange = jest.fn()
    await render(
      <ChatListHeader
        searchText="تويوتا"
        onSearchChange={onSearchChange}
        unreadCount={3}
        activeTab="all"
        onTabChange={jest.fn()}
      />
    )

    const bell = screen.getByTestId('chat-notifications-btn')
    expect(bell.props.accessibilityLabel).toBe('الإشعارات')
    const bellHit = bell.props.hitSlop
    expect(38 + (bellHit?.top ?? 0) + (bellHit?.bottom ?? 0)).toBeGreaterThanOrEqual(44)

    const clearBtn = screen.getByTestId('chat-search-clear')
    expect(clearBtn.props.accessibilityLabel).toBe('مسح البحث')
    expect(clearBtn.props.hitSlop.top + clearBtn.props.hitSlop.bottom).toBeGreaterThanOrEqual(28)

    await render(
      <GlassNavBar
        title="خالد"
        paddingTop={44}
        onBackPress={jest.fn()}
        actions={[
          {
            icon: 'ellipsis-vertical',
            onPress: jest.fn(),
            accessibilityLabel: 'خيارات المحادثة',
            testID: 'chat-room-options-btn',
          },
        ]}
      />
    )
    const optBtn = screen.getByTestId('chat-room-options-btn')
    expect(optBtn.props.accessibilityLabel).toBe('خيارات المحادثة')
    const optHit = optBtn.props.hitSlop
    expect(38 + (optHit?.top ?? 0) + (optHit?.bottom ?? 0)).toBeGreaterThanOrEqual(44)
  })

  it('(e) GlassNavBar preserves existing plain-title callers and renders titleContent when passed', async () => {
    const view = await render(
      <GlassNavBar title="المفضلة" paddingTop={44} onBackPress={jest.fn()} />
    )
    expect(screen.getByText('المفضلة')).toBeTruthy()
    expect(screen.queryByTestId('glass-nav-bar-title-content')).toBeNull()

    await view.rerender(
      <GlassNavBar
        title="محمد الكندي"
        paddingTop={44}
        onBackPress={jest.fn()}
        titleContent={<ChatRoomNavTitle displayName="محمد الكندي" isOnline={true} />}
      />
    )
    const customWrap = screen.getByTestId('glass-nav-bar-title-content')
    expect(customWrap.props.accessibilityLabel).toBe('محمد الكندي')
    expect(screen.getByText('متصل الآن')).toBeTruthy()
  })
})
