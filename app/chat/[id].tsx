import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { ChatRoomHeader } from '../../src/components/chat/ChatRoomHeader'
import { useChatRoomLogic } from '../../src/hooks/useChatRoomLogic'
import { MemoizedMessageBubble as MessageBubble } from '../../src/components/chat/MessageBubble'
import { ChatInput } from '../../src/components/chat/ChatInput'
import { ReactionPicker } from '../../src/components/chat/ReactionPicker'
import { useQueryClient } from '@tanstack/react-query'
import { ChatRoom } from '../../src/types/listing.types'
import { useChatStore } from '../../src/store/chatStore'
import { ListingBanner } from '../../src/components/chat/ListingBanner'
import { ChatSkeleton } from '../../src/components/chat/ChatSkeleton'
import * as Clipboard from 'expo-clipboard'
import { dialogService } from '../../src/store/dialogStore'

function getDateLabel(iso: string) {
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
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
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
    messages, isLoading, otherUser, isOtherUserTyping, isOtherUserOnline, msgText,
    handleTextChange, handleSend, handleRetry, handleRemoveFailedMessage, handleDeleteMessage, handleReact, activeReactMsgId,
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

  const reversedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages]
  )

  const [showReactionPicker, setShowReactionPicker] = React.useState(false)
  const [selectedMsgId, setSelectedMsgId] = React.useState<string | null>(null)

  const handleSelectMessage = React.useCallback((msgId: string) => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const isOwn = msg.senderId === user?.id

    const options: import('../../src/components/ui/AppDialog').DialogOption[] = [
      { text: '💬 رد', onPress: () => setReplyingToMessage(msg), style: 'default' },
      { text: '😂 إضافة تفاعل', onPress: () => { setSelectedMsgId(msgId); setShowReactionPicker(true); }, style: 'default' },
    ]

    if (msg.type === 'TEXT' && msg.content) {
      options.push({ text: '📋 نسخ النص', onPress: () => Clipboard.setStringAsync(msg.content), style: 'default' })
    }

    if (isOwn) {
      options.push({
        text: '🗑️ حذف الرسالة',
        style: 'destructive',
        onPress: () => {
          dialogService.confirm('حذف الرسالة', 'هل أنت متأكد من حذف هذه الرسالة؟', () => handleDeleteMessage(msgId), 'حذف', 'إلغاء')
        }
      })
    }

    dialogService.showOptions('خيارات الرسالة', options)
  }, [messages, user, setReplyingToMessage, handleDeleteMessage])

  const handleReactFromPicker = React.useCallback((msgId: string, emoji: string) => {
    handleReact(msgId, emoji)
  }, [handleReact])

  const [isListingBannerVisible, setIsListingBannerVisible] = React.useState(true)

  const handleRoomOptions = React.useCallback(() => {
    const options: import('../../src/components/ui/AppDialog').DialogOption[] = []

    if (room?.listing) {
      options.push({
        text: '🏷️ عرض الإعلان',
        onPress: () => router.push(`/listings/${room.listing!.id}` as any),
        style: 'default',
      })
    }

    options.push(
      {
        text: '🔔 كتم الإشعارات',
        onPress: () => {
          dialogService.alert('تم', 'تم كتم إشعارات المحادثة')
        },
        style: 'default',
      },
      {
        text: '🚩 إبلاغ عن مستخدم',
        onPress: () => {
          dialogService.alert('شكراً لك', 'تم إرسال البلاغ للإدارة للمراجعة')
        },
        style: 'default',
      },
      {
        text: '🚫 حظر المستخدم',
        onPress: () => {
          dialogService.confirm(
            'حظر المستخدم',
            'هل أنت متأكد من حظر هذا المستخدم؟',
            () => {
              dialogService.alert('تم', 'تم حظر المستخدم')
            },
            'حظر',
            'إلغاء'
          )
        },
      }
    )

    dialogService.showOptions('خيارات المحادثة', options)
  }, [room?.listing])

  return (
    <View style={s.root}>
      <ChatRoomHeader
        displayName={displayName}
        avatarUri={displayAvatar}
        isOnline={isOtherUserOnline}
        isTyping={isOtherUserTyping}
        onBackPress={() => router.back()}
        onProfilePress={() => {
          if (otherUser?.id) {
            router.push(`/user/${otherUser.id}` as any)
          }
        }}
        onOptionsPress={handleRoomOptions}
      />

      {room?.listing && isListingBannerVisible && (
        <ListingBanner
          listing={room.listing}
          onPress={() => router.push(`/listings/${room.listing!.id}` as any)}
          onClose={() => setIsListingBannerVisible(false)}
        />
      )}

      {isLoading && messages.length === 0 ? (
        <ChatSkeleton />
      ) : messages.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>لا توجد رسائل</Text>
          <Text style={s.emptySub}>ابدأ المحادثة الآن بكلمة طيبة!</Text>
        </View>
      ) : (
        <FlashList
          ref={scrollRef as any}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            setShowReactionPicker(false)
            setSelectedMsgId(null)
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          onEndReachedThreshold={0.5}
          // @ts-ignore
          estimatedItemSize={100}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item: msg, index }) => {
            const isOwn = msg.senderId === user?.id
            const currentDateLabel = getDateLabel(msg.createdAt)
            // Since it's inverted, the "previous" message in time is the NEXT item in the reversed array
            const prevMessageTime = index < reversedMessages.length - 1 ? reversedMessages[index + 1].createdAt : null
            const prevDateLabel = prevMessageTime ? getDateLabel(prevMessageTime) : null
            const showDateDivider = currentDateLabel !== prevDateLabel

            return (
              <View>
                <MessageBubble
                  msg={msg}
                  isOwn={isOwn}
                  isActiveReactMsgId={activeReactMsgId === msg.id}
                  onLongPress={handleSelectMessage}
                  onReact={handleReactFromPicker}
                  onRetry={handleRetry}
                  onRemoveFailed={handleRemoveFailedMessage}
                  onSwipeReply={(msgId) => {
                    const found = messages.find(m => m.id === msgId)
                    if (found) setReplyingToMessage(found)
                  }}
                />
                {showDateDivider && (
                  <View style={s.dateDivider}>
                    <Text style={s.dateDividerTxt}>{currentDateLabel}</Text>
                  </View>
                )}
              </View>
            )
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {replyingToMessage && (
          <View style={s.replyPreviewContainer}>
            <View style={s.replyPreviewLine} />
            <View style={s.replyPreviewContent}>
              <Text style={s.replyPreviewTitle}>
                الرد على {replyingToMessage.senderId === user?.id ? 'نفسك' : displayName}
              </Text>
              <Text style={s.replyPreviewText} numberOfLines={1}>
                {replyingToMessage.type === 'IMAGE' ? '📷 صورة' : replyingToMessage.type === 'VOICE' ? '🎤 رسالة صوتية' : replyingToMessage.content}
              </Text>
            </View>
            <TouchableOpacity style={s.replyPreviewClose} onPress={() => setReplyingToMessage(null)}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={s.inputContainer}>
          <ChatInput
            msgText={msgText}
            onChangeText={handleTextChange}
            onSend={handleSend}
            insetsBottom={insets.bottom}
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
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  listingBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listingThumb: { width: 44, height: 44, borderRadius: Radius.md },
  listingBannerTxt: { flex: 1, fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, textAlign: 'left' },
  content: { paddingVertical: 16 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 120, paddingHorizontal: 40 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(52, 183, 241, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  dateDivider: { alignItems: 'center', marginVertical: 20 },
  dateDividerTxt: {
    backgroundColor: 'rgba(0,0,0,0.05)', color: Colors.textMuted,
    fontFamily: 'Almarai_700Bold',  fontSize: 11,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden',
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 10,
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyPreviewLine: {
    width: 4,
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
  },
  replyPreviewText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  replyPreviewClose: {
    padding: 4,
  },
  inputContainer: {
    backgroundColor: Colors.white,
    paddingTop: 4,
  },
})
