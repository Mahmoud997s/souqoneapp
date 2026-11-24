import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio'
import { Colors } from '../../constants/colors'
import { logError } from '../../utils/safeLog'

interface Props {
  onSend: (uri: string, duration: number) => void
  onCancel: () => void
}

export function VoiceRecorder({ onSend, onCancel }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(recorder)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isStartedRef = useRef(false)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    startRecording()
    return () => {
      stopRecording(false)
    }
  }, [])

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null
    if (recorderState.isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      )
      animation.start()
    } else {
      pulseAnim.stopAnimation()
    }
    return () => animation?.stop()
  }, [recorderState.isRecording])

  async function startRecording() {
    try {
      const { granted } = await requestRecordingPermissionsAsync()
      if (!granted) {
        onCancel()
        return
      }
      await recorder.record()
      isStartedRef.current = true

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      logError('VoiceRecorder:Start', err)
      onCancel()
    }
  }

  async function stopRecording(send: boolean = true) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isStartedRef.current) return
    isStartedRef.current = false

    try {
      await recorder.stop()
      const uri = recorder.uri

      if (send && uri) {
        onSend(uri, duration)
      } else {
        onCancel()
      }
    } catch (err) {
      logError('VoiceRecorder:Stop', err)
      onCancel()
    }
  }

  function formatTime(secTotal: number) {
    const m = Math.floor(secTotal / 60)
    const sec = secTotal % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <View style={s.row}>
      <View style={s.pill}>
        <TouchableOpacity
          onPress={() => stopRecording(false)}
          style={s.btnCancel}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel="إلغاء التسجيل"
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>

        <View style={s.center}>
          <Animated.View style={[s.dot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={s.timeTxt}>{formatTime(duration)}</Text>
          <Text style={s.hintTxt}>اسحب للإلغاء</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => stopRecording(true)}
        style={s.btnSend}
        accessibilityRole="button"
        accessibilityLabel="إرسال التسجيل الصوتي"
      >
        <Ionicons name="send" size={18} color={Colors.white} style={s.sendIcon} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.chatInputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  btnCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.errorSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  timeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryDeep,
  },
  hintTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  btnSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { transform: [{ scaleX: -1 }] },
})
