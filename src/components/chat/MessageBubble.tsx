import React, { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ScrollView, ImageResizeMode } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Swipeable } from 'react-native-gesture-handler'
import { Colors } from '../../constants/colors'
import { LocalMessage } from '../../hooks/useChatRoomLogic'
import { fromWireType } from '../../utils/chatMessageType'
import { AttachmentCard } from './AttachmentCard'
import { AudioPlayer } from './AudioPlayer'
import { ModalToastHost } from '../ui/ModalToastHost'

function formatMsgTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'م' : 'ص'
  return `${h % 12 || 12}:${m} ${ampm}`
}

function MessageStatusIcon({
  pending,
  isRead,
  isDelivered,
  error,
  lightOnDark,
}: {
  pending?: boolean
  isRead?: boolean
  isDelivered?: boolean
  error?: boolean
  lightOnDark?: boolean
}) {
  if (pending) {
    return (
      <Ionicons
        name="time-outline"
        size={13}
        color={lightOnDark ? Colors.white : Colors.textMuted}
        testID="chat-message-pending-icon"
      />
    )
  }

  if (error) {
    return null
  }

  const mutedColor = lightOnDark ? Colors.white : Colors.textMuted
  const readColor = lightOnDark ? Colors.white : Colors.readReceiptBlue

  if (isRead) {
    return (
      <View style={s.doubleTickRow}>
        <Ionicons name="checkmark" size={13} color={readColor} />
        <Ionicons name="checkmark" size={13} color={readColor} style={{ marginStart: -6 }} />
      </View>
    )
  }

  if (isDelivered) {
    return (
      <View style={s.doubleTickRow}>
        <Ionicons name="checkmark" size={13} color={mutedColor} />
        <Ionicons name="checkmark" size={13} color={mutedColor} style={{ marginStart: -6 }} />
      </View>
    )
  }

  return <Ionicons name="checkmark" size={13} color={mutedColor} />
}

interface Props {
  msg: LocalMessage
  isOwn: boolean
  isActiveReactMsgId: boolean
  onLongPress: (msgId: string) => void
  onReact?: (msgId: string, emoji: string) => void
  onRetry?: (msgId: string) => void
  onRemoveFailed?: (msgId: string) => void
  onCancelUpload?: (msgId: string) => void
  onSwipeReply?: (msgId: string) => void
}

export const parseMessageText = (content: string) => {
  if (!content) return { isReply: false, text: '' }
  const match = content.match(/^\[REPLY\|([^\|]+)\|([^\|]+)\|(.*?)\]\n([\s\S]*)$/)
  if (match) {
    return {
      isReply: true,
      replyId: match[1],
      replySender: match[2],
      replyText: match[3],
      text: match[4],
    }
  }
  return { isReply: false, text: content }
}

export function MessageBubble({
  msg,
  isOwn,
  onLongPress,
  onRetry,
  onRemoveFailed,
  onCancelUpload,
  onSwipeReply,
}: Props) {
  const [fullScreenImage, setFullScreenImage] = useState(false)
  const swipeableRef = useRef<Swipeable>(null)
  const insets = useSafeAreaInsets()
  const maxImageWidth = Math.round(Dimensions.get('window').width * 0.72)

  const localType = msg.type ? fromWireType(msg.type) : msg.mediaUrl ? 'IMAGE' : 'TEXT'
  const isImage = localType === 'IMAGE'
  const isFile = localType === 'FILE'
  const isVoice = localType === 'VOICE'
  const parsed = parseMessageText(msg.content)
  const isImageOnly = isImage && !!msg.mediaUrl && !parsed.text && !parsed.isReply
  const isUploading = !!msg.pending && (isImage || isFile || isVoice) && typeof msg.uploadProgress === 'number'
  const hasReactions = !!(msg.reactions && msg.reactions.length > 0)

  const renderLeftActions = () => (
    <View style={s.swipeActionContainer}>
      <View style={s.swipeActionIcon}>
        <Ionicons name="arrow-undo" size={16} color={Colors.white} style={{ transform: [{ scaleX: -1 }] }} />
      </View>
    </View>
  )

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      friction={2}
      leftThreshold={40}
      enabled={!msg.pendingDelete && !msg.error}
      onSwipeableWillOpen={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }}
      onSwipeableOpen={() => {
        onSwipeReply?.(msg.id)
        setTimeout(() => swipeableRef.current?.close(), 0)
      }}
    >
      <View
        style={[
          s.msgRow,
          isOwn ? s.msgOwn : s.msgOther,
          hasReactions ? s.msgRowWithReactions : null,
        ]}
      >
        <View style={s.bubbleContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={msg.pendingDelete ? undefined : () => onLongPress(msg.id)}
            onPress={msg.pendingDelete ? undefined : msg.error && isOwn ? () => onRetry?.(msg.id) : undefined}
            disabled={msg.pendingDelete}
            style={[
              s.msgBubble,
              isOwn ? s.msgBubbleOwn : s.msgBubbleOther,
              msg.error ? s.msgBubbleError : null,
              msg.pendingDelete ? s.msgBubblePendingDelete : null,
              isImageOnly ? s.msgBubbleImageOnly : null,
              (parsed.isReply || isFile || isVoice) && !isImageOnly ? s.msgBubbleExtended : null,
            ]}
            testID={msg.pendingDelete ? 'chat-message-pending-delete' : 'chat_message_bubble'}
          >
            {isImage && msg.mediaUrl ? (
              <View style={isImageOnly ? s.imageOnlyWrap : s.imageWithCaptionWrap}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={msg.pendingDelete || isUploading ? undefined : () => setFullScreenImage(true)}
                  disabled={msg.pendingDelete || isUploading}
                  accessibilityLabel={`Image: ${msg.content || 'No caption'}`}
                  testID="chat-image-tap"
                >
                  <Image
                    source={{ uri: msg.mediaUrl }}
                    style={[
                      s.msgImage,
                      { width: maxImageWidth, height: maxImageWidth },
                      isImageOnly ? s.msgImageOnly : null,
                    ]}
                    contentFit="cover"
                    transition={200}
                  />
                </TouchableOpacity>

                {isUploading ? (
                  <View style={s.uploadOverlay} testID="chat-upload-progress-overlay">
                    <Text style={s.uploadPct}>{`${msg.uploadProgress}%`}</Text>
                    <View style={s.uploadTrack}>
                      <View
                        style={[
                          s.uploadFill,
                          { width: `${Math.max(5, Math.min(100, msg.uploadProgress ?? 0))}%` },
                        ]}
                      />
                    </View>
                    {onCancelUpload ? (
                      <TouchableOpacity
                        onPress={() => onCancelUpload(msg.id)}
                        style={s.uploadCancelBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityRole="button"
                        accessibilityLabel="إلغاء الرفع"
                        testID="chat-upload-cancel-btn"
                      >
                        <Ionicons name="close" size={18} color={Colors.white} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                {isImageOnly ? (
                  <View style={s.imageOnlyTimePill} testID="chat-image-only-time-pill">
                    <Text style={s.imageOnlyTimeText}>{formatMsgTime(msg.createdAt)}</Text>
                    {isOwn ? (
                      <MessageStatusIcon
                        pending={msg.pending}
                        isRead={msg.isRead}
                        isDelivered={msg.isDelivered}
                        error={msg.error}
                        lightOnDark
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {isFile && msg.mediaUrl ? (
              <View style={parsed.text ? s.mediaSpacer : undefined}>
                <AttachmentCard
                  url={msg.mediaUrl}
                  fileName={msg.fileName || msg.content || 'ملف مرفق'}
                  fileSize={
                    typeof msg.fileSize === 'number' && msg.fileSize > 0
                      ? `${(msg.fileSize / (1024 * 1024)).toFixed(1)} ميجابايت`
                      : undefined
                  }
                  isOwn={isOwn}
                  uploadProgress={isUploading ? msg.uploadProgress : undefined}
                  onCancelUpload={onCancelUpload ? () => onCancelUpload(msg.id) : undefined}
                />
              </View>
            ) : null}

            {isVoice && msg.mediaUrl ? (
              <View style={parsed.text ? s.mediaSpacer : undefined}>
                <AudioPlayer uri={msg.mediaUrl} isOwn={isOwn} />
              </View>
            ) : null}

            {parsed.isReply ? (
              <View style={[s.replyBox, isOwn ? s.replyBoxOwn : s.replyBoxOther]}>
                <View style={s.replyLine} />
                <View style={s.replyContent}>
                  <Text style={s.replySender}>{parsed.replySender}</Text>
                  <Text style={s.replySnippet} numberOfLines={2}>
                    {parsed.replyText}
                  </Text>
                </View>
              </View>
            ) : null}

            {!!parsed.text && !isFile ? (
              <Text style={s.msgTxt}>{parsed.text}</Text>
            ) : null}

            {!isImageOnly ? (
              <View style={s.timeRow}>
                <Text style={s.msgTime}>{formatMsgTime(msg.createdAt)}</Text>
                {isOwn ? (
                  <MessageStatusIcon
                    pending={msg.pending}
                    isRead={msg.isRead}
                    isDelivered={msg.isDelivered}
                    error={msg.error}
                  />
                ) : null}
              </View>
            ) : null}

            {hasReactions ? (
              <View
                style={[
                  s.reactionsBadge,
                  isOwn ? s.reactionsBadgeOwn : s.reactionsBadgeOther,
                ]}
              >
                <Text style={s.reactionsBadgeTxt} numberOfLines={2} adjustsFontSizeToFit>
                  {Array.from(new Set(msg.reactions!.map((r) => r.emoji))).join(' ')}
                  {msg.reactions!.length > 1 ? ` (${msg.reactions!.length})` : ''}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {isOwn && msg.error ? (
          <View style={s.failedBar} testID="chat-message-error-indicator">
            <View style={s.failedMetaRow}>
              <Ionicons name="alert-circle" size={14} color={Colors.error} />
              <Text style={s.failedText}>
                {msg.errorReason ? `لم تُرسل · ${msg.errorReason}` : 'لم تُرسل'}
              </Text>
            </View>
            <View style={s.failedActionsRow}>
              <TouchableOpacity
                style={s.retryCapsule}
                onPress={() => onRetry?.(msg.id)}
                hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="إعادة المحاولة"
                testID="chat-failed-retry-btn"
              >
                <Text style={s.retryCapsuleText}>إعادة المحاولة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.deleteCapsule}
                onPress={() => onRemoveFailed?.(msg.id)}
                hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="حذف"
                testID="chat-failed-delete-btn"
              >
                <Text style={s.deleteCapsuleText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Modal
          visible={fullScreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullScreenImage(false)}
        >
          <View style={s.fullScreenContainer}>
            <TouchableOpacity
              style={[s.closeFsBtn, { top: insets.top + 8 }]}
              onPress={() => setFullScreenImage(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="إغلاق الصورة"
              testID="chat-fullscreen-close-btn"
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            {msg.mediaUrl ? (
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
            ) : null}
          </View>
          {fullScreenImage ? <ModalToastHost /> : null}
        </Modal>
      </View>
    </Swipeable>
  )
}

const s = StyleSheet.create({
  msgRow: { marginVertical: 4, paddingHorizontal: 16, position: 'relative' },
  msgRowWithReactions: { marginBottom: 18 },
  msgOwn: { alignItems: 'flex-start' },
  msgOther: { alignItems: 'flex-end' },
  bubbleContainer: { flexDirection: 'row', alignItems: 'center', maxWidth: '78%' },
  doubleTickRow: { flexDirection: 'row', marginStart: -4, alignItems: 'center' },
  msgBubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    flexShrink: 1,
    minWidth: 64,
    borderRadius: 14,
  },
  msgBubbleExtended: {
    minWidth: 190,
  },
  msgBubbleImageOnly: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  msgBubbleError: {
    backgroundColor: Colors.chatOwnBubbleMutedBg,
    borderWidth: 1,
    borderColor: Colors.dangerLightBorder,
  },
  msgBubblePendingDelete: {
    opacity: 0.45,
  },
  msgBubbleOwn: {
    backgroundColor: Colors.chatOwnBubbleBg,
  },
  msgBubbleOther: {
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  imageOnlyWrap: {
    position: 'relative',
  },
  imageWithCaptionWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  msgImage: {
    borderRadius: 10,
    resizeMode: 'cover' as ImageResizeMode,
  },
  msgImageOnly: {
    borderRadius: 12,
  },
  imageOnlyTimePill: {
    position: 'absolute',
    bottom: 8,
    end: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.scrimDark45,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  imageOnlyTimeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.white,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: Colors.scrimDark45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  uploadPct: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.white,
  },
  uploadTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.whiteAlpha30,
    overflow: 'hidden',
  },
  uploadFill: {
    height: '100%',
    backgroundColor: Colors.white,
  },
  uploadCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.scrimDark60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaSpacer: {
    marginBottom: 6,
  },
  msgTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryDeep,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  msgTime: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
  },
  failedBar: {
    marginTop: 4,
    gap: 6,
  },
  failedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  failedText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  failedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryCapsule: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryCapsuleText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryStrong,
  },
  deleteCapsule: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: Colors.errorSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCapsuleText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
  },
  reactionsBadge: {
    position: 'absolute',
    bottom: -14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    maxWidth: 160,
  },
  reactionsBadgeOwn: { start: 16 },
  reactionsBadgeOther: { end: 16 },
  reactionsBadgeTxt: {
    fontSize: 12,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryDeep,
    lineHeight: 16,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.shadowBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomScroll: { flex: 1, width: '100%' },
  zoomScrollContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  closeFsBtn: {
    position: 'absolute',
    end: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.scrimDark60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 52,
  },
  swipeActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.whiteAlpha50,
  },
  replyBoxOther: {
    backgroundColor: Colors.gray50Surface,
  },
  replyLine: {
    width: 3,
    height: '100%',
    backgroundColor: Colors.primaryStrong,
  },
  replyContent: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    flex: 1,
  },
  replySender: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryStrong,
    marginBottom: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  replySnippet: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
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
  if (pMsg.isDelivered !== nMsg.isDelivered) return false
  if (pMsg.pending !== nMsg.pending) return false
  if (pMsg.error !== nMsg.error) return false
  if (pMsg.errorReason !== nMsg.errorReason) return false
  if (pMsg.uploadProgress !== nMsg.uploadProgress) return false
  if (pMsg.pendingDelete !== nMsg.pendingDelete) return false
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
