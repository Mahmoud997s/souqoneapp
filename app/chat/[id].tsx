import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { useChatRoomLogic } from '../../src/hooks/useChatRoomLogic'
import { MemoizedMessageBubble as MessageBubble } from '../../src/components/chat/MessageBubble'
import { ChatInput } from '../../src/components/chat/ChatInput'
import { ReactionPicker } from '../../src/components/chat/ReactionPicker'
import { useQueryClient } from '@tanstack/react-query'
import { ChatRoom } from '../../src/types/listing.types'
import { useChatStore } from '../../src/store/chatStore'
import { NegotiationBanner } from '../../src/components/chat/NegotiationBanner'
import { NegotiationBottomSheet } from '../../src/components/chat/NegotiationBottomSheet'
import BottomSheet from '@gorhom/bottom-sheet'

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
    messages, isLoading, otherUser, isOtherUserTyping, msgText,
    handleTextChange, handleSend, handleReact, activeReactMsgId,
    setActiveReactMsgId, scrollRef, user,
    fetchNextPage, hasNextPage, isFetchingNextPage
  } = useChatRoomLogic(id ?? '', initialText, otherUserName, otherUserAvatar)

  const chatRooms = queryClient.getQueryData<ChatRoom[]>(['chat-rooms'])
  const room = chatRooms?.find(r => r.id === id)
  const displayName = otherUser?.name ?? 'المحادثة'

  const reversedMessages = React.useMemo(
    () => [...messages].reverse(),
    [messages]
  )

  const [showReactionPicker, setShowReactionPicker] = React.useState(false)
  const [selectedMsgId, setSelectedMsgId] = React.useState<string | null>(null)

  const handleSelectMessage = React.useCallback((msgId: string) => {
    setSelectedMsgId(msgId)
    setShowReactionPicker(true)
  }, [])

  const handleReactFromPicker = React.useCallback((msgId: string, emoji: string) => {
    handleReact(msgId, emoji)
  }, [handleReact])

  const negoSheetRef = React.useRef<any>(null)
  
  // Dummy negotiation state for demo (until backend supports offers in mobile)
  const dummyOffer = room?.listing ? { price: (room.listing as any).price ? (room.listing as any).price * 0.9 : 100, isCounter: false } : null

  return (
    <View style={s.root}>
      <AppHeader
        showBack

        centerSlot={
          <View style={s.headerCenter}>
            <View style={s.avatarWrap}>
              {otherUser?.avatar ? (
                <Image source={{ uri: otherUser.avatar }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarLetter}>{displayName.charAt(0)}</Text>
                </View>
              )}
              <View style={s.onlineBadge} />
            </View>
            <View style={s.headerTitleWrap}>
              <Text style={s.headerTitle} numberOfLines={1}>{displayName}</Text>
              {isOtherUserTyping && (
                <Text style={s.typingTxt}>يكتب الآن...</Text>
              )}
            </View>
          </View>
        }
        rightIcon="ellipsis-vertical"
      />

      {room?.listing && (
        <TouchableOpacity 
          style={s.listingBanner}
          onPress={() => router.push(`/listings/${room.listing!.id}` as any)}
          activeOpacity={0.8}
        >
          {room.listing.images?.[0]?.url ? (
            <Image source={{ uri: room.listing.images[0].url }} style={s.listingThumb} />
          ) : (
            <View style={[s.listingThumb, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="car" size={16} color={Colors.textMuted} />
            </View>
          )}
          <Text style={s.listingBannerTxt} numberOfLines={1}>{room.listing.title}</Text>
          <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {dummyOffer && room?.listing && (
        <NegotiationBanner 
          offerPrice={dummyOffer.price}
          isCounter={dummyOffer.isCounter}
          onOpenNego={() => negoSheetRef.current?.expand()}
        />
      )}

      {isLoading && messages.length === 0 ? (
        <ActivityIndicator color={Colors.primary} style={s.loader} />
      ) : messages.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>لا توجد رسائل</Text>
          <Text style={s.emptySub}>ابدأ المحادثة الآن بكلمة طيبة!</Text>
        </View>
      ) : (
        <FlatList
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
          maxToRenderPerBatch={20}
          windowSize={10}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item: msg, index }) => {
            const isOwn = msg.senderId === user?.id
            const currentDateLabel = getDateLabel(msg.createdAt)
            // Since it's inverted, the "previous" message in time is the NEXT item in the reversed array
            const prevMessageTime = index < reversedMessages.length - 1 ? reversedMessages[index + 1].createdAt : null
            const prevDateLabel = prevMessageTime ? getDateLabel(prevMessageTime) : null
            const showDateDivider = currentDateLabel !== prevDateLabel

            return (
              <React.Fragment>
                <MessageBubble
                  msg={msg}
                  isOwn={isOwn}
                  isActiveReactMsgId={activeReactMsgId === msg.id}
                  onLongPress={handleSelectMessage}
                  onReact={handleReactFromPicker}
                />
                {showDateDivider && (
                  <View style={s.dateDivider}>
                    <Text style={s.dateDividerTxt}>{currentDateLabel}</Text>
                  </View>
                )}
              </React.Fragment>
            )
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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

      {dummyOffer && room?.listing && (
        <NegotiationBottomSheet 
          sheetRef={negoSheetRef}
          offerPrice={dummyOffer.price}
          listingPrice={(room.listing as any).price || 0}
          isCounter={dummyOffer.isCounter}
          onAccept={() => {
            negoSheetRef.current?.close()
            handleSend(`تم قبول العرض بسعر ${dummyOffer.price} ر.ع`)
          }}
          onCounterOffer={() => {
            negoSheetRef.current?.close()
            handleSend(`أقدم لك عرض مضاد...`)
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space3, flex: 1, justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'flex-start', justifyContent: 'center', flex: 1 },
  headerTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 16, color: Colors.white, maxWidth: 180, textAlign: 'left' },
  typingTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: '#4ADE80' },
  avatarWrap: { position: 'relative', width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.white },
  onlineBadge: { 
    position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, 
    borderRadius: 6, backgroundColor: '#4ADE80', 
    borderWidth: 2, borderColor: Colors.primary 
  },
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
  inputContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
})
