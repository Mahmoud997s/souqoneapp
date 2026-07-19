import React from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard, Platform, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { useState } from 'react'

import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { VoiceRecorder } from './VoiceRecorder'

interface Props {
  msgText: string
  onChangeText: (text: string) => void
  onSend: (text?: string, mediaUri?: string, mediaType?: 'IMAGE' | 'FILE' | 'VOICE', fileInfo?: any) => void
  insetsBottom: number
}

export function ChatInput({ msgText, onChangeText, onSend, insetsBottom }: Props) {
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'IMAGE' | 'FILE' | null>(null)
  const [fileInfo, setFileInfo] = useState<any>(null)
  
  const [showVoice, setShowVoice] = useState(false)

  const handleAddMedia = async () => {
    Keyboard.dismiss()
    // Give options: image or file
    // For simplicity, we directly launch image picker, 
    // but let's build a quick action sheet or just use image picker for now
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    })
    if (!result.canceled) {
      setMediaUri(result.assets[0].uri)
      setMediaType('IMAGE')
      setFileInfo(null)
    }
  }

  const handleAddDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })
      if (res.assets && res.assets.length > 0) {
        setMediaUri(res.assets[0].uri)
        setMediaType('FILE')
        setFileInfo({ name: res.assets[0].name, size: res.assets[0].size })
      }
    } catch (err) {
      console.log('Doc picker err', err)
    }
  }

  const handleSend = () => {
    if (!msgText.trim() && !mediaUri) return
    onSend(msgText, mediaUri || undefined, mediaType || undefined, fileInfo || undefined)
    setMediaUri(null)
    setMediaType(null)
    setFileInfo(null)
  }

  const handleSendVoice = (uri: string, duration: number) => {
    onSend('', uri, 'VOICE', { duration })
    setShowVoice(false)
  }

  if (showVoice) {
    return (
      <View style={[s.container, { paddingBottom: insetsBottom || Spacing.space3, paddingTop: 10 }]}>
        <VoiceRecorder onSend={handleSendVoice} onCancel={() => setShowVoice(false)} />
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingBottom: insetsBottom || Spacing.space3 }]}>
      {mediaUri && mediaType === 'IMAGE' && (
        <View style={s.previewContainer}>
          <Image source={{ uri: mediaUri }} style={s.previewImage} contentFit="cover" />
          <TouchableOpacity 
            style={s.removePreviewBtn} 
            onPress={() => { setMediaUri(null); setMediaType(null) }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="close-circle" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
      
      {mediaUri && mediaType === 'FILE' && (
        <View style={s.previewContainer}>
          <View style={s.filePreviewBox}>
            <Ionicons name="document-attach" size={32} color={Colors.primary} />
            <View style={s.filePreviewInfo}>
              <Text style={s.filePreviewName} numberOfLines={1}>{fileInfo?.name || 'ملف'}</Text>
            </View>
            <TouchableOpacity onPress={() => { setMediaUri(null); setMediaType(null); setFileInfo(null) }}>
              <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={s.inputBar}>
        <TouchableOpacity style={s.addBtn} onPress={handleAddMedia}>
          <Ionicons name="image-outline" size={26} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={handleAddDocument}>
          <Ionicons name="document-attach-outline" size={26} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            testID="chat_input_field"
            placeholder="اكتب رسالة..."
            placeholderTextColor={Colors.textMuted}
            value={msgText}
            onChangeText={onChangeText}
            multiline
            onSubmitEditing={handleSend}
          />
        </View>

        {(!msgText.trim() && !mediaUri) ? (
          <TouchableOpacity
            style={s.micBtn}
            onPress={() => setShowVoice(true)}
            testID="chat_mic_btn"
          >
            <Ionicons name="mic" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.sendBtn}
            onPress={handleSend}
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
  container: { backgroundColor: Colors.white },
  previewContainer: { padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', position: 'relative', width: '100%' },
  previewImage: { width: '100%', height: 240, borderRadius: 12 },
  removePreviewBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 2 },
  filePreviewBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F6F9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  filePreviewInfo: { flex: 1, paddingHorizontal: 12 },
  filePreviewName: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.text, textAlign: 'left', writingDirection: 'rtl' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 10, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)'
  },
  addBtn: { padding: 6, paddingBottom: 12 },
  inputWrap: {
    flex: 1, backgroundColor: '#f4f6f9', borderRadius: 24,
    minHeight: 44, maxHeight: 120, marginHorizontal: 8,
    justifyContent: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)'
  },
  input: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: Colors.text, paddingHorizontal: 16, paddingVertical: 12,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 74, 198, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  sendIcon: { transform: [{ scaleX: -1 }] }, // In RTL, send icon points left
})
