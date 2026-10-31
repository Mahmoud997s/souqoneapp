import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Text } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Polygon, Path } from 'react-native-svg'
import { VerifiedBadge, VERIFIED_BADGE_3D } from './VerifiedBadge'

describe('VerifiedBadge (3D Royal Octagram Badge)', () => {
  it('renders the 3D Octagram image emblem by default when showText is false', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<VerifiedBadge />)
    })

    const img = renderer.root.findByType(Image)
    expect(img).toBeDefined()
    expect(img.props.source).toEqual(VERIFIED_BADGE_3D)
    expect(img.props.style.width).toBe(17)
    expect(img.props.style.height).toBe(17)

    // No text rendered when showText is false
    const texts = renderer.root.findAllByType(Text)
    expect(texts.length).toBe(0)
  })

  it('renders the SVG Octagram fallback when use3d is false', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<VerifiedBadge size={14} use3d={false} />)
    })

    const svg = renderer.root.findByType(Svg)
    expect(svg).toBeDefined()
    expect(svg.props.width).toBe(14)
    expect(svg.props.height).toBe(14)

    const polygon = renderer.root.findByType(Polygon)
    expect(polygon).toBeDefined()

    const paths = renderer.root.findAllByType(Path)
    expect(paths.length).toBeGreaterThan(0)
  })

  it('renders label and 3D badge when showText is true', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<VerifiedBadge showText text="موثق" variant="dark" />)
    })

    const img = renderer.root.findByType(Image)
    expect(img).toBeDefined()

    const textComp = renderer.root.findByType(Text)
    expect(textComp).toBeDefined()
    expect(textComp.props.children).toBe('موثق')
  })

  it('supports custom text and mint variant', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <VerifiedBadge showText text="معتمد رسمياً" variant="mint" />
      )
    })

    const textComp = renderer.root.findByType(Text)
    expect(textComp.props.children).toBe('معتمد رسمياً')
  })
})
