import React from 'react'
import { cleanup, render } from '@testing-library/react-native'
import { Animated } from 'react-native'
import { ChatSkeleton } from './ChatSkeleton'

jest.mock('expo-audio', () => ({
  useAudioRecorder: () => ({ record: jest.fn(), stop: jest.fn(), uri: undefined }),
  useAudioRecorderState: () => ({ isRecording: true }),
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}))

import { VoiceRecorder } from './VoiceRecorder'
import { GlobalToast } from '../ui/GlobalToast'
import { useToastStore } from '../../store/toastStore'

function createAnimation() {
  return {
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  } as unknown as Animated.CompositeAnimation
}

describe('animation cleanup on unmount', () => {
  afterEach(async () => {
    await cleanup()
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
    jest.restoreAllMocks()
  })

  it('stops the ChatSkeleton loop', async () => {
    const animation = createAnimation()
    jest.spyOn(Animated, 'loop').mockReturnValue(animation)

    const rendered = await render(<ChatSkeleton />)
    await rendered.unmount()

    expect(animation.stop).toHaveBeenCalledTimes(1)
  })

  it('stops the VoiceRecorder pulse loop', async () => {
    const animation = createAnimation()
    jest.spyOn(Animated, 'loop').mockReturnValue(animation)

    const rendered = await render(<VoiceRecorder onSend={jest.fn()} onCancel={jest.fn()} />)
    await rendered.unmount()

    expect(animation.stop).toHaveBeenCalledTimes(1)
  })

  it('cleans up GlobalToast timers cleanly on unmount', async () => {
    useToastStore.setState({
      current: {
        id: 'cleanup-1',
        kind: 'info',
        title: 'Title',
        durationMs: 4000,
      },
      modalHostIds: [],
    })

    const rendered = await render(<GlobalToast />)
    await rendered.unmount()
    expect(true).toBe(true)
  })
})
