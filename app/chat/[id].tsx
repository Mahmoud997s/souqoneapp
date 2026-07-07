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
import { useQueryClient } from '@tanstack/react-query'
import { ChatRoom } from '../../src/types/listing.types'
import { useChatStore } from '../../src/store/chatStore'

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

  return (
    <KeyboardAvoidingView 
      style={s.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
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
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setActiveReactMsgId(null)}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item: msg, index }) => {
            const reversed = [...messages].reverse()
            const isOwn = msg.senderId === user?.id
            const currentDateLabel = getDateLabel(msg.createdAt)
            // Since it's inverted, the "previous" message in time is the NEXT item in the reversed array
            const prevMessageTime = index < reversed.length - 1 ? reversed[index + 1].createdAt : null
            const prevDateLabel = prevMessageTime ? getDateLabel(prevMessageTime) : null
            const showDateDivider = currentDateLabel !== prevDateLabel

            return (
              <React.Fragment>
                <MessageBubble
                  msg={msg}
                  isOwn={isOwn}
                  isActiveReactMsgId={activeReactMsgId === msg.id}
                  onLongPress={setActiveReactMsgId}
                  onReact={handleReact}
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

      <ChatInput
        msgText={msgText}
        onChangeText={handleTextChange}
        onSend={handleSend}
        insetsBottom={insets.bottom}
      />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space3, flex: 1, justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.white, maxWidth: 180 },
  typingTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 2, paddingBottom: 2, includeFontPadding: false, fontSize: 11, color: '#4ADE80' },
  avatarWrap: { position: 'relative', width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.white },
  onlineBadge: { 
    position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, 
    borderRadius: 6, backgroundColor: '#4ADE80', 
    borderWidth: 2, borderColor: Colors.primary 
  },
  listingBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listingThumb: { width: 40, height: 40, borderRadius: Radius.md, marginLeft: 12 },
  listingBannerTxt: { flex: 1, fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, textAlign: 'right', marginLeft: 8 },
  content: { paddingVertical: 16 },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(28,50,91,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.text, marginBottom: 8 },
  emptySub: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  dateDivider: { alignItems: 'center', marginVertical: 16 },
  dateDividerTxt: {
    backgroundColor: 'rgba(0,0,0,0.05)', color: Colors.textMuted,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden',
  },
})
