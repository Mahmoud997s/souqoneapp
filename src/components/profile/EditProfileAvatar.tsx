import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'

interface EditProfileAvatarProps {
  displayAvatar: string | null
  onPress: () => void
}

export function EditProfileAvatar({ displayAvatar, onPress }: EditProfileAvatarProps) {
  return (
    <View style={s.avatarSection}>
      <TouchableOpacity style={s.avatarWrap} activeOpacity={0.85} onPress={onPress}>
        {displayAvatar ? (
          <Image source={{ uri: displayAvatar }} style={s.avatar} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={['#1e3a6e', '#0f2952', '#0B2447']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.avatar, s.avatarFallback]}
          >
            <View style={s.avatarGlassShimmer} />
            <Ionicons name="person" size={30} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        )}
        <View style={s.cameraBadge}>
          <Ionicons name="camera" size={13} color={Colors.white} />
        </View>
      </TouchableOpacity>
      <Text style={s.avatarHint}>تغيير الصورة الشخصية</Text>
    </View>
  )
}

const s = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGlassShimmer: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopStartRadius: 40,
    borderTopEndRadius: 40,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    backgroundColor: Colors.primaryDark,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  avatarHint: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 8,
  },
})
