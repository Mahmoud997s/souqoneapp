import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Typography } from '../../src/constants/typography'
import { useChatRooms } from '../../src/hooks/useChat'
import { useAuthStore } from '../../src/store/authStore'
import { useArchiveStore } from '../../src/store/archiveStore'
import { usePinStore } from '../../src/store/pinStore'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { dialogService } from '../../src/store/dialogStore'
import { ChatHeader } from '../../src/components/chat/ChatHeader'
import { ChatFilterTabs, ChatFilterTabType } from '../../src/components/chat/ChatFilterTabs'
import { ChatItemCard } from '../../src/components/chat/ChatItemCard'
import { ChatListSkeleton } from '../../src/components/chat/ChatListSkeleton'
import { ChatRoom } from '../../src/types/listing.types'

export default function ChatListScreen() {
  const insets = useSafeAreaInsets()
  const HERO_HEIGHT = insets.top + 120
  const COMPACT_HEIGHT = insets.top + 54
  const FILTER_BAR_HEIGHT = 44

  const { user } = useAuthStore()
  const { data: rooms, isLoading, refetch } = useChatRooms()
  const { scrollHandler, scrollY } = useScrollAwareNav()
  const { navHidden } = useNavVisibility()

  const [activeTab, setActiveTab] = useState<ChatFilterTabType>('all')
  const [searchText, setSearchText] = useState('')
  const { archivedIds, toggleArchive } = useArchiveStore()
  const { pinnedIds, togglePin } = usePinStore()

  // Compute live count badges for each filter tab
  const isRoomSelling = useCallback(
    (r: ChatRoom) => {
      const listingUserId =
        (r.listing as any)?.userId ||
        (r.listing as any)?.user?.id ||
        (r as any)?.sellerId ||
        (r as any)?.creatorId
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
      const isArchived = archivedIds.includes(r.id)
      if (isArchived) {
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
  }, [rooms, archivedIds, isRoomSelling])

  const totalUnreadCount = counts.unread ?? 0

  // Filter & Search Logic
  const filteredRooms = useMemo(() => {
    if (!rooms) return []

    let result = rooms as ChatRoom[]

    // 1. Filter by Active Tab
    switch (activeTab) {
      case 'unread':
        result = result.filter(
          (r) => !archivedIds.includes(r.id) && (r.unreadCount ?? 0) > 0
        )
        break
      case 'buying':
        result = result.filter(
          (r) => !archivedIds.includes(r.id) && !isRoomSelling(r)
        )
        break
      case 'selling':
        result = result.filter(
          (r) => !archivedIds.includes(r.id) && isRoomSelling(r)
        )
        break
      case 'archived':
        result = result.filter((r) => archivedIds.includes(r.id))
        break
      case 'all':
      default:
        result = result.filter((r) => !archivedIds.includes(r.id))
        break
    }

    // 2. Search Text Filtering
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim()
      result = result.filter((room) => {
        const otherParticipant =
          room.participants?.find((p) => p.id !== user?.id) ||
          room.participants?.[0]
        const nameMatch =
          otherParticipant?.displayName?.toLowerCase().includes(query) ||
          otherParticipant?.username?.toLowerCase().includes(query) ||
          (otherParticipant as any)?.name?.toLowerCase().includes(query)
        const listingMatch = room.listing?.title?.toLowerCase().includes(query)
        const lastMsgMatch = room.lastMessage?.content?.toLowerCase().includes(query)

        return !!(nameMatch || listingMatch || lastMsgMatch)
      })
    }

    // 3. Sort Pinned items to the top, then by last message / update time
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
  }, [rooms, activeTab, searchText, archivedIds, pinnedIds, user?.id, isRoomSelling])

  // Handlers
  const handleRoomPress = useCallback((room: ChatRoom) => {
    const otherParticipant = room.participants?.find((p) => p.id !== user?.id)
    const otherName = otherParticipant?.displayName || otherParticipant?.username || (room.listing ? room.listing.title : '')
    const otherAvatar = otherParticipant?.avatarUrl || otherParticipant?.avatar || ''

    router.push({
      pathname: '/chat/[id]',
      params: {
        id: room.id,
        otherUserName: otherName,
        otherUserAvatar: otherAvatar,
      },
    })
  }, [user?.id])

  const handleRoomLongPress = useCallback(
    (room: ChatRoom) => {
      const isPinned = pinnedIds.includes(room.id)
      const isArchived = archivedIds.includes(room.id)
      const otherParticipant = room.participants?.find((p) => p.id !== user?.id)
      const participantName = otherParticipant?.displayName || otherParticipant?.username || 'المستخدم'

      dialogService.confirm(
        participantName,
        room.listing?.title
          ? `إعلان: ${room.listing.title}`
          : 'خيارات المحادثة السريعة',
        () => togglePin(room.id),
        isPinned ? 'إلغاء التثبيت 📌' : 'تثبيت في الأعلى 📌',
        isArchived ? 'إلغاء الأرشفة 📥' : 'أرشفة المحادثة 📦'
      )
    },
    [pinnedIds, archivedIds, user?.id, togglePin]
  )

  const handleArchive = useCallback(
    (room: ChatRoom) => {
      toggleArchive(room.id)
    },
    [toggleArchive]
  )

  const handlePin = useCallback(
    (room: ChatRoom) => {
      togglePin(room.id)
    },
    [togglePin]
  )

  const handleDelete = useCallback(
    (room: ChatRoom) => {
      dialogService.confirm(
        'حذف المحادثة',
        'هل أنت متأكد من حذف هذه المحادثة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
        () => toggleArchive(room.id),
        'حذف نهائي',
        'إلغاء',
        true
      )
    },
    [toggleArchive]
  )

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatRoom>) => (
      <View style={styles.itemWrapper}>
        <ChatItemCard
          room={item}
          currentUserId={user?.id}
          isArchived={archivedIds.includes(item.id)}
          isPinned={pinnedIds.includes(item.id)}
          onPress={handleRoomPress}
          onLongPress={handleRoomLongPress}
          onArchive={handleArchive}
          onPin={handlePin}
          onDelete={handleDelete}
        />
      </View>
    ),
    [
      user?.id,
      archivedIds,
      pinnedIds,
      handleRoomPress,
      handleRoomLongPress,
      handleArchive,
      handlePin,
      handleDelete,
    ]
  )

  const renderEmptyComponent = () => {
    if (isLoading) {
      return <ChatListSkeleton />
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name={
              activeTab === 'archived'
                ? 'archive-outline'
                : activeTab === 'unread'
                ? 'checkmark-done-circle-outline'
                : searchText
                ? 'search-outline'
                : 'chatbubbles-outline'
            }
            size={38}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {activeTab === 'archived'
            ? 'لا توجد محادثات مؤرشفة'
            : activeTab === 'unread'
            ? 'لا توجد رسائل غير مقروءة'
            : searchText
            ? 'لم يتم العثور على نتائج'
            : 'لا توجد محادثات حتى الآن'}
        </Text>
        <Text style={styles.emptySub}>
          {activeTab === 'archived'
            ? 'المحادثات التي تقوم بأرشفتها ستظهر هنا للرجوع إليها في أي وقت.'
            : activeTab === 'unread'
            ? 'رائع! لقد اطلعت على جميع رسائلك ومحادثاتك.'
            : searchText
            ? `لم نتمكن من العثور على ما يطابق "${searchText}". حاول البحث بكلمات أخرى.`
            : 'ابدأ المحادثة الآن وتواصل مع أصحاب الإعلانات والمشترين!'}
        </Text>
      </View>
    )
  }

  // ─── Filter Bar Animation (Follows header collapse & hides on scroll down / reveals on scroll up) ───
  const filterBarAnimStyle = useAnimatedStyle(() => {
    const currentHeaderBottom = interpolate(
      scrollY.value,
      [0, 15, 90],
      [HERO_HEIGHT, HERO_HEIGHT, COMPACT_HEIGHT],
      Extrapolation.CLAMP
    )

    const translateY = interpolate(
      navHidden.value,
      [0, 1],
      [0, -FILTER_BAR_HEIGHT],
      Extrapolation.CLAMP
    )

    const opacity = interpolate(
      navHidden.value,
      [0, 0.7, 1],
      [1, 0.3, 0],
      Extrapolation.CLAMP
    )

    return {
      top: currentHeaderBottom,
      transform: [{ translateY }],
      opacity,
    }
  })

  return (
    <View style={styles.container}>
      {/* Dynamic Animated Collapsible Header */}
      <ChatHeader
        scrollY={scrollY}
        searchText={searchText}
        onSearchChange={setSearchText}
        unreadCount={totalUnreadCount}
        totalCount={counts.all}
        onNotificationsPress={() => router.push('/profile/notifications' as any)}
      />

      {/* Floating Animated Filter Bar (Hides on scroll down, shows on scroll up) */}
      <Animated.View style={[styles.filterBarWrapper, filterBarAnimStyle]}>
        <ChatFilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
        />
      </Animated.View>

      {/* Conversations List with Reanimated FlatList and Scroll Handler */}
      <Animated.FlatList
        data={isLoading ? [] : filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: HERO_HEIGHT + FILTER_BAR_HEIGHT + 6 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressViewOffset={HERO_HEIGHT + FILTER_BAR_HEIGHT}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  filterBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
    backgroundColor: '#F8F9FB',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
  },
  contentContainer: {
    paddingBottom: 110,
  },
  itemWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 48, 96, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: Typography.titleMd.fontSize,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
})
