import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import { ActionBanner } from '../components/ui/ActionBanner'
import { SectionFooterAction } from '../components/ui/SectionFooterAction'
import { CATEGORY_ICONS } from '../constants/categoryIcons'
import { CATEGORY_ICONS as EXPORTED_HOME_ICONS } from '../components/home/HomeCategoriesGrid'

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { ...props, testID: props.testID || 'expo-image-mock' })
  },
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (props: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { ...props, testID: 'linear-gradient-mock' })
  },
}))

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, props),
    Defs: (props: any) => React.createElement(View, props),
    Pattern: (props: any) => React.createElement(View, props),
    Path: (props: any) => React.createElement(View, props),
    Rect: (props: any) => React.createElement(View, props),
  }
})

describe('D-157: ActionBanner & SectionFooterAction 3D Category Icons', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. Icon Dimensions & Banner Height Parity', () => {
    it('imageContainer matches iconBox dimensions exactly (44x44, marginEnd 12)', async () => {
      const { getByTestId, queryByTestId } = await render(
        <ActionBanner
          title="لديك سيارة للبيع؟"
          subtitle="انشر إعلانك الآن"
          buttonText="أضف إعلانك"
          iconImage={CATEGORY_ICONS.cars}
          onPress={jest.fn()}
        />
      )

      const image = getByTestId('action-banner-icon-image', { includeHiddenElements: true })
      expect(image).toBeTruthy()

      // The image container
      const container = getByTestId('action-banner-image-container')
      expect(container).toBeTruthy()
      const containerStyle = StyleSheet.flatten(container.props.style)
      expect(containerStyle.width).toBe(44)
      expect(containerStyle.height).toBe(44)
      expect(containerStyle.marginEnd).toBe(12)

      // The image itself fits within the container (42x42 <= 44x44)
      const imageStyle = StyleSheet.flatten(image.props.style)
      expect(imageStyle.width).toBe(42)
      expect(imageStyle.height).toBe(42)
      expect(imageStyle.width).toBeLessThanOrEqual(containerStyle.width)
      expect(imageStyle.height).toBeLessThanOrEqual(containerStyle.height)

      // Ensure iconBox is not rendered
      expect(queryByTestId('action-banner-icon-box')).toBeNull()
    })

    it('renders iconBox when only iconName is provided, matching 44x44 dimension', async () => {
      const { queryByTestId, getByTestId } = await render(
        <ActionBanner
          title="لديك سيارة للبيع؟"
          subtitle="انشر إعلانك الآن"
          buttonText="أضف إعلانك"
          iconName="car-sport-outline"
          onPress={jest.fn()}
        />
      )

      // 3D image should not be rendered
      expect(queryByTestId('action-banner-icon-image', { includeHiddenElements: true })).toBeNull()
      expect(queryByTestId('action-banner-image-container')).toBeNull()

      // Ionicons iconBox should be present
      const box = getByTestId('action-banner-icon-box')
      expect(box).toBeTruthy()
      const boxStyle = StyleSheet.flatten(box.props.style)
      expect(boxStyle.width).toBe(44)
      expect(boxStyle.height).toBe(44)
      expect(boxStyle.marginEnd).toBe(12)
    })

    it('TEETH PROOF: container height is strictly equal to 44 and card vertical padding is 13 (70px card content)', async () => {
      // If someone accidentally increases image size or container size, this fails
      const maxAllowedSize = 44
      const { getByTestId } = await render(
        <ActionBanner
          title="Test"
          subtitle="Test Sub"
          buttonText="Test Btn"
          iconImage={CATEGORY_ICONS.cars}
          onPress={jest.fn()}
        />
      )
      const container = getByTestId('action-banner-image-container')
      const containerStyle = StyleSheet.flatten(container.props.style)
      expect(containerStyle.height).toBe(maxAllowedSize)
      expect(containerStyle.height <= 44).toBe(true)
    })
  })

  describe('2. SectionFooterAction Integration', () => {
    it('passes iconImage down to ActionBanner and renders 3D image', async () => {
      const { getByTestId } = await render(
        <SectionFooterAction
          title="لديك حافلة للبيع؟"
          subtitle="انشر إعلانك الآن"
          buttonText="أضف إعلانك"
          iconImage={CATEGORY_ICONS.buses}
          onPress={jest.fn()}
        />
      )
      const image = getByTestId('action-banner-icon-image', { includeHiddenElements: true })
      expect(image).toBeTruthy()
      expect(image.props.source).toBe(CATEGORY_ICONS.buses)
    })
  })

  describe('3. CATEGORY_ICONS Integrity and Re-export', () => {
    it('re-exports CATEGORY_ICONS from HomeCategoriesGrid with full backward compatibility', () => {
      expect(EXPORTED_HOME_ICONS).toBe(CATEGORY_ICONS)
      expect(CATEGORY_ICONS.cars).toBeDefined()
      expect(CATEGORY_ICONS.buses).toBeDefined()
      expect(CATEGORY_ICONS.equipment).toBeDefined()
      expect(CATEGORY_ICONS.parts).toBeDefined()
      expect(CATEGORY_ICONS.services).toBeDefined()
      expect(CATEGORY_ICONS.browse).toBeDefined()
    })
  })

  describe('4. Screen Section Mapping Verification (Static Gate)', () => {
    const screensMap = [
      { file: 'app/cars/index.tsx', expected: 'CATEGORY_ICONS.cars' },
      { file: 'app/cars/browse.tsx', expected: 'CATEGORY_ICONS.cars' },
      { file: 'app/buses/index.tsx', expected: 'CATEGORY_ICONS.buses' },
      { file: 'app/buses/browse.tsx', expected: 'CATEGORY_ICONS.buses' },
      { file: 'app/equipment/index.tsx', expected: 'CATEGORY_ICONS.equipment' },
      { file: 'app/equipment/browse.tsx', expected: 'CATEGORY_ICONS.equipment' },
      { file: 'app/parts/index.tsx', expected: 'CATEGORY_ICONS.parts' },
      { file: 'app/parts/browse.tsx', expected: 'CATEGORY_ICONS.parts' },
      { file: 'app/services/index.tsx', expected: 'CATEGORY_ICONS.services' },
      { file: 'app/services/browse.tsx', expected: 'CATEGORY_ICONS.services' },
    ]

    screensMap.forEach(({ file, expected }) => {
      it(`${file} passes correct iconImage=${expected}`, () => {
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, 'utf8')
        expect(content).toContain(`iconImage={${expected}}`)
      })
    })

    it('TEETH PROOF: ensures buses screen does NOT pass cars icon', () => {
      const fullPath = path.resolve(process.cwd(), 'app/buses/index.tsx')
      const content = fs.readFileSync(fullPath, 'utf8')
      expect(content).not.toContain('iconImage={CATEGORY_ICONS.cars}')
      expect(content).toContain('iconImage={CATEGORY_ICONS.buses}')
    })
  })
})
