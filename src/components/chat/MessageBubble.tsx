import React, { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { LocalMessage } from '../../hooks/useChatRoomLogic'
import { AttachmentCard } from './AttachmentCard'
import { AudioPlayer } from './AudioPlayer'
import { dialogService } from '../../store/dialogStore'
import { Swipeable } from 'react-native-gesture-handler'

const screenWidth = Dimensions.get('window').width
const MAX_IMAGE_WIDTH = screenWidth * 0.7 - 32

function formatMsgTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'م' : 'ص'
  return `${h % 12 || 12}:${m} ${ampm}`
}

function MessageStatusIcon({ pending, isRead, isDelivered, error }: { pending?: boolean; isRead?: boolean; isDelivered?: boolean; error?: boolean }) {
  if (pending) {
    return <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
  }
  
  if (error) {
    return <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
  }
  
  if (isRead) {
    return (
      <View style={{ flexDirection: 'row', marginStart: -4, alignItems: 'center' }}>
        <Ionicons name="checkmark" size={13} color="#34B7F1" />
        <Ionicons name="checkmark" size={13} color="#34B7F1" style={{ marginLeft: -6 }} />
      </View>
    )
  }

  if (isDelivered) {
    return (
      <View style={{ flexDirection: 'row', marginStart: -4, alignItems: 'center' }}>
        <Ionicons name="checkmark" size={13} color={Colors.textMuted} />
        <Ionicons name="checkmark" size={13} color={Colors.textMuted} style={{ marginLeft: -6 }} />
      </View>
    )
  }
  
  return <Ionicons name="checkmark" size={13} color={Colors.textMuted} />
}

interface Props {
  msg: LocalMessage
  isOwn: boolean
  isActiveReactMsgId: boolean
  onLongPress: (msgId: string) => void
  onReact?: (msgId: string, emoji: string) => void
  onRetry?: (msgId: string) => void
  onRemoveFailed?: (msgId: string) => void
  onSwipeReply?: (msgId: string) => void
}

const parseMessageText = (content: string) => {
  if (!content) return { isReply: false, text: '' }
  const match = content.match(/^\[REPLY\|([^\|]+)\|([^\|]+)\|(.*?)\]\n([\s\S]*)$/)
  if (match) {
    return {
      isReply: true,
      replyId: match[1],
      replySender: match[2],
      replyText: match[3],
      text: match[4]
    }
  }
  return { isReply: false, text: content }
}

export function MessageBubble({ msg, isOwn, isActiveReactMsgId, onLongPress, onReact, onRetry, onRemoveFailed, onSwipeReply }: Props) {
  const [fullScreenImage, setFullScreenImage] = useState(false)
  const swipeableRef = useRef<Swipeable>(null)
  
  const isImage = msg.type === 'IMAGE' || (msg.mediaUrl && !msg.type)
  const isFile = msg.type === 'FILE'
  const isVoice = msg.type === 'VOICE'
  const parsed = parseMessageText(msg.content)
  
  const handleFailedMessagePress = () => {
    dialogService.showOptions(
      'لم يتم إرسال الرسالة',
      [
        {
          text: '🔄 إعادة الإرسال',
          onPress: () => onRetry?.(msg.id),
          style: 'default',
        },
        {
          text: '🗑️ حذف الرسالة',
          onPress: () => onRemoveFailed?.(msg.id),
          style: 'destructive',
        },
      ]
    )
  }

  const renderLeftActions = () => {
    return (
      <View style={s.swipeActionContainer}>
        <View style={s.swipeActionIcon}>
          <Ionicons name="arrow-undo" size={20} color={Colors.white} style={{ transform: [{ scaleX: -1 }] }} />
        </View>
      </View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      friction={2}
      leftThreshold={40}
      onSwipeableOpen={() => {
        onSwipeReply?.(msg.id)
        setTimeout(() => swipeableRef.current?.close(), 0)
      }}
    >
      <View style={[s.msgRow, isOwn ? s.msgOwn : s.msgOther]}>
        <View style={s.bubbleContainer}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onLongPress={() => onLongPress(msg.id)}
          onPress={msg.error && isOwn ? handleFailedMessagePress : undefined}
          style={[
            s.msgBubble, 
            isOwn ? s.msgBubbleOwn : s.msgBubbleOther,
            msg.error ? s.msgBubbleError : null,
            (parsed.isReply || isFile || isVoice) ? s.msgBubbleExtended : null,
            (msg.reactions && msg.reactions.length > 0) ? { marginBottom: 12 } : null
          ]}
          testID="chat_message_bubble"
        >
          {isImage && msg.mediaUrl ? (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setFullScreenImage(true)}
              accessibilityLabel={`Image: ${msg.content || 'No caption'}`}
            >
              <Image 
                source={{ uri: msg.mediaUrl }} 
                style={[s.msgImage, !msg.content && s.msgImageOnly]} 
                contentFit="cover" 
                transition={200}
              />
            </TouchableOpacity>
          ) : null}

          {isFile && msg.mediaUrl ? (
            <View style={{ marginBottom: msg.content ? 8 : 0 }}>
              <AttachmentCard 
                url={msg.mediaUrl}
                fileName={msg.content || 'ملف مرفق'}
                isOwn={isOwn}
              />
            </View>
          ) : null}

          {isVoice && msg.mediaUrl ? (
            <View style={{ marginBottom: parsed.text ? 8 : 0 }}>
              <AudioPlayer 
                uri={msg.mediaUrl}
                isOwn={isOwn}
              />
            </View>
          ) : null}

          {parsed.isReply && (
            <View style={[s.replyBox, isOwn ? s.replyBoxOwn : s.replyBoxOther]}>
              <View style={[s.replyLine, isOwn ? s.replyLineOwn : s.replyLineOther]} />
              <View style={s.replyContent}>
                <Text style={[s.replySender, isOwn ? s.replySenderOwn : s.replySenderOther]}>{parsed.replySender}</Text>
                <Text 
                  style={[s.replySnippet, isOwn ? s.replySnippetOwn : s.replySnippetOther]} 
                  numberOfLines={2}
                >
                  {parsed.replyText}
                </Text>
              </View>
            </View>
          )}
          
          {!!parsed.text && !isFile && (
            <Text style={isOwn ? s.msgTxtOwn : s.msgTxtOther}>{parsed.text}</Text>
          )}
          
          {msg.reactions && msg.reactions.length > 0 && (
            <View style={[
              s.reactionsBadge, 
              isOwn ? s.reactionsBadgeOwn : s.reactionsBadgeOther,
              { maxWidth: 160 }
            ]}>
              <Text 
                style={s.reactionsBadgeTxt}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {Array.from(new Set(msg.reactions.map(r => r.emoji))).join(' ')}
                {msg.reactions.length > 1 ? ` (${msg.reactions.length})` : ''}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {isOwn && msg.error && (
          <TouchableOpacity 
            style={s.errorIconBtn} 
            onPress={handleFailedMessagePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="فشل الإرسال — اضغط للخيارات"
          >
            <Ionicons name="alert-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      <View style={s.timeRow}>
        <Text style={s.msgTime}>{formatMsgTime(msg.createdAt)}</Text>
        {isOwn && <MessageStatusIcon pending={msg.pending} isRead={msg.isRead} isDelivered={msg.isDelivered} error={msg.error} />}
      </View>

      <Modal visible={fullScreenImage} transparent={true} animationType="fade" onRequestClose={() => setFullScreenImage(false)}>
        <View style={s.fullScreenContainer}>
          <TouchableOpacity 
            style={s.closeFsBtn} 
            onPress={() => setFullScreenImage(false)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="إغلاق الصورة"
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {msg.mediaUrl && (
            <ScrollView
              style={s.zoomScroll}
              contentContainerStyle={s.zoomScrollContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent
            >
              <Image 
                source={{ uri: msg.mediaUrl }} 
                style={s.fullScreenImage} 
                contentFit="contain" 
              />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
    </Swipeable>
  )
}

const s = StyleSheet.create({
  msgRow: { marginVertical: 6, paddingHorizontal: 16, position: 'relative' },
  msgOwn: { alignItems: 'flex-end' },
  msgOther: { alignItems: 'flex-start' },
  bubbleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '82%' },
  errorIconBtn: { padding: 2 },
  msgBubble: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, flexShrink: 1,
    minWidth: 64,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  msgBubbleExtended: {
    minWidth: 190,
  },
  msgBubbleError: { opacity: 0.85, borderWidth: 1, borderColor: '#FCA5A5' },
  // borderBottomRightRadius maps to physical LEFT in RTL. Tail for own message points left.
  msgBubbleOwn: { backgroundColor: Colors.primary, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
  // borderBottomLeftRadius maps to physical RIGHT in RTL. Tail for other message points right.
  msgBubbleOther: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  msgImage: { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH, borderRadius: 12, marginBottom: 6, resizeMode: 'contain' as any },
  msgImageOnly: { marginBottom: 0 },
  msgTxtOwn: { fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.white, textAlign: 'left', lineHeight: 24, letterSpacing: 0.2 },
  msgTxtOther: { fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text, textAlign: 'left', lineHeight: 24, letterSpacing: 0.2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, opacity: 0.8 },
  msgTime: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted, marginEnd: 4 },
  reactionsBadge: {
    position: 'absolute', bottom: -16, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)'
  },
  reactionsBadgeOwn: { left: 16 },
  reactionsBadgeOther: { right: 16 },
  reactionsBadgeTxt: { fontSize: 13, fontFamily: 'Almarai_700Bold',  color: Colors.text, lineHeight: 18 },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  zoomScroll: { flex: 1, width: '100%' },
  zoomScrollContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  closeFsBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  swipeActionIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  replyBox: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
    minWidth: 170,
    width: '100%',
  },
  replyBoxOwn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  replyBoxOther: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  replyLine: {
    width: 3.5,
    height: '100%',
  },
  replyLineOwn: {
    backgroundColor: Colors.white,
  },
  replyLineOther: {
    backgroundColor: Colors.primary,
  },
  replyContent: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    flex: 1,
  },
  replySender: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    marginBottom: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  replySenderOwn: {
    color: Colors.white,
  },
  replySenderOther: {
    color: Colors.primary,
  },
  replySnippet: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  replySnippetOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  replySnippetOther: {
    color: 'rgba(0,0,0,0.6)',
  },
})

export const messageBubblePropsAreEqual = (prev: Props, next: Props) => {
  if (prev.isActiveReactMsgId !== next.isActiveReactMsgId) return false
  if (prev.isOwn !== next.isOwn) return false
  
  const pMsg = prev.msg
  const nMsg = next.msg
  
  if (pMsg.id !== nMsg.id) return false
  if (pMsg.content !== nMsg.content) return false
  if (pMsg.isRead !== nMsg.isRead) return false
  if (pMsg.pending !== nMsg.pending) return false
  if (pMsg.error !== nMsg.error) return false
  if (pMsg.type !== nMsg.type) return false
  if (pMsg.mediaUrl !== nMsg.mediaUrl) return false
  if (pMsg.reactions?.length !== nMsg.reactions?.length) return false
  
  if (pMsg.reactions && nMsg.reactions) {
    for (let i = 0; i < pMsg.reactions.length; i++) {
      if (pMsg.reactions[i].emoji !== nMsg.reactions[i].emoji) return false
      if (pMsg.reactions[i].userId !== nMsg.reactions[i].userId) return false
    }
  }
  
  return true
}

export const MemoizedMessageBubble = React.memo(MessageBubble, messageBubblePropsAreEqual)

