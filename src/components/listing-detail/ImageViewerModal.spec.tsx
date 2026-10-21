import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { ImageViewerModal } from './ImageViewerModal'
import type { GalleryImage } from '../../types/carDetailViewModel.types'

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

    // Verify touch target width & height >= 44
    const flatStyle = StyleSheet.flatten(closeBtn.props.style)
    expect(flatStyle?.width).toBeGreaterThanOrEqual(44)
    expect(flatStyle?.height).toBeGreaterThanOrEqual(44)

    // Verify counter
    expect(screen.getByText('1 / 2')).toBeTruthy()

    // Verify close action
    fireEvent.press(closeBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
