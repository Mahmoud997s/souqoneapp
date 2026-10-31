import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import {
  ImageGallery,
  GALLERY_CATEGORY_ICONS,
  COMPACT_EMPTY_GALLERY_HEIGHT,
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

  describe('Compact empty gallery strip (D-170c)', () => {
    it('renders compact strip with COMPACT_EMPTY_GALLERY_HEIGHT and no aspectRatio when compactEmptyState is true (Req a)', async () => {
      await render(
        <ImageGallery
          images={[]}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
          category="services"
          compactEmptyState={true}
        />
      )

      const placeholder = screen.getByTestId('gallery-empty-placeholder')
      const flatStyle = StyleSheet.flatten(placeholder.props.style)
      expect(flatStyle.height).toBe(COMPACT_EMPTY_GALLERY_HEIGHT)
      expect(flatStyle.aspectRatio).toBeUndefined()
      const icon = screen.getByTestId('gallery-empty-icon')
      expect(icon.props.size).toBe(32)
      expect(icon.props.name).toBe('build-outline')
    })

    it('renders standard 16/11 placeholder when compactEmptyState is false or omitted (Req b)', async () => {
      await render(
        <ImageGallery
          images={[]}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
          category="cars"
        />
      )

      const placeholder = screen.getByTestId('gallery-empty-placeholder')
      const flatStyle = StyleSheet.flatten(placeholder.props.style)
      expect(flatStyle.aspectRatio).toBeCloseTo(16 / 11)
      expect(flatStyle.height).toBeUndefined()
      const icon = screen.getByTestId('gallery-empty-icon')
      expect(icon.props.size).toBe(64)
    })

    it('renders normal swiper with aspectRatio when images are present regardless of compactEmptyState (Req c)', async () => {
      await render(
        <ImageGallery
          images={sampleImages}
          index={0}
          onIndexChange={mockOnIndexChange}
          onPressImage={mockOnPressImage}
          category="parts"
          compactEmptyState={true}
        />
      )

      const gallery = screen.getByTestId('image-gallery')
      const flatStyle = StyleSheet.flatten(gallery.props.style)
      expect(flatStyle.aspectRatio).toBeCloseTo(16 / 11)
      expect(screen.getByText('1 / 2')).toBeTruthy()
    })

    it('verifies compactEmptyState call sites: Parts and Services pass it, Cars/Buses/Equipment do not (Req d)', () => {
      const fs = require('fs')
      const path = require('path')

      const readScreen = (relPath: string) =>
        fs.readFileSync(path.resolve(__dirname, '../../../..', relPath), 'utf8')

      const parts = readScreen('src/screens/parts/PartDetailScreen.tsx')
      const services = readScreen('src/screens/services/ServiceDetailScreen.tsx')
      const cars = readScreen('src/screens/cars/CarDetailScreen.tsx')
      const buses = readScreen('src/screens/buses/BusDetailScreen.tsx')
      const equip = readScreen('src/screens/equipment/EquipmentDetailScreen.tsx')

      expect(parts).toMatch(/<ImageGallery[\s\S]*?compactEmptyState={?true}?/)
      expect(services).toMatch(/<ImageGallery[\s\S]*?compactEmptyState={?true}?/)
      expect(cars).not.toMatch(/compactEmptyState/)
      expect(buses).not.toMatch(/compactEmptyState/)
      expect(equip).not.toMatch(/compactEmptyState/)
    })
  })
})
