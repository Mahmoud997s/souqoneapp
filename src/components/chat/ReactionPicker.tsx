import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { Colors } from '../../constants/colors'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '😍']

interface Props {
  isVisible: boolean
  selectedMsgId: string | null
  onReact: (msgId: string, emoji: string) => void
  onDismiss: () => void
}

export function ReactionPicker({ isVisible, selectedMsgId, onReact, onDismiss }: Props) {
  const bottomSheetRef = React.useRef<BottomSheetModal>(null)

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isVisible])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      onDismiss={onDismiss}
      snapPoints={[200]}
      index={0}
      enablePanDownToClose
    >
      <BottomSheetView style={s.container}>
        <Text style={s.title}>أضف تفاعل</Text>
        
        <View style={s.emojiGrid}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={s.emojiBtn}
              onPress={() => {
                if (selectedMsgId) {
                  onReact(selectedMsgId, emoji)
                }
                onDismiss()
              }}
            >
              <Text style={s.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emojiBtn: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
  },
})
