import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import type { GlassViewProps } from 'expo-glass-effect'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import type { SellerView } from '../../types/carDetailViewModel.types'

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: ({ children, ...props }: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }, children),
  }
})

// Mock expo-image
jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-expo-image', ...props }),
  }
})

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
  }
})

interface TestElementNode {
  props?: { style?: unknown; testID?: string; children?: unknown }
  parent: unknown
}

function assertNoOpacityInAncestry(startElement: unknown, rootTestId: string) {
  let current = startElement as TestElementNode | null
  while (current) {
    const flatStyle = (StyleSheet.flatten(current.props?.style) || {}) as Record<string, unknown>
    expect(flatStyle.opacity).toBeUndefined()
    if (current.props?.testID === rootTestId) {
      break
    }
    current = current.parent as TestElementNode | null
  }
}

describe('SellerCard Glass Conversion Specification', () => {
  const mockSeller: SellerView = {
    id: 'seller-789',
    name: 'سالم الكعبي',
    username: 'salim_k',
    avatarUrl: 'https://example.com/avatar.jpg',
    isVerified: true,
    memberSinceLabel: 'عضو منذ 2020',
    accountType: 'معرض معتمد',
  }

  const MockGlassView: React.ComponentType<GlassViewProps> = (props: GlassViewProps) => (
    <View testID="mock-glass-view" {...props} />
  )

  it('1. Liquid branch renders native GlassView and has no opacity in ancestry', async () => {
    const onPressProfile = jest.fn()
    await render(
      <SellerCard
        seller={mockSeller}
        onPressProfile={onPressProfile}
        support={{ kind: 'liquid', GlassView: MockGlassView }}
      />
    )

    const touchable = screen.getByTestId('seller-card-touchable')
    const touchStyle = StyleSheet.flatten(touchable.props.style)
    expect(touchStyle.marginHorizontal).toBe(Spacing.space4)
    expect(touchStyle.borderRadius).toBe(Radius.lg)

    const liquidSurface = screen.getByTestId('seller-card-glass-liquid')
    expect(liquidSurface).toBeTruthy()
    expect(screen.getByTestId('mock-glass-view')).toBeTruthy()

    assertNoOpacityInAncestry(liquidSurface, 'seller-card-container')

    fireEvent.press(touchable)
    expect(onPressProfile).toHaveBeenCalledWith('seller-789')
  })

  it('2. Blur branch matches exact blur recipe (intensity 70) and has no opacity in ancestry', async () => {
    await render(
      <SellerCard
        seller={mockSeller}
        onPressProfile={jest.fn()}
        support={{ kind: 'blur' }}
      />
    )

    const blurSurface = screen.getByTestId('seller-card-glass-blur')
    expect(blurSurface).toBeTruthy()

    const blurView = screen.getByTestId('mock-blur-view')
    expect(blurView.props.intensity).toBe(70)
    expect(blurView.props.tint).toBe('light')
    expect(blurView.props.blurMethod).toBe('dimezisBlurView')

    const children = blurSurface.props.children
    const washView = Array.isArray(children) ? children[1] : null
    expect(washView).toBeTruthy()
    const washStyle = StyleSheet.flatten(washView.props.style)
    expect(washStyle.backgroundColor).toBe(BottomBarTokens.whiteWashBg)

    assertNoOpacityInAncestry(blurSurface, 'seller-card-container')
  })

  it('3. Behavior and elements match baseline', async () => {
    await render(<SellerCard seller={mockSeller} onPressProfile={jest.fn()} />)
    expect(screen.getByText('سالم الكعبي')).toBeTruthy()
    expect(screen.getByText('عضو منذ 2020')).toBeTruthy()
    expect(screen.getByText('معرض معتمد')).toBeTruthy()
  })
})
