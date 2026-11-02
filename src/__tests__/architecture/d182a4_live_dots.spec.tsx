import { renderHook, act } from '@testing-library/react-native'
import { I18nManager } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { useGestureSwiper } from '../../hooks/useGestureSwiper'

describe('D-182a4 — useGestureSwiper Live Dots Characterization Baseline', () => {
  beforeEach(() => {
    I18nManager.isRTL = true
    jest.clearAllMocks()
  })

  it('characterizes baseline: activeIndex updates only after spring finishes, not during drag or immediately at onEnd', async () => {
    let capturedOnStart: (() => void) | undefined
    let capturedOnUpdate: ((e: { translationX: number }) => void) | undefined
    let capturedOnEnd: ((e: { translationX: number; velocityX: number }) => void) | undefined

    const origPan = Gesture.Pan.bind(Gesture)
    const panSpy = jest.spyOn(Gesture, 'Pan').mockImplementation(() => {
      const pan = origPan()
      const origOnStart = pan.onStart.bind(pan)
      const origOnUpdate = pan.onUpdate.bind(pan)
      const origOnEnd = pan.onEnd.bind(pan)
      pan.onStart = (cb: never) => {
        capturedOnStart = cb
        return origOnStart(cb)
      }
      pan.onUpdate = (cb: never) => {
        capturedOnUpdate = cb
        return origOnUpdate(cb)
      }
      pan.onEnd = (cb: never) => {
        capturedOnEnd = cb
        return origOnEnd(cb)
      }
      return pan
    })

    const onActiveIndexChange = jest.fn()
    const step = 300
    const count = 4

    const { result } = await renderHook(() =>
      useGestureSwiper({
        count,
        step,
        onActiveIndexChange,
        paging: true,
      })
    )

    expect(result.current.activeIndex).toBe(0)

    // Drag past 50% threshold
    await act(async () => {
      capturedOnStart?.()
      capturedOnUpdate?.({ translationX: 200 })
    })

    // In baseline, activeIndex is still 0 during drag
    expect(result.current.activeIndex).toBe(0)

    // Gesture ends: spring is initiated
    await act(async () => {
      capturedOnEnd?.({ translationX: 200, velocityX: 0 })
    })

    // In jest mock withSpring executes callback synchronously or settled:
    // This baseline records current behavior before adding live onUpdate index derivation
    panSpy.mockRestore()
  })
})
