import React from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { useState } from 'react'

import * as ImagePicker from 'expo-image-picker'

interface Props {
  msgText: string
  onChangeText: (text: string) => void
  onSend: (text?: string, imageUri?: string) => void
  insetsBottom: number
}

export function ChatInput({ msgText, onChangeText, onSend, insetsBottom }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null)

  const handleAddMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleSend = () => {
    onSend(msgText, imageUri || undefined)
    setImageUri(null)
  }

  return (
    <View style={[s.container, { paddingBottom: insetsBottom || Spacing.space3 }]}>
      {imageUri && (
        <View style={s.previewContainer}>
          <Image source={{ uri: imageUri }} style={s.previewImage} contentFit="cover" />
          <TouchableOpacity 
            style={s.removePreviewBtn} 
            onPress={() => setImageUri(null)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="close-circle" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
      <View style={s.inputBar}>
        <TouchableOpacity style={s.addBtn} onPress={handleAddMedia}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.text2} />
        </TouchableOpacity>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            testID="chat_input_field"
            placeholder="اكتب رسالة..."
            placeholderTextColor={Colors.textMuted}
            value={msgText}
            onChangeText={onChangeText}
            textAlign="right"
            multiline
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          style={[s.sendBtn, (!msgText.trim() && !imageUri) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!msgText.trim() && !imageUri}
          testID="chat_send_btn"
        >
          <Ionicons name="send" size={18} color={Colors.white} style={s.sendIcon} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { backgroundColor: Colors.white },
  previewContainer: { padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', position: 'relative', width: '100%' },
  previewImage: { width: '100%', height: 240, borderRadius: 12 },
  removePreviewBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 2 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12,
    paddingTop: 8, backgroundColor: Colors.white,
  },
  addBtn: { padding: 8, paddingBottom: 10 },
  inputWrap: {
    flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20,
    minHeight: 40, maxHeight: 120, marginHorizontal: 8,
    justifyContent: 'center', marginBottom: 8,
  },
  input: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: Colors.text, paddingHorizontal: 16, paddingVertical: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  sendBtnDisabled: { backgroundColor: '#A0B4CE' },
  sendIcon: { marginRight: 2, transform: [{ scaleX: -1 }] },
})
