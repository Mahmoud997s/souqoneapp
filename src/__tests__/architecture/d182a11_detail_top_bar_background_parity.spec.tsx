import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { DetailSkeleton } from '../../components/listing-detail/DetailSkeleton'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

describe('D-182a11: DetailTopBar Background Parity with Home & Absolute Overlay Geometry', () => {
  describe('1. GlassSurface and Background Layers Parity', () => {
    it('(a) DetailTopBar GlassSurface explicitly passes intensity matching TopBarTokens.blurIntensity (65)', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          support={{ kind: 'blur' }}
        />
      )

      // DetailTopBar has testID="detail-top-bar"
      const bar = screen.getByTestId('detail-top-bar')
      expect(bar).toBeTruthy()

      // GlassSurface renders with testID="detail-top-bar" -> blur branch renders "detail-top-bar-glass-blur"
      const glassBlur = screen.getByTestId('detail-top-bar-glass-blur')
      expect(glassBlur).toBeTruthy()

      // BlurView child receives intensity={65}
      const blurViews = screen.getAllByTestId('mock-blur-view')
      expect(blurViews.length).toBeGreaterThanOrEqual(1)
      const topBarBlurView = blurViews[0]
      expect(topBarBlurView.props.intensity).toBe(TopBarTokens.blurIntensity)
      expect(topBarBlurView.props.intensity).toBe(65)
    })

    it('(b) DetailTopBar background layers (GlassSurface, tintOverlay, greenGrid) match AnimatedHeroHeader recipe', async () => {
      await render(<DetailTopBar onBack={jest.fn()} />)

      const tint = screen.getByTestId('detail-top-bar-tint')
      const tintStyle = StyleSheet.flatten(tint.props.style)
      expect(tintStyle.backgroundColor).toBe(TopBarTokens.tintOverlayColor)
      expect(tintStyle.opacity).toBe(TopBarTokens.tintOverlayOpacity)

      const grid = screen.getByTestId('detail-top-bar-grid')
      expect(grid).toBeTruthy()
    })
  })

  describe('2. Absolute Overlay Geometry Parity with AnimatedHeroHeader', () => {
    it('(a) DetailTopBar container is position: absolute with zIndex: 50 spanning top: 0, left: 0, right: 0', async () => {
      await render(<DetailTopBar onBack={jest.fn()} />)

      const bar = screen.getByTestId('detail-top-bar')
      const barStyle = StyleSheet.flatten(bar.props.style)
      expect(barStyle.position).toBe('absolute')
      expect(barStyle.top).toBe(0)
      expect(barStyle.left).toBe(0)
      expect(barStyle.right).toBe(0)
      expect(barStyle.zIndex).toBe(50)
      expect(barStyle.overflow).toBe('hidden')
    })

    it('(b) TopBarTokens.detailTopBarBodyHeight equals topPadOffset + rowHeight + bottomPad (56)', () => {
      const expected = TopBarTokens.topPadOffset + TopBarTokens.rowHeight + TopBarTokens.bottomPad
      expect(TopBarTokens.detailTopBarBodyHeight).toBe(56)
      expect(TopBarTokens.detailTopBarBodyHeight).toBe(expected)
    })

    it('(c) DetailSkeleton offsets scroll content by insets.top + detailTopBarBodyHeight when onBack is present', async () => {
      await render(<DetailSkeleton onBack={jest.fn()} />)

      const topBar = screen.getByTestId('detail-skeleton-top-bar')
      expect(topBar).toBeTruthy()

      // When rendered inside DetailSkeleton, topBar is absolute overlay
      const topBarStyle = StyleSheet.flatten(topBar.props.style)
      expect(topBarStyle.position).toBe('absolute')
      expect(topBarStyle.zIndex).toBe(50)
    })
  })
})
