import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Swipeable } from 'react-native-gesture-handler'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Config } from '../../constants/config'
import { ChatRoom } from '../../types/listing.types'

export interface ChatItemCardProps {
  room: ChatRoom
  currentUserId?: string
  isArchived?: boolean
  isPinned?: boolean
  onPress: (room: ChatRoom) => void
  onLongPress?: (room: ChatRoom) => void
  onArchive?: (room: ChatRoom) => void
  onPin?: (room: ChatRoom) => void
  onDelete?: (room: ChatRoom) => void
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

  return date.toLocaleDateString('ar-OM', { month: 'numeric', day: 'numeric' })
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
  onDelete,
}) => {
  const swipeableRef = useRef<Swipeable>(null)

  const otherParticipant =
    room.participants?.find((p: any) => p.id !== currentUserId) ??
    room.participants?.[0]

  const displayName =
    otherParticipant?.displayName ??
    otherParticipant?.username ??
    'مستخدم سوق ون'

  const avatarUri = getAvatarUrl(
    otherParticipant?.avatarUrl || (otherParticipant as any)?.avatar
  )

  const unreadCount = room.unreadCount ?? 0
  const hasUnread = unreadCount > 0
  const lastMessage = room.lastMessage
  const isOwnLastMessage =
    lastMessage?.sender?.id === currentUserId ||
    (lastMessage as any)?.senderId === currentUserId

  const listing = room.listing
  const isOwnerOfListing = listing && (listing as any).userId === currentUserId
  const listingImage = listing?.images?.[0]?.url

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(room)
  }

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onLongPress(room)
    }
  }

  // ─── Swipe Actions: Right (Archive / Unarchive) ───
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onArchive) return null

    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isArchived ? styles.actionBtnUnarchive : styles.actionBtnArchive,
          ]}
          activeOpacity={0.82}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            swipeableRef.current?.close()
            onArchive(room)
          }}
        >
          <View style={styles.actionIconCircle}>
            <Ionicons
              name={isArchived ? 'refresh' : 'archive'}
              size={18}
              color={Colors.white}
            />
          </View>
          <Text style={styles.actionBtnText}>
            {isArchived ? 'استعادة' : 'أرشفة'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ─── Swipe Actions: Left (Pin & Delete) ───
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    return (
      <View style={styles.leftActionsContainer}>
        {onPin && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPin]}
            activeOpacity={0.82}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              swipeableRef.current?.close()
              onPin(room)
            }}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={17}
                color={Colors.white}
              />
            </View>
            <Text style={styles.actionBtnText}>
              {isPinned ? 'إلغاء' : 'تثبيت'}
            </Text>
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDelete]}
            activeOpacity={0.82}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              swipeableRef.current?.close()
              onDelete(room)
            }}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="trash-outline" size={17} color={Colors.white} />
            </View>
            <Text style={styles.actionBtnText}>حذف</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={1.8}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      containerStyle={styles.swipeContainer}
    >
      <TouchableOpacity
        style={[
          styles.container,
          hasUnread && styles.containerUnread,
          isArchived && styles.containerArchived,
          isPinned && styles.containerPinned,
        ]}
        activeOpacity={0.75}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        {/* ── Top Main Row: Avatar + Main Details ── */}
        <View style={styles.mainRow}>
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {displayName.trim().charAt(0) || 'س'}
                </Text>
              </View>
            )}
            {hasUnread && <View style={styles.unreadDot} />}
          </View>

          {/* Info Column */}
          <View style={styles.infoCol}>
            {/* Name & Timestamp */}
            <View style={styles.headerRow}>
              <View style={styles.nameWrap}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {displayName}
                </Text>
                {isPinned && (
                  <View style={styles.pinIconWrap}>
                    <Ionicons name="pin" size={11} color={Colors.primary} />
                  </View>
                )}
              </View>
              <Text style={styles.timeText}>
                {formatChatTime(room.updatedAt || lastMessage?.createdAt)}
              </Text>
            </View>

            {/* Last Message Preview & Status */}
            <View style={styles.messageRow}>
              <View style={styles.msgContentRow}>
                {isOwnLastMessage && (
                  <Ionicons
                    name={lastMessage?.isRead ? 'checkmark-done' : 'checkmark'}
                    size={14}
                    color={lastMessage?.isRead ? Colors.primary : '#94A3B8'}
                    style={styles.sentIcon}
                  />
                )}
                <Text
                  style={[
                    styles.messageText,
                    hasUnread && styles.messageTextUnread,
                  ]}
                  numberOfLines={1}
                >
                  {lastMessage?.content || 'ابدأ المحادثة الآن...'}
                </Text>
              </View>

              {/* Unread Counter Badge */}
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '+99' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Optional Bottom Row: Associated Listing Snippet ── */}
        {listing && listing.title ? (
          <View style={styles.listingSnippet}>
            {listingImage ? (
              <Image
                source={{ uri: listingImage }}
                style={styles.listingThumb}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.listingThumbFallback}>
                <Ionicons name="pricetag-outline" size={12} color={Colors.primary} />
              </View>
            )}

            <Text style={styles.listingTitle} numberOfLines={1}>
              {listing.title}
            </Text>

            <View
              style={[
                styles.roleTag,
                isOwnerOfListing ? styles.roleTagSeller : styles.roleTagBuyer,
              ]}
            >
              <Text
                style={[
                  styles.roleTagText,
                  isOwnerOfListing ? styles.roleTagTextSeller : styles.roleTagTextBuyer,
                ]}
              >
                {isOwnerOfListing ? 'إعلانك' : 'مشترياتك'}
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    </Swipeable>
  )
})

const styles = StyleSheet.create({
  swipeContainer: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#EBF0F6',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  containerUnread: {
    backgroundColor: '#FAFBFD',
    borderColor: 'rgba(13, 48, 96, 0.14)',
  },
  containerArchived: {
    opacity: 0.72,
    backgroundColor: '#F9FAFB',
  },
  containerPinned: {
    borderColor: 'rgba(13, 48, 96, 0.16)',
    backgroundColor: '#FAFBFD',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginEnd: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDF2F7',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 48, 96, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: Colors.primary,
    includeFontPadding: false,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.brandOrange,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginEnd: 8,
    gap: 5,
  },
  nameText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14.5,
    lineHeight: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
    includeFontPadding: false,
  },
  pinIconWrap: {
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    backgroundColor: 'rgba(13, 48, 96, 0.06)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 15,
    color: '#8E9BAE',
    writingDirection: 'rtl',
    textAlign: 'left',
    includeFontPadding: false,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginEnd: 8,
  },
  sentIcon: {
    marginEnd: 3,
  },
  messageText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    writingDirection: 'rtl',
    textAlign: 'left',
    flex: 1,
    includeFontPadding: false,
  },
  messageTextUnread: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  unreadBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 10,
    lineHeight: 13,
    color: Colors.white,
    includeFontPadding: false,
  },
  listingSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 8,
    gap: 7,
    borderWidth: 1,
    borderColor: '#E6ECF3',
  },
  listingThumb: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  listingThumbFallback: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: 'rgba(13, 48, 96, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15,
    color: '#475569',
    writingDirection: 'rtl',
    textAlign: 'left',
    flex: 1,
    includeFontPadding: false,
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: Radius.pill,
  },
  roleTagSeller: {
    backgroundColor: 'rgba(13, 48, 96, 0.08)',
  },
  roleTagBuyer: {
    backgroundColor: 'rgba(232, 120, 30, 0.1)',
  },
  roleTagText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9.5,
    lineHeight: 12,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  roleTagTextSeller: {
    color: Colors.primary,
  },
  roleTagTextBuyer: {
    color: Colors.brandOrange,
  },
  // ─── Physical RTL Compliant Swipe Action Styles ───
  rightActionsContainer: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 3,
  },
  leftActionsContainer: {
    width: 144,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 3,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 3,
  },
  actionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnArchive: {
    backgroundColor: '#334155',
  },
  actionBtnUnarchive: {
    backgroundColor: '#059669',
  },
  actionBtnPin: {
    backgroundColor: Colors.primary,
  },
  actionBtnDelete: {
    backgroundColor: '#EF4444',
  },
  actionBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 13,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
})
