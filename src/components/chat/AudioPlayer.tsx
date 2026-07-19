import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { Colors } from '../../constants/colors'

interface Props {
  uri: string
  isOwn: boolean
}

export function AudioPlayer({ uri, isOwn }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(1)
  const [position, setPosition] = useState(0)

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  const handlePlayPause = async () => {
    try {
      if (!sound) {
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        )
        setSound(newSound)
        setIsPlaying(true)
        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis)
        }
      } else {
        if (isPlaying) {
          await sound.pauseAsync()
        } else {
          // if ended, replay
          if (position >= duration) {
            await sound.playFromPositionAsync(0)
          } else {
            await sound.playAsync()
          }
        }
      }
    } catch (e) {
      console.log('Error playing audio', e)
    }
  }

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis)
      if (status.durationMillis) setDuration(status.durationMillis)
      setIsPlaying(status.isPlaying)
      if (status.didJustFinish) {
        setIsPlaying(false)
        setPosition(status.durationMillis)
      }
    }
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const m = Math.floor(totalSeconds / 60)
    const sec = totalSeconds % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0

  return (
    <View style={[s.container, isOwn ? s.own : s.other]}>
      <TouchableOpacity onPress={handlePlayPause} style={s.btn}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={isOwn ? Colors.primary : Colors.white} />
      </TouchableOpacity>
      
      <View style={s.waveform}>
        <View style={[s.progressBg, isOwn ? s.bgWhiteMuted : s.bgDarkMuted]}>
          <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: isOwn ? Colors.white : Colors.primary }]} />
        </View>
        <Text style={[s.time, isOwn ? s.txtWhite : s.txtDark]}>
          {formatTime(position > 0 ? position : duration)}
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    width: 200,
    gap: 8,
  },
  own: { backgroundColor: 'rgba(0,0,0,0.1)' },
  other: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  btn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center'
  },
  waveform: { flex: 1, justifyContent: 'center' },
  progressBg: { height: 4, borderRadius: 2, width: '100%', overflow: 'hidden' },
  bgWhiteMuted: { backgroundColor: 'rgba(255,255,255,0.3)' },
  bgDarkMuted: { backgroundColor: 'rgba(0,0,0,0.1)' },
  progressFill: { height: '100%' },
  time: { fontFamily: 'Almarai_400Regular', fontSize: 11, marginTop: 6, writingDirection: 'ltr', textAlign: 'left' },
  txtWhite: { color: Colors.white },
  txtDark: { color: Colors.textMuted },
})
