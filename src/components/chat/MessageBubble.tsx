import React, { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { LocalMessage } from '../../hooks/useChatRoomLogic'
import { useState } from 'react'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function formatMsgTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'م' : 'ص'
  return `${h % 12 || 12}:${m} ${ampm}`
}

interface Props {
  msg: LocalMessage
  isOwn: boolean
  isActiveReactMsgId: boolean
  onLongPress: (msgId: string) => void
  onReact: (msgId: string, emoji: string) => void
}

export const MessageBubble = memo(function MessageBubble({ msg, isOwn, isActiveReactMsgId, onLongPress, onReact }: Props) {
  const [fullScreenImage, setFullScreenImage] = useState(false)
  
  const isImage = msg.type === 'IMAGE' || !!msg.mediaUrl
  
  return (
    <View style={[s.msgRow, isOwn ? s.msgOwn : s.msgOther]}>
      {isActiveReactMsgId && (
        <View style={[s.reactionPicker, isOwn ? s.reactionPickerOwn : s.reactionPickerOther]}>
          {EMOJIS.map(e => (
            <TouchableOpacity key={e} onPress={() => onReact(msg.id, e)} style={s.reactionEmojiBtn}>
              <Text style={s.reactionEmojiTxt}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        onLongPress={() => onLongPress(msg.id)}
        style={[
          s.msgBubble, 
          isOwn ? s.msgBubbleOwn : s.msgBubbleOther,
          (msg.reactions && msg.reactions.length > 0) ? { marginBottom: 12 } : null
        ]}
        testID="chat_message_bubble"
      >
        {isImage && msg.mediaUrl ? (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setFullScreenImage(true)}>
            <Image 
              source={{ uri: msg.mediaUrl }} 
              style={[s.msgImage, !msg.content && s.msgImageOnly]} 
              contentFit="cover" 
              transition={200}
            />
          </TouchableOpacity>
        ) : null}
        
        {!!msg.content && (
          <Text style={isOwn ? s.msgTxtOwn : s.msgTxtOther}>{msg.content}</Text>
        )}
        
        {msg.reactions && msg.reactions.length > 0 && (
          <View style={[s.reactionsBadge, isOwn ? s.reactionsBadgeOwn : s.reactionsBadgeOther]}>
            <Text style={s.reactionsBadgeTxt}>
              {Array.from(new Set(msg.reactions.map(r => r.emoji))).join('')}
              {msg.reactions.length > 1 ? ` ${msg.reactions.length}` : ''}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={s.timeRow}>
        <Text style={s.msgTime}>{formatMsgTime(msg.createdAt)}</Text>
        {isOwn && (
          <Ionicons
            name={msg.pending ? 'time-outline' : msg.isRead ? 'checkmark-done' : 'checkmark'}
            size={14}
            color={msg.pending ? Colors.textMuted : msg.isRead ? '#34B7F1' : Colors.textMuted}
            style={{ marginStart: 2 }}
          />
        )}
      </View>

      <Modal visible={fullScreenImage} transparent={true} animationType="fade" onRequestClose={() => setFullScreenImage(false)}>
        <View style={s.fullScreenContainer}>
          <TouchableOpacity style={s.closeFsBtn} onPress={() => setFullScreenImage(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {msg.mediaUrl && (
            <Image 
              source={{ uri: msg.mediaUrl }} 
              style={s.fullScreenImage} 
              contentFit="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  )
})

const s = StyleSheet.create({
  msgRow: { marginVertical: 4, paddingHorizontal: 16, position: 'relative' },
  msgOwn: { alignItems: 'flex-start' },
  msgOther: { alignItems: 'flex-end' },
  msgBubble: {
    maxWidth: '80%', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  msgBubbleOwn: { backgroundColor: Colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: Colors.primary, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 },
  msgImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  msgImageOnly: { marginBottom: 0 },
  msgTxtOwn: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text, textAlign: 'right' },
  msgTxtOther: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.white, textAlign: 'right' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  msgTime: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11, color: Colors.textMuted },
  reactionPicker: {
    position: 'absolute', top: -45, flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 20, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, zIndex: 10,
  },
  reactionPickerOwn: { left: 16 },
  reactionPickerOther: { right: 16 },
  reactionEmojiBtn: { padding: 6 },
  reactionEmojiTxt: { fontSize: 22 },
  reactionsBadge: {
    position: 'absolute', bottom: -12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  reactionsBadgeOwn: { left: 12 },
  reactionsBadgeOther: { right: 12 },
  reactionsBadgeTxt: { fontSize: 12, fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.text },
  fullScreenContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  closeFsBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
})

// Custom comparison function for React.memo to prevent re-rendering when other state changes
// We only re-render if the message itself changed (id, content, reactions, read status) or its active state changed
export const messageBubblePropsAreEqual = (prev: Props, next: Props) => {
  if (prev.isActiveReactMsgId !== next.isActiveReactMsgId) return false
  if (prev.isOwn !== next.isOwn) return false
  
  // Shallow compare the message object properties that matter
  const pMsg = prev.msg
  const nMsg = next.msg
  
  if (pMsg.id !== nMsg.id) return false
  if (pMsg.content !== nMsg.content) return false
  if (pMsg.isRead !== nMsg.isRead) return false
  if (pMsg.pending !== nMsg.pending) return false
  if (pMsg.mediaUrl !== nMsg.mediaUrl) return false
  if (pMsg.reactions?.length !== nMsg.reactions?.length) return false
  
  // If lengths are same, check inner reactions (simple stringification for fast compare, or deep check)
  if (pMsg.reactions && nMsg.reactions) {
    for (let i = 0; i < pMsg.reactions.length; i++) {
      if (pMsg.reactions[i].emoji !== nMsg.reactions[i].emoji) return false
      if (pMsg.reactions[i].userId !== nMsg.reactions[i].userId) return false
    }
  }
  
  return true
}

// Export the memoized component with the custom comparison
export const MemoizedMessageBubble = memo(MessageBubble, messageBubblePropsAreEqual)

