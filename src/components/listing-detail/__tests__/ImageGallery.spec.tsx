import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import {
  ImageGallery,
  GALLERY_CATEGORY_ICONS,
  type GalleryCategory,
} from '../ImageGallery'
import type { GalleryImage } from '../../../types/carDetailViewModel.types'

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return {
    Image: (props: any) => <View testID="mock-gallery-image" {...props} />,
  }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) => <View testID={`mock-icon-${props.name}`} {...props} />,
  }
})

describe('ImageGallery', () => {
  const mockOnIndexChange = jest.fn()
  const mockOnPressImage = jest.fn()

  const sampleImages: GalleryImage[] = [
    { id: 'img-1', url: 'https://example.com/1.jpg', isPrimary: true, order: 0 },
    { id: 'img-2', url: 'https://example.com/2.jpg', isPrimary: false, order: 1 },
  ]

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Category-aware empty state (no images)', () => {
    it('defaults to car-sport-outline when no category or fallbackIcon is provided', async () => {
      await render(
        <ImageGallery
          images={[]}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
        />
      )

      expect(screen.getByTestId('gallery-empty-placeholder')).toBeTruthy()
      const icon = screen.getByTestId('gallery-empty-icon')
      expect(icon.props.name).toBe('car-sport-outline')
      expect(screen.getByText('لا توجد صور متاحة لهذا الإعلان')).toBeTruthy()
    })

    const categories: Array<{ category: GalleryCategory; expectedIcon: string }> = [
      { category: 'cars', expectedIcon: 'car-sport-outline' },
      { category: 'buses', expectedIcon: 'bus-outline' },
      { category: 'equipment', expectedIcon: 'construct-outline' },
      { category: 'operators', expectedIcon: 'person-circle-outline' },
      { category: 'parts', expectedIcon: 'hardware-chip-outline' },
      { category: 'services', expectedIcon: 'build-outline' },
    ]

    test.each(categories)(
      'renders correct empty placeholder icon for category "$category"',
      async ({ category, expectedIcon }) => {
        await render(
          <ImageGallery
            images={[]}
            index={0}
            onIndexChange={mockOnIndexChange}
            onPressImage={mockOnPressImage}
            category={category}
          />
        )

        const icon = screen.getByTestId('gallery-empty-icon')
        expect(icon.props.name).toBe(expectedIcon)
      }
    )

    it('honors custom fallbackIcon override when passed', async () => {
      await render(
        <ImageGallery
          images={[]}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
          category="cars"
          fallbackIcon="images-outline"
        />
      )

      const icon = screen.getByTestId('gallery-empty-icon')
      expect(icon.props.name).toBe('images-outline')
    })
  })

  describe('Normal and error rendering with images', () => {
    it('renders gallery slides, counter badge, and dots when images are present', async () => {
      await render(
        <ImageGallery
          images={sampleImages}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
          category="cars"
        />
      )

      expect(screen.getByTestId('image-gallery')).toBeTruthy()
      expect(screen.getByText('1 / 2')).toBeTruthy()
    })

    it('shows category placeholder gracefully on image load error without breaking count or layout', async () => {
      await render(
        <ImageGallery
          images={sampleImages}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
          category="buses"
        />
      )

      const image0 = screen.getByTestId('gallery-image-0')
      expect(image0).toBeTruthy()

      // Trigger onError on the first image
      await act(async () => {
        image0.props.onError({ error: 'Failed to load' })
      })

      // First image should now display the bus-outline fallback placeholder
      expect(screen.getByTestId('gallery-image-fallback-0')).toBeTruthy()
      const fallbackIcon = screen.getByTestId('gallery-image-fallback-icon-0')
      expect(fallbackIcon.props.name).toBe('bus-outline')
      expect(screen.getByText('تعذر تحميل الصورة')).toBeTruthy()

      // Counter remains intact (1 / 2)
      expect(screen.getByText('1 / 2')).toBeTruthy()
    })
  })
})
