import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { Colors } from '../../constants/colors'

interface Props {
  onSend: (uri: string, duration: number) => void
  onCancel: () => void
}

export function VoiceRecorder({ onSend, onCancel }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // Animation for pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    startRecording()
    return () => {
      stopRecording(false)
    }
  }, [])

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.stopAnimation()
    }
  }, [recording])

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Failed to start recording', err)
      onCancel()
    }
  }

  async function stopRecording(send: boolean = true) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!recording) return

    try {
      setRecording(null)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      
      if (send && uri) {
        onSend(uri, duration)
      } else {
        onCancel()
      }
    } catch (err) {
      console.error('Failed to stop recording', err)
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => stopRecording(false)} style={s.btnCancel}>
        <Ionicons name="trash" size={20} color="#FF3B30" />
      </TouchableOpacity>

      <View style={s.center}>
        <Animated.View style={[s.dot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={s.timeTxt}>{formatTime(duration)}</Text>
      </View>

      <TouchableOpacity onPress={() => stopRecording(true)} style={s.btnSend}>
        <Ionicons name="arrow-up" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFE5E5',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 8,
    flex: 1,
  },
  btnCancel: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center', justifyContent: 'center'
  },
  center: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  timeTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: '#FF3B30' },
  btnSend: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center'
  },
})
