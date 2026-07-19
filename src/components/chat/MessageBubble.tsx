import React, { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { LocalMessage } from '../../hooks/useChatRoomLogic'
import { useState } from 'react'

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

function MessageStatusIcon({ pending, isRead, error }: any) {
  if (pending) {
    return <Ionicons name="ellipsis-horizontal" size={12} color={Colors.textMuted} />
  }
  
  if (error) {
    return <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
  }
  
  if (isRead) {
    return (
      <View style={{ flexDirection: 'row', marginStart: -4 }}>
        <Ionicons name="checkmark" size={14} color="#34B7F1" />
        <Ionicons name="checkmark" size={14} color="#34B7F1" style={{ marginLeft: -6 }} />
      </View>
    )
  }
  
  return <Ionicons name="checkmark" size={14} color={Colors.textMuted} />
}

interface Props {
  msg: LocalMessage & { error?: string }
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
        
        {!!msg.content && (
          <Text style={isOwn ? s.msgTxtOwn : s.msgTxtOther}>{msg.content}</Text>
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
      <View style={s.timeRow}>
        <Text style={s.msgTime}>{formatMsgTime(msg.createdAt)}</Text>
        {isOwn && <MessageStatusIcon pending={msg.pending} isRead={msg.isRead} error={msg.error} />}
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
  msgImage: { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH, borderRadius: 12, marginBottom: 4, resizeMode: 'contain' as any },
  msgImageOnly: { marginBottom: 0 },
  msgTxtOwn: { fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text, textAlign: 'right', lineHeight: 22, letterSpacing: 0.3 },
  msgTxtOther: { fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.white, textAlign: 'right', lineHeight: 22, letterSpacing: 0.3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  msgTime: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted, marginEnd: 4 },
  reactionsBadge: {
    position: 'absolute', bottom: -16, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  reactionsBadgeOwn: { left: 12 },
  reactionsBadgeOther: { right: 12 },
  reactionsBadgeTxt: { fontSize: 12, fontFamily: 'Almarai_700Bold',  color: Colors.text, lineHeight: 16 },
  fullScreenContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  closeFsBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
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

export const MemoizedMessageBubble = memo(MessageBubble, messageBubblePropsAreEqual)

