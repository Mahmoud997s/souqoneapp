import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, StatusBar
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { detailRoute } from '../../src/navigation/listingRoutes'
import { Image } from 'expo-image'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { ChatRoomNavTitle } from '../../src/components/chat/ChatRoomNavTitle'
import { ChatConnectionBanner } from '../../src/components/chat/ChatConnectionBanner'
import { useChatRoomLogic } from '../../src/hooks/useChatRoomLogic'
import { MemoizedMessageBubble as MessageBubble } from '../../src/components/chat/MessageBubble'
import { ChatInput } from '../../src/components/chat/ChatInput'
import { ReactionPicker } from '../../src/components/chat/ReactionPicker'
import { useQueryClient } from '@tanstack/react-query'
import { ChatRoom } from '../../src/types/listing.types'
import { useChatStore } from '../../src/store/chatStore'
import { ListingBanner } from '../../src/components/chat/ListingBanner'
import { ChatSkeleton } from '../../src/components/chat/ChatSkeleton'
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner'
import { getListErrorProps } from '../../src/utils/getListErrorProps'
import * as Clipboard from 'expo-clipboard'
import { toastService, type ActionSheetOption } from '../../src/store/toastStore'
import { fromWireType, getReplyQuoteForMessage } from '../../src/utils/chatMessageType'

export function getDateLabel(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return 'اليوم'
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'أمس'
  } else {
    return d.toLocaleDateString('ar-OM-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })
  }
}

export default function ChatRoomScreen() {
  const { id, initialText, otherUserName, otherUserAvatar } = useLocalSearchParams<{ id: string; initialText?: string; otherUserName?: string; otherUserAvatar?: string }>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId)

  React.useEffect(() => {
    if (id) setActiveRoomId(id)
    return () => setActiveRoomId(null)
  }, [id, setActiveRoomId])
  
  const {
    messages, isLoading, isError, error, isRefetchError, isRefetching, refetch,
    otherUser, isOtherUserTyping, isOtherUserOnline, msgText,
    handleTextChange, handleSend, handleCancelUpload, handleRetry, handleRemoveFailedMessage, handleDeleteMessage, handleReact, activeReactMsgId,
    setActiveReactMsgId, scrollRef, user,
    replyingToMessage, setReplyingToMessage,
    fetchNextPage, hasNextPage, isFetchingNextPage
  } = useChatRoomLogic(id ?? '', initialText, otherUserName, otherUserAvatar)

  const chatRooms = queryClient.getQueryData<ChatRoom[]>(['chat-rooms'])
  const room = chatRooms?.find(r => r.id === id)
  const roomOtherParticipant = room?.participants?.find(p => p.id !== user?.id)

  const displayName =
    otherUserName ||
    otherUser?.name ||
    roomOtherParticipant?.displayName ||
    roomOtherParticipant?.username ||
    room?.listing?.title ||
    'المحادثة'

  const displayAvatar =
    otherUserAvatar ||
    otherUser?.avatar ||
    roomOtherParticipant?.avatarUrl ||
    roomOtherParticipant?.avatar ||
    undefined

  const [showReactionPicker, setShowReactionPicker] = React.useState(false)
  const [selectedMsgId, setSelectedMsgId] = React.useState<string | null>(null)

  const handleSelectMessage = React.useCallback((msgId: string) => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const isOwn = msg.senderId === user?.id

    const options: ActionSheetOption[] = [
      { text: 'رد', onPress: () => setReplyingToMessage(msg), style: 'default' },
      { text: 'إضافة تفاعل', onPress: () => { setSelectedMsgId(msgId); setShowReactionPicker(true); }, style: 'default' },
    ]

    if (fromWireType(msg.type) === 'TEXT' && msg.content) {
      options.push({
        text: 'نسخ النص',
        onPress: () => {
          void Clipboard.setStringAsync(msg.content).then(() => {
            toastService.show({ kind: 'success', title: 'تم نسخ النص' })
          })
        },
        style: 'default',
      })
    }

    if (isOwn) {
      options.push({
        text: 'حذف الرسالة',
        style: 'destructive',
        onPress: () => {
          toastService.confirm({
            title: 'حذف الرسالة',
            message: 'هل أنت متأكد من حذف هذه الرسالة؟',
            intent: 'danger',
            confirmLabel: 'حذف',
            cancelLabel: 'إلغاء',
            onConfirm: () => handleDeleteMessage(msgId),
          })
        }
      })
    }

    toastService.showActionSheet({ title: 'خيارات الرسالة', options })
  }, [messages, user, setReplyingToMessage, handleDeleteMessage])

  const handleReactFromPicker = React.useCallback((msgId: string, emoji: string) => {
    handleReact(msgId, emoji)
  }, [handleReact])

  const [isListingBannerVisible, setIsListingBannerVisible] = React.useState(true)

  const listingId = room?.listing?.id
  const listingEntityType = room?.entityType
  const handleOpenListing = React.useCallback(() => {
    if (!listingId) return
    router.push(detailRoute(listingEntityType, listingId))
  }, [listingEntityType, listingId])

  const headerActions = React.useMemo(
    () =>
      listingId
        ? [
            {
              icon: 'pricetag-outline' as const,
              onPress: handleOpenListing,
              accessibilityLabel: 'عرض الإعلان',
              testID: 'chat-room-view-listing-btn',
            },
          ]
        : [],
    [listingId, handleOpenListing]
  )

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <GlassNavBar
        title={displayName}
        paddingTop={insets.top}
        onBackPress={() => router.back()}
        buttonShape="circle"
        testID="chat-room-nav-bar"
        titleContent={
          <ChatRoomNavTitle
            displayName={displayName}
            avatarUri={displayAvatar}
            isOnline={isOtherUserOnline}
            isTyping={isOtherUserTyping}
            onPress={() => {
              if (otherUser?.id) {
                router.push({ pathname: '/profile/[userId]', params: { userId: otherUser.id } })
              }
            }}
          />
        }
        actions={headerActions}
      />
      <View style={{ height: insets.top + 53 }} />

      <ChatConnectionBanner message="لا يوجد اتصال، قد تفشل الرسائل ويمكنك إعادة المحاولة" />

      {room?.listing && isListingBannerVisible && (
        <ListingBanner
          listing={room.listing}
          onPress={() => router.push(detailRoute(room?.entityType, room.listing!.id))}
          onClose={() => setIsListingBannerVisible(false)}
        />
      )}

      {isLoading && messages.length === 0 ? (
        <ChatSkeleton />
      ) : isError && messages.length === 0 ? (
        (() => {
          const errorProps = getListErrorProps(error, 'تعذر تحميل الرسائل')
          return (
            <View style={s.emptyState} testID="chat-room-error-state">
              <View style={[s.emptyIconCircle, { backgroundColor: Colors.dangerBg }]}>
                <Ionicons
                  name={errorProps.icon as keyof typeof Ionicons.glyphMap}
                  size={40}
                  color={errorProps.iconColor}
                />
              </View>
              <Text style={s.emptyTitle}>{errorProps.title}</Text>
              <Text style={s.emptySub}>{errorProps.subtitle}</Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => refetch()}
                disabled={isRefetching}
                activeOpacity={0.8}
                testID="chat-room-retry-btn"
                accessibilityRole="button"
                accessibilityLabel={errorProps.actionLabel}
              >
                {isRefetching ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={s.retryBtnText}>{errorProps.actionLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          )
        })()
      ) : messages.length === 0 ? (
        <View style={s.emptyState} testID="chat-room-empty-state">
          <View style={s.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={34} color={Colors.primaryStrong} />
          </View>
          <Text style={s.emptyTitle}>ابدأ المحادثة</Text>
          <Text style={s.emptySub} numberOfLines={2}>
            {room?.listing?.title
              ? `استفسر عن «${room.listing.title}» أو حدّد موعداً للمعاينة.`
              : 'استفسر عن الإعلان أو حدّد موعداً للمعاينة.'}
          </Text>
          <View style={s.quickRepliesRow}>
            {[
              'هل الإعلان ما زال متاحاً؟',
              'ما أقل سعر لديكم؟',
              'هل يمكن المعاينة اليوم؟',
            ].map((chip, idx) => (
              <TouchableOpacity
                key={chip}
                style={s.quickReplyChip}
                onPress={() => handleTextChange(chip)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={chip}
                testID={`chat-quick-reply-${idx}`}
              >
                <Text style={s.quickReplyText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <>
          {(isError || isRefetchError) && messages.length > 0 ? (
            <View style={s.staleWrap} testID="chat-room-stale-banner">
              <StaleDataBanner onRetry={() => refetch()} isRefetching={isRefetching} />
            </View>
          ) : null}
          <FlashList
          ref={scrollRef}
          data={messages}
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{
            autoscrollToBottomThreshold: 0.2,
            startRenderingFromBottom: true,
          }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            setShowReactionPicker(false)
            setSelectedMsgId(null)
          }}
          onStartReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          onStartReachedThreshold={0.5}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item: msg, index }) => {
            const isOwn = msg.senderId === user?.id
            const currentDateLabel = getDateLabel(msg.createdAt)
            // Ascending order: previous message in time is index - 1
            const prevMessageTime = index > 0 ? messages[index - 1].createdAt : null
            const prevDateLabel = prevMessageTime ? getDateLabel(prevMessageTime) : null
            const showDateDivider = currentDateLabel !== prevDateLabel

            return (
              <View>
                {showDateDivider && (
                  <View style={s.dateDivider} testID="chat-date-divider">
                    <Text style={s.dateDividerTxt}>{currentDateLabel}</Text>
                  </View>
                )}
                <MessageBubble
                  msg={msg}
                  isOwn={isOwn}
                  isActiveReactMsgId={activeReactMsgId === msg.id}
                  onLongPress={handleSelectMessage}
                  onReact={handleReactFromPicker}
                  onRetry={handleRetry}
                  onRemoveFailed={handleRemoveFailedMessage}
                  onCancelUpload={handleCancelUpload}
                  onSwipeReply={(msgId) => {
                    const found = messages.find(m => m.id === msgId)
                    if (found) setReplyingToMessage(found)
                  }}
                />
              </View>
            )
          }}
        />
        </>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={s.inputContainer}>
          <ChatInput
            msgText={msgText}
            onChangeText={handleTextChange}
            onSend={handleSend}
            insetsBottom={insets.bottom}
            replyPreview={
              replyingToMessage
                ? {
                    senderLabel:
                      replyingToMessage.senderId === user?.id ? 'أنت' : displayName,
                    quoteText: getReplyQuoteForMessage(replyingToMessage),
                    onCancel: () => setReplyingToMessage(null),
                  }
                : null
            }
          />
        </View>
      </KeyboardAvoidingView>

      <ReactionPicker
        isVisible={showReactionPicker}
        selectedMsgId={selectedMsgId}
        onReact={handleReactFromPicker}
        onDismiss={() => {
          setShowReactionPicker(false)
          setSelectedMsgId(null)
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateTintBg },
  listingBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.scrimDark05,
  },
  listingThumb: { width: 44, height: 44, borderRadius: Radius.md },
  listingBannerTxt: { flex: 1, fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, textAlign: 'left' },
  content: { paddingVertical: 16 },
  loader: { marginTop: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySoft12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, lineHeight: 26, color: Colors.primaryDeep, marginBottom: 6 },
  emptySub: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: 20, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  quickRepliesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  quickReplyChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReplyText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryStrong,
  },
  dateDivider: { alignItems: 'center', marginVertical: 20 },
  dateDividerTxt: {
    backgroundColor: Colors.scrimDark05, color: Colors.textMuted,
    fontFamily: 'Almarai_700Bold',  fontSize: 11,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden',
  },
  inputContainer: {
    backgroundColor: Colors.transparent,
  },
  staleWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  retryBtn: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.white,
  },
})
