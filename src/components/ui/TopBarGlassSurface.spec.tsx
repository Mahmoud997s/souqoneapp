import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TopBarTokens } from '../../constants/topBarTokens'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { AppHeader } from './AppHeader'

jest.mock('../navigation/glassSupport', () => ({ GlassSurface: 'GlassSurface' }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))

describe('TopBarGlassSurface', () => {
  test('places the fixed iceGlass backing before the real glass surface', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <TopBarGlassSurface testID="ice-control" kind="ice-control" borderRadius={19} />
      )
    })

    const tree = renderer!.toJSON() as { children: Array<{ props: { testID?: string } }> }
    const backing = renderer!.root.findByProps({ testID: 'ice-control-backing' })
    const glass = renderer!.root.findByType('GlassSurface' as never)
    expect(tree.children.map((node) => node.props.testID)).toEqual([
      'ice-control-backing',
      'ice-control-glass',
    ])
    expect(backing.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: TopBarTokens.iceGlass, borderRadius: 19 }),
    ]))
    expect(glass.props).toMatchObject({ washColor: TopBarTokens.iceGlass, borderRadius: 19 })
  })

  test('keeps glass outside any reduced-opacity ancestor', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <AppHeader theme="light" glassBackground />
      )
    })

    const glass = renderer!.root.findByType('GlassSurface' as never)
    let ancestor = glass.parent
    while (ancestor) {
      const styles = Array.isArray(ancestor.props.style) ? ancestor.props.style.flat(Infinity) : [ancestor.props.style]
      expect(styles).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ opacity: expect.any(Number) }),
      ]))
      ancestor = ancestor.parent
    }
  })
})
