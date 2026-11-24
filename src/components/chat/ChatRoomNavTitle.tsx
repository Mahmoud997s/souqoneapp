import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'

export interface ChatRoomNavTitleProps {
  displayName: string
  avatarUri?: string | null
  isOnline?: boolean
  isTyping?: boolean
  onPress?: () => void
  testID?: string
}

export const ChatRoomNavTitle: React.FC<ChatRoomNavTitleProps> = ({
  displayName,
  avatarUri,
  isOnline = false,
  isTyping = false,
  onPress,
  testID = 'chat-room-nav-title',
}) => {
  const initialLetter = displayName ? displayName.trim().charAt(0) : 'م'
  const statusText = isTyping ? 'يكتب الآن' : isOnline ? 'متصل الآن' : null

  const handlePress = () => {
    if (!onPress) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <TouchableOpacity
      testID={testID}
      style={s.container}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={displayName}
    >
      <View style={s.avatar} testID={`${testID}-avatar`}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={s.avatarImg}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={s.avatarInitial}>{initialLetter}</Text>
        )}
      </View>

      <View style={s.textCol}>
        <Text
          testID={`${testID}-name`}
          style={s.name}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
        {statusText ? (
          <Text testID={`${testID}-status`} style={s.status} numberOfLines={1}>
            {statusText}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.slateSubtleBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarInitial: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.slateDark,
    writingDirection: 'rtl',
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.slateDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  status: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.success,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
})
