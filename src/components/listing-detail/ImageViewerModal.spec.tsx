import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  ImageViewerModal,
  TOP_BAR_SAFE_MARGIN,
  BOTTOM_BAR_SAFE_MARGIN,
} from './ImageViewerModal'
import type { GalleryImage } from '../../types/carDetailViewModel.types'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: any) => <View testID="mock-expo-image" {...props} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: any) => <View testID="mock-icon" {...props} /> }
})

describe('ImageViewerModal', () => {
  const mockOnClose = jest.fn()
  const sampleImages: GalleryImage[] = [
    { id: 'img-1', url: 'https://example.com/1.jpg', isPrimary: true, order: 0 },
    { id: 'img-2', url: 'https://example.com/2.jpg', isPrimary: false, order: 1 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when visible is false or images array is empty', async () => {
    const { toJSON } = await render(
      <ImageViewerModal
        visible={false}
        images={sampleImages}
        initialIndex={0}
        onClose={mockOnClose}
      />
    )
    expect(toJSON()).toBeNull()

    const { toJSON: toJSON2 } = await render(
      <ImageViewerModal
        visible={true}
        images={[]}
        initialIndex={0}
        onClose={mockOnClose}
      />
    )
    expect(toJSON2()).toBeNull()
  })

  it('renders close button with >= 44px touch target, counter and handles close interaction', async () => {
    await render(
      <ImageViewerModal
        visible={true}
        images={sampleImages}
        initialIndex={0}
        onClose={mockOnClose}
      />
    )

    const closeBtn = screen.getByTestId('btn-close-viewer')
    expect(closeBtn).toBeTruthy()
    expect(closeBtn.props.accessibilityLabel).toBe('إغلاق')

    // Verify touch target width & height >= 44
    const flatStyle = StyleSheet.flatten(closeBtn.props.style)
    expect(flatStyle?.width).toBeGreaterThanOrEqual(44)
    expect(flatStyle?.height).toBeGreaterThanOrEqual(44)

    // Verify counter
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByTestId('viewer-counter-pill')).toBeTruthy()

    // Verify close action
    fireEvent.press(closeBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('positions top bar below safe-area top inset + margin and bottom bar above bottom inset', async () => {
    await render(
      <ImageViewerModal
        visible={true}
        images={sampleImages}
        initialIndex={0}
        onClose={mockOnClose}
      />
    )

    const topBar = screen.getByTestId('viewer-top-bar')
    const topBarStyle = StyleSheet.flatten(topBar.props.style)
    expect(topBarStyle?.paddingTop).toBe(44 + TOP_BAR_SAFE_MARGIN)

    const bottomBar = screen.getByTestId('viewer-bottom-bar')
    const bottomBarStyle = StyleSheet.flatten(bottomBar.props.style)
    expect(bottomBarStyle?.paddingBottom).toBe(34 + BOTTOM_BAR_SAFE_MARGIN)

    expect(screen.getByText('اضغط مرتين للتكبير / التصغير')).toBeTruthy()
  })

  it('preserves vertical swipe-down-to-dismiss behavior when not zoomed', async () => {
    let capturedOnEnd: ((e: { translationX: number; translationY: number }) => void) | undefined
    const realPan = Gesture.Pan.bind(Gesture)
    const panSpy = jest.spyOn(Gesture, 'Pan').mockImplementation(() => {
      const gesture = realPan()
      const origOnEnd = gesture.onEnd.bind(gesture)
      gesture.onEnd = ((cb: any) => {
        capturedOnEnd = cb
        return origOnEnd(cb)
      }) as typeof gesture.onEnd
      return gesture
    })

    await render(
      <ImageViewerModal
        visible={true}
        images={sampleImages}
        initialIndex={0}
        onClose={mockOnClose}
      />
    )

    expect(capturedOnEnd).toBeDefined()

    // Small downward drag (< 80px) does not dismiss
    capturedOnEnd?.({ translationX: 5, translationY: 40 })
    expect(mockOnClose).not.toHaveBeenCalled()

    // Downward swipe (> 80px and dominant over horizontal) dismisses modal
    capturedOnEnd?.({ translationX: 10, translationY: 120 })
    expect(mockOnClose).toHaveBeenCalledTimes(1)

    panSpy.mockRestore()
  })

  it('handles image error with category fallback placeholder in viewer', async () => {
    await render(
      <ImageViewerModal
        visible={true}
        images={sampleImages}
        initialIndex={0}
        onClose={mockOnClose}
        category="parts"
      />
    )

    const activeImage = screen.getByTestId('viewer-active-image')
    expect(activeImage).toBeTruthy()

    // Trigger onError
    await act(async () => {
      activeImage.props.onError({ error: 'Failed to load' })
    })

    expect(screen.getByTestId('viewer-image-fallback-0')).toBeTruthy()
    const icon = screen.getByTestId('viewer-image-fallback-icon')
    expect(icon.props.name).toBe('hardware-chip-outline')
    expect(screen.getByText('تعذر تحميل الصورة')).toBeTruthy()
  })
})
