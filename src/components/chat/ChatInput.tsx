import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard, Text, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Colors } from '../../constants/colors'
import { toastService } from '../../store/toastStore'
import { VoiceRecorder } from './VoiceRecorder'
import { CHAT_INPUT_BAR_HEIGHT } from '../../constants/bottomBarTokens'
import { computeChatInputBottomPadding, useKeyboardVisible } from '../../hooks/useKeyboardVisible'

export { CHAT_INPUT_BAR_HEIGHT }

export interface ChatFileInfo {
  name?: string
  size?: number
  duration?: number
}

export interface ChatReplyPreview {
  senderLabel: string
  quoteText: string
  onCancel: () => void
}

interface Props {
  msgText: string
  onChangeText: (text: string) => void
  onSend: (text?: string, mediaUri?: string, mediaType?: 'IMAGE' | 'FILE' | 'VOICE', fileInfo?: ChatFileInfo) => void
  insetsBottom: number
  replyPreview?: ChatReplyPreview | null
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🙏', '🚗', '✅']

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`
}

export function ChatInput({ msgText, onChangeText, onSend, insetsBottom, replyPreview }: Props) {
  const [imageUris, setImageUris] = useState<string[]>([])
  const [fileUri, setFileUri] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<ChatFileInfo | null>(null)
  const [showVoice, setShowVoice] = useState(false)
  const [showAttachCard, setShowAttachCard] = useState(false)
  const [showEmojiStrip, setShowEmojiStrip] = useState(false)

  const handlePickGallery = async () => {
    setShowAttachCard(false)
    Keyboard.dismiss()
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        toastService.show({ kind: 'error', title: 'يرجى السماح بالوصول إلى المعرض' })
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      })
      if (!result.canceled && result.assets.length > 0) {
        setFileUri(null)
        setFileInfo(null)
        setImageUris((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5))
      }
    } catch {
      toastService.show({ kind: 'error', title: 'تعذّر فتح معرض الصور' })
    }
  }

  const handlePickCamera = async () => {
    setShowAttachCard(false)
    Keyboard.dismiss()
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        toastService.show({ kind: 'error', title: 'يرجى السماح بالوصول إلى الكاميرا' })
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      if (!result.canceled && result.assets.length > 0) {
        setFileUri(null)
        setFileInfo(null)
        setImageUris((prev) => [...prev, result.assets[0].uri].slice(0, 5))
      }
    } catch {
      toastService.show({ kind: 'error', title: 'تعذّر فتح الكاميرا' })
    }
  }

  const handleAddDocument = async () => {
    setShowAttachCard(false)
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImageUris([])
        setFileUri(res.assets[0].uri)
        setFileInfo({ name: res.assets[0].name, size: res.assets[0].size })
      }
    } catch {
      toastService.show({ kind: 'error', title: 'تعذّر اختيار الملف' })
    }
  }

  const handleSend = () => {
    const hasImages = imageUris.length > 0
    const hasFile = !!fileUri
    if (!msgText.trim() && !hasImages && !hasFile) return

    if (hasImages) {
      imageUris.forEach((uri, idx) => {
        onSend(idx === 0 ? msgText : '', uri, 'IMAGE')
      })
      setImageUris([])
    } else if (hasFile && fileUri) {
      onSend(msgText, fileUri, 'FILE', fileInfo || undefined)
      setFileUri(null)
      setFileInfo(null)
    } else {
      onSend(msgText)
    }

    setShowAttachCard(false)
    setShowEmojiStrip(false)
  }

  const handleSendVoice = (uri: string, duration: number) => {
    onSend('', uri, 'VOICE', { duration })
    setShowVoice(false)
  }

  const isKeyboardVisible = useKeyboardVisible()
  const hasAttachments = imageUris.length > 0 || !!fileUri
  const canSend = !!msgText.trim() || hasAttachments
  const bottomPad = computeChatInputBottomPadding(insetsBottom, isKeyboardVisible)

  if (showVoice) {
    return (
      <View style={[s.wrapper, { paddingBottom: bottomPad }]}>
        <VoiceRecorder onSend={handleSendVoice} onCancel={() => setShowVoice(false)} />
      </View>
    )
  }

  return (
    <View style={[s.wrapper, { paddingBottom: bottomPad }]}>
      {showAttachCard ? (
        <View style={s.attachCard} testID="chat-attach-menu">
          <TouchableOpacity
            style={s.attachOption}
            onPress={handleAddDocument}
            accessibilityRole="button"
            accessibilityLabel="مستند"
            testID="chat-attach-document"
          >
            <View style={[s.attachCircle, { backgroundColor: Colors.primarySoft12 }]}>
              <Ionicons name="document-text" size={22} color={Colors.primaryStrong} />
            </View>
            <Text style={s.attachLabel}>مستند</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.attachOption}
            onPress={handlePickCamera}
            accessibilityRole="button"
            accessibilityLabel="الكاميرا"
            testID="chat-attach-camera"
          >
            <View style={[s.attachCircle, { backgroundColor: Colors.errorSoftBg }]}>
              <Ionicons name="camera" size={22} color={Colors.error} />
            </View>
            <Text style={s.attachLabel}>الكاميرا</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.attachOption}
            onPress={handlePickGallery}
            accessibilityRole="button"
            accessibilityLabel="المعرض"
            testID="chat-attach-gallery"
          >
            <View style={[s.attachCircle, { backgroundColor: Colors.primaryTintBg }]}>
              <Ionicons name="images" size={22} color={Colors.primaryStrong} />
            </View>
            <Text style={s.attachLabel}>المعرض</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showEmojiStrip ? (
        <View style={s.emojiStrip} testID="chat-emoji-strip">
          {QUICK_EMOJIS.map((em) => (
            <TouchableOpacity
              key={em}
              style={s.emojiChip}
              onPress={() => onChangeText(`${msgText}${em}`)}
              accessibilityRole="button"
              accessibilityLabel={em}
            >
              <Text style={s.emojiGlyph}>{em}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={s.composerRow}>
        <View style={s.pill}>
          {replyPreview ? (
            <View style={s.replyInsidePill} testID="chat-reply-preview">
              <View style={s.replyBar} />
              <View style={s.replyTextWrap}>
                <Text style={s.replyTitle} numberOfLines={1}>
                  {replyPreview.senderLabel}
                </Text>
                <Text style={s.replyQuote} numberOfLines={1}>
                  {replyPreview.quoteText}
                </Text>
              </View>
              <TouchableOpacity
                style={s.iconTarget44}
                onPress={replyPreview.onCancel}
                accessibilityRole="button"
                accessibilityLabel="إلغاء الرد"
                testID="chat-reply-cancel-btn"
              >
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}

          {imageUris.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.thumbTray}
              contentContainerStyle={s.thumbTrayContent}
              testID="chat-image-tray"
            >
              {imageUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={s.thumbWrap}>
                  <Image source={{ uri }} style={s.thumbImg} contentFit="cover" />
                  <TouchableOpacity
                    style={s.thumbRemoveBtn}
                    onPress={() => setImageUris((prev) => prev.filter((_, i) => i !== index))}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="إزالة الصورة"
                    testID={`chat-remove-image-${index}`}
                  >
                    <Ionicons name="close" size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {fileUri ? (
            <View style={s.fileChip} testID="chat-file-chip">
              <Ionicons name="document-text-outline" size={20} color={Colors.primaryStrong} />
              <View style={s.fileChipInfo}>
                <Text style={s.fileChipName} numberOfLines={1}>
                  {fileInfo?.name || 'ملف مرفق'}
                </Text>
                {fileInfo?.size ? (
                  <Text style={s.fileChipSize} numberOfLines={1}>
                    {formatFileSize(fileInfo.size)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={s.iconTarget44}
                onPress={() => {
                  setFileUri(null)
                  setFileInfo(null)
                }}
                accessibilityRole="button"
                accessibilityLabel="إزالة الملف"
                testID="chat-remove-file-btn"
              >
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={s.inputRow}>
            <TouchableOpacity
              style={s.iconTarget44}
              onPress={() => {
                setShowAttachCard(false)
                setShowEmojiStrip((v) => !v)
              }}
              accessibilityRole="button"
              accessibilityLabel="الرموز التعبيرية"
              testID="chat_emoji_btn"
            >
              <Ionicons name="happy-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            <TextInput
              style={s.input}
              testID="chat_input_field"
              placeholder={hasAttachments ? 'أضف تعليقاً (اختياري)…' : 'اكتب رسالتك…'}
              placeholderTextColor={Colors.placeholder}
              value={msgText}
              onChangeText={onChangeText}
              multiline
            />

            <TouchableOpacity
              style={s.iconTarget44}
              onPress={() => {
                setShowEmojiStrip(false)
                setShowAttachCard((v) => !v)
              }}
              accessibilityRole="button"
              accessibilityLabel="إرفاق"
              testID="chat_attach_btn"
            >
              <Ionicons name="attach-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            {!canSend ? (
              <TouchableOpacity
                style={s.iconTarget44}
                onPress={handlePickCamera}
                accessibilityRole="button"
                accessibilityLabel="الكاميرا"
                testID="chat_camera_btn"
              >
                <Ionicons name="camera-outline" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {!canSend ? (
          <TouchableOpacity
            style={s.actionCircle}
            onPress={() => {
              setShowAttachCard(false)
              setShowEmojiStrip(false)
              setShowVoice(true)
            }}
            accessibilityRole="button"
            accessibilityLabel="تسجيل صوتي"
            testID="chat_mic_btn"
          >
            <Ionicons name="mic" size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.actionCircle}
            onPress={handleSend}
            accessibilityRole="button"
            accessibilityLabel="إرسال"
            testID="chat_send_btn"
          >
            <Ionicons name="send" size={18} color={Colors.white} style={s.sendIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.transparent,
    paddingTop: 6,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.chatInputBorder,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  iconTarget44: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryDeep,
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 112,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { transform: [{ scaleX: -1 }] },
  replyInsidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50Surface,
    paddingStart: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  replyBar: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: Colors.primaryStrong,
    marginEnd: 8,
  },
  replyTextWrap: {
    flex: 1,
  },
  replyTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryStrong,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  replyQuote: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  thumbTray: {
    maxHeight: 76,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  thumbTrayContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  thumbWrap: {
    position: 'relative',
  },
  thumbImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: -4,
    end: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.scrimDark60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gray50Surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  fileChipInfo: {
    flex: 1,
  },
  fileChipName: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primaryDeep,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  fileChipSize: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  attachCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.chatInputBorder,
  },
  attachOption: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 56,
    gap: 6,
  },
  attachCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryDeep,
  },
  emojiStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 6,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.chatInputBorder,
  },
  emojiChip: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiGlyph: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 20,
  },
})
