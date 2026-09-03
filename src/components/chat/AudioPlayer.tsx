import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Colors } from '../../constants/colors'

interface Props {
  uri: string
  isOwn: boolean
}

export function AudioPlayer({ uri, isOwn }: Props) {
  const player = useAudioPlayer(uri ? { uri } : null)
  const status = useAudioPlayerStatus(player)

  const isPlaying = status.playing
  const durationSec = status.duration || 1
  const currentTimeSec = status.currentTime || 0

  const handlePlayPause = () => {
    try {
      if (isPlaying) {
        player.pause()
      } else {
        if (currentTimeSec >= durationSec && durationSec > 0) {
          player.seekTo(0)
        }
        player.play()
      }
    } catch (e) {
      console.log('Error playing audio', e)
    }
  }

  function formatTime(seconds: number) {
    const totalSeconds = Math.floor(seconds)
    const m = Math.floor(totalSeconds / 60)
    const sec = totalSeconds % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0

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
          {formatTime(currentTimeSec > 0 ? currentTimeSec : durationSec)}
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
