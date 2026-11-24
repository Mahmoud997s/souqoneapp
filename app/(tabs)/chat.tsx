import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
  ListRenderItemInfo,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { type Swipeable } from 'react-native-gesture-handler'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { useChatRooms, useArchiveRoom, useMarkRoomRead } from '../../src/hooks/useChat'
import { useAuthStore } from '../../src/store/authStore'
import { usePinStore } from '../../src/store/pinStore'
import { useSocketStore } from '../../src/store/socketStore'
import { toastService, type ActionSheetOption } from '../../src/store/toastStore'
import { ChatListHeader } from '../../src/components/chat/ChatListHeader'
import { type ChatFilterTabType } from '../../src/components/chat/ChatFilterTabs'
import { ChatItemCard } from '../../src/components/chat/ChatItemCard'
import { ChatListSkeleton } from '../../src/components/chat/ChatListSkeleton'
import { ChatConnectionBanner } from '../../src/components/chat/ChatConnectionBanner'
import { ChatRoom } from '../../src/types/listing.types'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { AppButton } from '../../src/components/ui/AppButton'
import { getListErrorProps } from '../../src/utils/getListErrorProps'

export default function ChatListScreen() {
  const insets = useSafeAreaInsets()
  const [headerHeight, setHeaderHeight] = useState(() => insets.top + 136)
  const openSwipeRef = useRef<Swipeable | null>(null)

  const { user } = useAuthStore()
  const isSocketConnected = useSocketStore((s) => s.isConnected)
  const {
    data: rooms,
    isLoading,
    isError,
    error,
    isRefetchError,
    isRefetching,
    refetch,
  } = useChatRooms()
  const archiveMutation = useArchiveRoom()
  const markReadMutation = useMarkRoomRead()

  const [activeTab, setActiveTab] = useState<ChatFilterTabType>('all')
  const [searchText, setSearchText] = useState('')
  const { pinnedIds, togglePin } = usePinStore()

  const isRoomSelling = useCallback(
    (r: ChatRoom) => {
      const listingUserId =
        (r.listing as { userId?: string; user?: { id?: string } } | undefined)?.userId ||
        (r.listing as { userId?: string; user?: { id?: string } } | undefined)?.user?.id ||
        (r as unknown as { sellerId?: string; creatorId?: string })?.sellerId ||
        (r as unknown as { sellerId?: string; creatorId?: string })?.creatorId
      return !!user?.id && listingUserId === user?.id
    },
    [user?.id]
  )

  const counts = useMemo(() => {
    const allRooms: ChatRoom[] = (rooms as ChatRoom[]) || []
    let all = 0
    let unread = 0
    let buying = 0
    let selling = 0
    let archived = 0

    allRooms.forEach((r) => {
      if (r.archived) {
        archived += 1
      } else {
        all += 1
        if ((r.unreadCount ?? 0) > 0) {
          unread += 1
        }
        if (isRoomSelling(r)) {
          selling += 1
        } else {
          buying += 1
        }
      }
    })

    return { all, unread, buying, selling, archived }
  }, [rooms, isRoomSelling])

  const totalUnreadCount = counts.unread ?? 0

  const filteredRooms = useMemo(() => {
    if (!rooms) return []

    let result = rooms as ChatRoom[]

    switch (activeTab) {
      case 'unread':
        result = result.filter((r) => !r.archived && (r.unreadCount ?? 0) > 0)
        break
      case 'buying':
        result = result.filter((r) => !r.archived && !isRoomSelling(r))
        break
      case 'selling':
        result = result.filter((r) => !r.archived && isRoomSelling(r))
        break
      case 'archived':
        result = result.filter((r) => !!r.archived)
        break
      case 'all':
      default:
        result = result.filter((r) => !r.archived)
        break
    }

    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim()
      result = result.filter((room) => {
        const otherParticipant =
          room.participants?.find((p) => p.id !== user?.id) ||
          room.participants?.[0]
        const nameMatch =
          otherParticipant?.displayName?.toLowerCase().includes(query) ||
          otherParticipant?.username?.toLowerCase().includes(query)
        const listingMatch =
          room.listing?.title?.toLowerCase().includes(query) ||
          room.entityTitle?.toLowerCase().includes(query)
        const lastMsgMatch = room.lastMessage?.content?.toLowerCase().includes(query)

        return !!(nameMatch || listingMatch || lastMsgMatch)
      })
    }

    return [...result].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id)
      const bPinned = pinnedIds.includes(b.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : 0
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : 0
      return timeB - timeA
    })
  }, [rooms, activeTab, searchText, pinnedIds, user?.id, isRoomSelling])

  const handleRoomPress = useCallback(
    (room: ChatRoom) => {
      const otherParticipant = room.participants?.find((p) => p.id !== user?.id)
      const otherName =
        otherParticipant?.displayName ||
        otherParticipant?.username ||
        (room.listing ? room.listing.title : '')
      const otherAvatar = otherParticipant?.avatarUrl || otherParticipant?.avatar || ''

      router.push({
        pathname: '/chat/[id]',
        params: {
          id: room.id,
          otherUserName: otherName,
          otherUserAvatar: otherAvatar,
        },
      })
    },
    [user?.id]
  )

  const handleArchive = useCallback(
    (room: ChatRoom) => {
      archiveMutation.mutate({ roomId: room.id, archive: !room.archived })
    },
    [archiveMutation]
  )

  const handlePin = useCallback(
    (room: ChatRoom) => {
      togglePin(room.id)
    },
    [togglePin]
  )

  const handleMarkRead = useCallback(
    (room: ChatRoom) => {
      if ((room.unreadCount ?? 0) > 0) {
        markReadMutation.mutate(room.id)
      }
    },
    [markReadMutation]
  )

  const handleRoomLongPress = useCallback(
    (room: ChatRoom) => {
      const isPinned = pinnedIds.includes(room.id)
      const isArchived = !!room.archived
      const otherParticipant = room.participants?.find((p) => p.id !== user?.id)
      const participantName =
        otherParticipant?.displayName || otherParticipant?.username || 'خيارات المحادثة'

      const options: ActionSheetOption[] = []
      if ((room.unreadCount ?? 0) > 0) {
        options.push({
          text: 'تحديد كمقروء',
          onPress: () => handleMarkRead(room),
          style: 'default',
        })
      }
      options.push({
        text: isPinned ? 'إلغاء التثبيت' : 'تثبيت',
        onPress: () => togglePin(room.id),
        style: 'default',
      })
      options.push({
        text: isArchived ? 'استعادة' : 'أرشفة',
        onPress: () => handleArchive(room),
        style: 'default',
      })

      toastService.showActionSheet({ title: participantName, options })
    },
    [pinnedIds, user?.id, handleMarkRead, togglePin, handleArchive]
  )

  const handleSwipeWillOpen = useCallback((ref: Swipeable | null) => {
    if (openSwipeRef.current && openSwipeRef.current !== ref) {
      openSwipeRef.current.close()
    }
    openSwipeRef.current = ref
  }, [])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatRoom>) => (
      <ChatItemCard
        room={item}
        currentUserId={user?.id}
        isArchived={!!item.archived}
        isPinned={pinnedIds.includes(item.id)}
        onPress={handleRoomPress}
        onLongPress={handleRoomLongPress}
        onArchive={handleArchive}
        onPin={handlePin}
        onMarkRead={handleMarkRead}
        onSwipeWillOpen={handleSwipeWillOpen}
      />
    ),
    [
      user?.id,
      pinnedIds,
      handleRoomPress,
      handleRoomLongPress,
      handleArchive,
      handlePin,
      handleMarkRead,
      handleSwipeWillOpen,
    ]
  )

  const renderEmptyComponent = () => {
    if (isLoading) {
      return <ChatListSkeleton />
    }

    const allRoomsCount = (rooms as ChatRoom[] | undefined)?.length ?? 0
    if (isError && allRoomsCount === 0) {
      const errorProps = getListErrorProps(error, 'تعذّر تحميل الرسائل')
      return (
        <View style={styles.errorStateWrapper} testID="chat-list-error-state">
          <EmptyState
            icon={errorProps.icon}
            iconColor={errorProps.iconColor}
            title="تعذّر تحميل الرسائل"
            subtitle="تحقق من الاتصال ثم أعد المحاولة."
            actionLabel="إعادة المحاولة"
            onAction={() => refetch()}
            testID="chat-list-empty-state-error"
          />
        </View>
      )
    }

    const trimmedQuery = searchText.trim()
    if (trimmedQuery) {
      return (
        <View style={styles.emptyState} testID="chat-empty-search">
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{`لا توجد نتائج لـ «${trimmedQuery}»`}</Text>
          <Text style={styles.emptySub}>جرّب اسماً آخر أو جزءاً من عنوان الإعلان.</Text>
          <AppButton
            title="مسح البحث"
            variant="outline"
            size="default"
            onPress={() => setSearchText('')}
            style={styles.emptyBtn}
            testID="chat-empty-clear-search-btn"
          />
        </View>
      )
    }

    if (activeTab === 'unread') {
      return (
        <View style={styles.emptyState} testID="chat-empty-unread">
          <View style={styles.emptyIconCircle}>
            <Ionicons name="checkmark-done-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>جميع رسائلك مقروءة</Text>
          <Text style={styles.emptySub}>لا توجد رسائل جديدة حالياً.</Text>
          <AppButton
            title="عرض كل المحادثات"
            variant="outline"
            size="default"
            onPress={() => setActiveTab('all')}
            style={styles.emptyBtn}
            testID="chat-empty-show-all-btn"
          />
        </View>
      )
    }

    if (activeTab === 'archived') {
      return (
        <View style={styles.emptyState} testID="chat-empty-archived">
          <View style={styles.emptyIconCircle}>
            <Ionicons name="archive-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>لا توجد محادثات مؤرشفة</Text>
          <Text style={styles.emptySub}>
            ستظهر هنا المحادثات التي تقوم بأرشفتها للرجوع إليها في أي وقت.
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyState} testID="chat-empty-default">
        <View style={styles.emptyIconCircle}>
          <Ionicons name="chatbubbles-outline" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>لا توجد رسائل بعد</Text>
        <Text style={styles.emptySub}>
          عند تواصل أحد البائعين أو المشترين معك ستظهر المحادثات هنا.
        </Text>
        <AppButton
          title="تصفح الإعلانات"
          variant="primary"
          size="default"
          onPress={() => router.push('/(tabs)/search' as any)}
          style={styles.emptyBtn}
          testID="chat-empty-browse-btn"
        />
      </View>
    )
  }

  const allRoomsCount = (rooms as ChatRoom[] | undefined)?.length ?? 0
  const showOfflineBanner =
    !isSocketConnected || ((isError || isRefetchError) && allRoomsCount > 0)

  return (
    <View style={styles.container}>
      <ChatListHeader
        searchText={searchText}
        onSearchChange={setSearchText}
        unreadCount={totalUnreadCount}
        onNotificationsPress={() => router.push('/profile/notifications' as any)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        onLayout={(e) => {
          const measured = Math.round(e.nativeEvent.layout.height)
          if (measured > 0 && measured !== headerHeight) {
            setHeaderHeight(measured)
          }
        }}
      />

      <FlatList
        testID="chat-list-flatlist"
        data={isLoading ? [] : filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          showOfflineBanner ? (
            <View testID="chat-list-stale-banner">
              <ChatConnectionBanner isConnected={false} />
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerHeight + 6 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressViewOffset={headerHeight}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    paddingBottom: 110,
    flexGrow: 1,
  },
  errorStateWrapper: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space6,
    paddingTop: 56,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySoft12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space4,
  },
  emptyTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.slateDark,
    marginBottom: Spacing.space2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing.space5,
  },
  emptyBtn: {
    minWidth: 168,
    height: 44,
  },
})
