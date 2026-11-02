import { renderHook, act } from '@testing-library/react-native'
import { I18nManager } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { useGestureSwiper } from '../../hooks/useGestureSwiper'

describe('D-182a4 — useGestureSwiper Live Dots Everywhere', () => {
  beforeEach(() => {
    I18nManager.isRTL = true
    jest.clearAllMocks()
  })

  it('updates activeIndex live during drag as soon as nearest card index changes', async () => {
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

    // Start gesture
    await act(async () => {
      capturedOnStart?.()
    })

    // Drag slightly under 50% threshold (100px < 150px)
    await act(async () => {
      capturedOnUpdate?.({ translationX: 100 })
    })
    expect(result.current.activeIndex).toBe(0)

    // Drag past 50% threshold (160px >= 150px) -> live dot switches to index 1 immediately
    await act(async () => {
      capturedOnUpdate?.({ translationX: 160 })
    })
    expect(result.current.activeIndex).toBe(1)

    // Drag further to next card threshold (460px >= 450px) -> switches to index 2
    await act(async () => {
      capturedOnUpdate?.({ translationX: 460 })
    })
    expect(result.current.activeIndex).toBe(2)

    // Drag back to index 1 (200px)
    await act(async () => {
      capturedOnUpdate?.({ translationX: 200 })
    })
    expect(result.current.activeIndex).toBe(1)

    // End gesture with positive velocity towards index 1
    await act(async () => {
      capturedOnEnd?.({ translationX: 200, velocityX: 100 })
    })
    expect(result.current.activeIndex).toBe(1)
    expect(onActiveIndexChange).toHaveBeenCalledWith(1)

    panSpy.mockRestore()
  })

  it('handles rubber banding without publishing negative index or out of bounds index', async () => {
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
    const count = 3

    const { result } = await renderHook(() =>
      useGestureSwiper({
        count,
        step,
        onActiveIndexChange,
        paging: true,
      })
    )

    // Pull past item 0 to the right (negative translationX in physics)
    await act(async () => {
      capturedOnStart?.()
      capturedOnUpdate?.({ translationX: -150 })
    })
    expect(result.current.activeIndex).toBe(0)

    // Swipe to next card (index 1)
    await act(async () => {
      capturedOnStart?.()
      capturedOnUpdate?.({ translationX: 300 })
      capturedOnEnd?.({ translationX: 300, velocityX: 200 })
    })
    expect(result.current.activeIndex).toBe(1)

    // Swipe to last card (index 2)
    await act(async () => {
      capturedOnStart?.()
      capturedOnUpdate?.({ translationX: 300 })
      capturedOnEnd?.({ translationX: 300, velocityX: 200 })
    })
    expect(result.current.activeIndex).toBe(2)

    // Pull past last item (count - 1 = 2, rubber-banding past index 2)
    await act(async () => {
      capturedOnStart?.()
      capturedOnUpdate?.({ translationX: 400 })
    })
    expect(result.current.activeIndex).toBe(2)

    await act(async () => {
      capturedOnEnd?.({ translationX: 400, velocityX: 0 })
    })
    expect(result.current.activeIndex).toBe(2)

    panSpy.mockRestore()
  })
})
