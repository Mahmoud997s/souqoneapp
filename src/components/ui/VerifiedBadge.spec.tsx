import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Text } from 'react-native'
import { VerifiedBadge } from './VerifiedBadge'
import Svg, { Polygon, Path } from 'react-native-svg'

describe('VerifiedBadge (The Royal Octagram Seal)', () => {
  it('renders the SVG Octagram emblem when showText is false', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<VerifiedBadge size={14} />)
    })

    const svg = renderer.root.findByType(Svg)
    expect(svg).toBeDefined()
    expect(svg.props.width).toBe(14)
    expect(svg.props.height).toBe(14)

    const polygon = renderer.root.findByType(Polygon)
    expect(polygon).toBeDefined()

    const paths = renderer.root.findAllByType(Path)
    expect(paths.length).toBeGreaterThan(0)

    // No text rendered when showText is false
    const texts = renderer.root.findAllByType(Text)
    expect(texts.length).toBe(0)
  })

  it('renders label and seal when showText is true', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<VerifiedBadge showText text="موثق" variant="dark" />)
    })

    const svg = renderer.root.findByType(Svg)
    expect(svg).toBeDefined()

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
