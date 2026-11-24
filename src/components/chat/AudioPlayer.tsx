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
    } catch {
      // Audio playback interrupted or error
    }
  }

  function formatTime(seconds: number) {
    const totalSeconds = Math.floor(seconds)
    const m = Math.floor(totalSeconds / 60)
    const sec = totalSeconds % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0

  return (
    <View style={[s.container, isOwn ? s.own : s.other]}>
      <TouchableOpacity
        onPress={handlePlayPause}
        style={s.btn}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'إيقاف الصوت' : 'تشغيل الرسالة الصوتية'}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={Colors.white} />
      </TouchableOpacity>

      <View style={s.waveform}>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.time}>
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    width: 210,
    gap: 10,
  },
  own: { backgroundColor: Colors.whiteAlpha50 },
  other: { backgroundColor: Colors.gray50Surface },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: { flex: 1, justifyContent: 'center' },
  progressBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: Colors.scrimDark10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryStrong,
  },
  time: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    writingDirection: 'ltr',
    textAlign: 'left',
    color: Colors.textMuted,
  },
})
