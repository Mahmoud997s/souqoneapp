import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Text, TouchableOpacity } from 'react-native'
import { SellerCard } from './SellerCard'
import type { SellerView } from '../../types/carDetailViewModel.types'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-image', () => ({
  Image: 'Image',
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

describe('SellerCard RTL & Rendering', () => {
  const mockSeller: SellerView = {
    id: 'user-123',
    name: 'أحمد البلوشي',
    username: 'ahmed_b',
    avatarUrl: 'https://example.com/avatar.jpg',
    isVerified: true,
    memberSinceLabel: 'عضو منذ مايو 2022',
    accountType: 'معرض معتمد',
  }

  test('renders seller name, memberSinceLabel, and accountType badge', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <SellerCard seller={mockSeller} onPressProfile={jest.fn()} />
      )
    })

    const root = renderer.root
    const textNodes = root.findAllByType(Text)
    const textContents = textNodes.map((n: any) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : n.props.children
    )

    expect(textContents).toContain('أحمد البلوشي')
    expect(textContents).toContain('عضو منذ مايو 2022')
    expect(textContents).toContain('معرض معتمد')
  })

  test('membershipText has writingDirection rtl and textAlign left', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <SellerCard seller={mockSeller} onPressProfile={jest.fn()} />
      )
    })

    const root = renderer.root
    const textNodes = root.findAllByType(Text)
    const membershipNode = textNodes.find(
      (n: any) => n.props.children === 'عضو منذ مايو 2022'
    )

    expect(membershipNode).toBeDefined()
    expect(membershipNode.props.style).toEqual(
      expect.objectContaining({
        writingDirection: 'rtl',
        textAlign: 'left',
      })
    )
  })

  test('nameText and accountBadgeText have writingDirection rtl and textAlign left', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <SellerCard seller={mockSeller} onPressProfile={jest.fn()} />
      )
    })

    const root = renderer.root
    const textNodes = root.findAllByType(Text)

    const nameNode = textNodes.find(
      (n: any) => n.props.children === 'أحمد البلوشي'
    )
    expect(nameNode).toBeDefined()
    expect(nameNode.props.style).toEqual(
      expect.objectContaining({
        writingDirection: 'rtl',
        textAlign: 'left',
      })
    )

    const badgeNode = textNodes.find(
      (n: any) => n.props.children === 'معرض معتمد'
    )
    expect(badgeNode).toBeDefined()
    expect(badgeNode.props.style).toEqual(
      expect.objectContaining({
        writingDirection: 'rtl',
        textAlign: 'left',
      })
    )
  })

  test('fires onPressProfile with seller.id when clicked', () => {
    const onPressMock = jest.fn()
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <SellerCard seller={mockSeller} onPressProfile={onPressMock} />
      )
    })

    const root = renderer.root
    const touchable = root.findByType(TouchableOpacity)
    act(() => {
      touchable.props.onPress()
    })

    expect(onPressMock).toHaveBeenCalledTimes(1)
    expect(onPressMock).toHaveBeenCalledWith('user-123')
  })
})
