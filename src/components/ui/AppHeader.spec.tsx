import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { View } from 'react-native'
import { AppHeader } from './AppHeader'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }))
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Defs: 'Defs',
  Pattern: 'Pattern',
  Path: 'Path',
  Rect: 'Rect',
}))
jest.mock('./TopBarGlassSurface', () => ({
  TopBarGlassSurface: ({ testID }: { testID: string }) => <>{testID}</>,
}))

describe('AppHeader glass opt-in', () => {
  test('keeps the existing light header style for callers without the opt-in', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<AppHeader theme="light" title="Profile" />)
    })

    const header = renderer!.root.findByType(View)
    const style = header.props.style.flat(Infinity)
    expect(style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: expect.any(String), borderBottomWidth: 1 }),
    ]))
    expect(renderer!.root.findAll((node) => node.props.testID === 'browse-header-layers')).toHaveLength(0)
  })

  test('renders glass only when explicitly requested', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<AppHeader theme="light" glassBackground />)
    })

    expect(renderer!.root.findAll((node) => node.children.includes('browse-header'))).toHaveLength(1)
  })
})
