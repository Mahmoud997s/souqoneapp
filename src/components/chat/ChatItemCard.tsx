import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Swipeable } from 'react-native-gesture-handler'
import { Colors } from '../../constants/colors'
import { Config } from '../../constants/config'
import { ChatRoom } from '../../types/listing.types'
import { UserSummary } from '../../types/auth.types'
import { formatNumberWestern } from '../../utils/numberFormat'

export interface ChatItemCardProps {
  room: ChatRoom
  currentUserId?: string
  isArchived?: boolean
  isPinned?: boolean
  onPress: (room: ChatRoom) => void
  onLongPress?: (room: ChatRoom) => void
  onArchive?: (room: ChatRoom) => void
  onPin?: (room: ChatRoom) => void
  onMarkRead?: (room: ChatRoom) => void
  onSwipeWillOpen?: (ref: Swipeable | null) => void
}

function formatChatTime(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `${diffMins} د`
  if (diffHours < 24) return `${diffHours} س`
  if (diffDays === 1) return 'أمس'
  if (diffDays < 7) return `منذ ${diffDays} أيام`

  return `${date.getDate()}/${date.getMonth() + 1}`
}

function getAvatarUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${Config.socketUrl}${url}`
  return `${Config.socketUrl}/${url}`
}

export const ChatItemCard: React.FC<ChatItemCardProps> = React.memo(({
  room,
  currentUserId,
  isArchived = false,
  isPinned = false,
  onPress,
  onLongPress,
  onArchive,
  onPin,
  onMarkRead,
  onSwipeWillOpen,
}) => {
  const swipeableRef = useRef<Swipeable>(null)

  const otherParticipant =
    room.participants?.find((p: UserSummary) => p.id !== currentUserId) ??
    room.participants?.[0]

  const displayName =
    otherParticipant?.displayName ??
    otherParticipant?.username ??
    'مستخدم سوق ون'

  const avatarUri = getAvatarUrl(
    otherParticipant?.avatarUrl || otherParticipant?.avatar
  )

  const initialLetter = displayName.trim().charAt(0) || 'م'
  const unreadCount = room.unreadCount ?? 0
  const hasUnread = unreadCount > 0
  const unreadBadgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  const lastMessage = room.lastMessage
  const isOwnLastMessage =
    lastMessage?.sender?.id === currentUserId ||
    lastMessage?.senderId === currentUserId

  const listingTitle = room.listing?.title || room.entityTitle || ''
  const priceText =
    typeof room.listing?.price === 'number' && room.listing.price > 0
      ? `${formatNumberWestern(room.listing.price)} ر.ع`
      : ''
  const metaLine = [listingTitle, priceText].filter(Boolean).join(' · ')

  const msgType = lastMessage?.type as string | undefined
  const mediaMeta =
    msgType === 'IMAGE'
      ? { icon: 'image-outline' as const, label: 'صورة' }
      : msgType === 'FILE'
      ? { icon: 'document-text-outline' as const, label: 'ملف' }
      : msgType === 'VOICE' || msgType === 'AUDIO'
      ? { icon: 'mic-outline' as const, label: 'رسالة صوتية' }
      : null

  const previewText = mediaMeta
    ? mediaMeta.label
    : lastMessage?.content || 'بدء محادثة جديدة'

  const timeText = formatChatTime(lastMessage?.createdAt || room.updatedAt)

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(room)
  }

  const handleLongPress = () => {
    if (onLongPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onLongPress(room)
    }
  }

  // Start-side swipe in RTL (physical right, revealed when dragging toward end/left)
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if ((!hasUnread || !onMarkRead) && !onPin) return null

    return (
      <View style={styles.actionsContainer}>
        {hasUnread && onMarkRead ? (
          <TouchableOpacity
            testID={`chat-swipe-mark-read-${room.id}`}
            style={styles.actionPanel}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="تحديد كمقروء"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              swipeableRef.current?.close()
              onMarkRead(room)
            }}
          >
            <View style={[styles.actionCircle, styles.circlePrimary]}>
              <Ionicons name="checkmark-done-outline" size={20} color={Colors.white} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              تحديد كمقروء
            </Text>
          </TouchableOpacity>
        ) : null}

        {onPin ? (
          <TouchableOpacity
            testID={`chat-swipe-pin-${room.id}`}
            style={styles.actionPanel}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              swipeableRef.current?.close()
              onPin(room)
            }}
          >
            <View style={[styles.actionCircle, styles.circleNeutral]}>
              <Ionicons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={20}
                color={Colors.white}
              />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }

  // End-side swipe in RTL (physical left, revealed when dragging toward start/right)
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onArchive) return null

    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          testID={`chat-swipe-archive-${room.id}`}
          style={styles.actionPanel}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isArchived ? 'استعادة' : 'أرشفة'}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            swipeableRef.current?.close()
            onArchive(room)
          }}
        >
          <View
            style={[
              styles.actionCircle,
              isArchived ? styles.circlePrimary : styles.circleArchive,
            ]}
          >
            <Ionicons
              name={isArchived ? 'refresh-outline' : 'archive-outline'}
              size={20}
              color={Colors.white}
            />
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>
            {isArchived ? 'استعادة' : 'أرشفة'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (direction === 'left' && onArchive) {
      swipeableRef.current?.close()
      onArchive(room)
    } else if (direction === 'right') {
      swipeableRef.current?.close()
      if (hasUnread && onMarkRead) {
        onMarkRead(room)
      } else if (onPin) {
        onPin(room)
      }
    }
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={1.8}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableWillOpen={() => onSwipeWillOpen?.(swipeableRef.current)}
      onSwipeableOpen={handleSwipeOpen}
    >
      <TouchableOpacity
        testID={`chat-row-${room.id}`}
        style={styles.row}
        activeOpacity={0.75}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImg}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Text style={styles.avatarInitial}>{initialLetter}</Text>
          )}
        </View>

        <View style={styles.contentCol}>
          {/* Line 1: Name + Time */}
          <View style={styles.topLine}>
            <Text
              style={[styles.name, hasUnread && styles.nameUnread]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text>
            <Text
              style={[styles.time, hasUnread && styles.timeUnread]}
              numberOfLines={1}
            >
              {timeText}
            </Text>
          </View>

          {/* Line 2: Listing / Entity + Price */}
          {metaLine ? (
            <Text style={styles.metaLine} numberOfLines={1} ellipsizeMode="tail">
              {metaLine}
            </Text>
          ) : null}

          {/* Line 3: Last Message + Unread Badge / Pin */}
          <View style={styles.bottomLine}>
            <View style={styles.previewRow}>
              {isOwnLastMessage ? (
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={lastMessage?.isRead ? Colors.primaryStrong : Colors.textMuted}
                />
              ) : null}
              {mediaMeta ? (
                <Ionicons name={mediaMeta.icon} size={14} color={Colors.textMuted} />
              ) : null}
              <Text
                style={[styles.previewText, hasUnread && styles.previewTextUnread]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {previewText}
              </Text>
            </View>

            <View style={styles.trailing}>
              {isPinned ? (
                <Ionicons
                  testID={`chat-row-pin-${room.id}`}
                  name="pin"
                  size={14}
                  color={Colors.textMuted}
                />
              ) : null}
              {hasUnread ? (
                <View style={styles.unreadBadge} testID={`chat-row-unread-${room.id}`}>
                  <Text style={styles.unreadBadgeText}>{unreadBadgeText}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.divider} />
      </TouchableOpacity>
    </Swipeable>
  )
})

const styles = StyleSheet.create({
  row: {
    height: 76,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.slateSubtleBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarInitial: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.slateDark,
    writingDirection: 'rtl',
  },
  contentCol: {
    flex: 1,
    marginStart: 12,
    justifyContent: 'center',
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.slateDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  nameUnread: {
    fontFamily: 'Almarai_800ExtraBold',
  },
  time: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  timeUnread: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryStrong,
  },
  metaLine: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  previewTextUnread: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.slateDark,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: Colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.white,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    start: 74,
    end: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.chatDivider,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.slateCoolBg,
  },
  actionPanel: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePrimary: {
    backgroundColor: Colors.primaryStrong,
  },
  circleNeutral: {
    backgroundColor: Colors.slateDark,
  },
  circleArchive: {
    backgroundColor: Colors.primary,
  },
  actionLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.slateDark,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
})
