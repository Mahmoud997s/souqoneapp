import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import { ContactActions } from '../../components/listing-detail/ContactActions'
import { OwnerManageBar } from '../../components/listing-detail/OwnerManageBar'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import type { SellerView } from '../../types/carDetailViewModel.types'
import type { SharedValue } from 'react-native-reanimated'

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock react-native-reanimated interpolate
jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    interpolate: jest.fn((_val: number, _inRange: number[], outRange: number[]) => outRange[outRange.length - 1] ?? 0),
  }
})

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
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

describe('D-175b Pre-Change Characterization Tests (Geometry & Behavior Baseline)', () => {
  const mockSeller: SellerView = {
    id: 'seller-456',
    name: 'سالم المعمري',
    username: 'salim_m',
    avatarUrl: 'https://example.com/avatar.jpg',
    isVerified: true,
    memberSinceLabel: 'عضو منذ يناير 2021',
    accountType: 'تاجر موثوق',
  }

  describe('1. SellerCard baseline geometry & handlers', () => {
    it('(a) wrapper and avatar geometry match tokens', async () => {
      const onPressProfile = jest.fn()
      await render(<SellerCard seller={mockSeller} onPressProfile={onPressProfile} />)

      const touchable = screen.getByTestId('seller-card-touchable')
      const touchStyle = StyleSheet.flatten(touchable.props.style)
      expect(touchStyle.marginHorizontal).toBe(Spacing.space4) // 16
      expect(touchStyle.marginVertical).toBe(Spacing.space2) // 6
      expect(touchStyle.borderRadius).toBe(Radius.lg) // 16
      expect(touchStyle.overflow).toBe('hidden')

      fireEvent.press(touchable)
      expect(onPressProfile).toHaveBeenCalledWith('seller-456')
    })

    it('(b) renders verified badge and member since label', async () => {
      await render(<SellerCard seller={mockSeller} onPressProfile={jest.fn()} />)
      expect(screen.getByText('سالم المعمري')).toBeTruthy()
      expect(screen.getByText('عضو منذ يناير 2021')).toBeTruthy()
      expect(screen.getByText('تاجر موثوق')).toBeTruthy()
    })
  })

  describe('2. ContactActions baseline geometry & handlers', () => {
    it('(a) inline variant buttons have height 42, radius md, and brand colors', async () => {
      const onCall = jest.fn()
      const onWhatsApp = jest.fn()
      const onChat = jest.fn()

      await render(
        <ContactActions
          variant="inline"
          availability={{ mode: 'full' }}
          busy={false}
          onCall={onCall}
          onWhatsApp={onWhatsApp}
          onChat={onChat}
        />
      )

      const callBtn = screen.getByTestId('btn-contact-call')
      const callStyle = StyleSheet.flatten(callBtn.props.style)
      expect(callStyle.height).toBe(42)
      expect(callStyle.borderRadius).toBe(Radius.md) // 8
      expect(callStyle.backgroundColor).toBe(Colors.primary)

      const waBtn = screen.getByTestId('btn-contact-whatsapp')
      const waStyle = StyleSheet.flatten(waBtn.props.style)
      expect(waStyle.height).toBe(42)
      expect(waStyle.borderRadius).toBe(Radius.md)
      expect(waStyle.backgroundColor).toBe('#25D366')

      const chatBtn = screen.getByTestId('btn-contact-chat')
      const chatStyle = StyleSheet.flatten(chatBtn.props.style)
      expect(chatStyle.height).toBe(42)
      expect(chatStyle.borderRadius).toBe(Radius.md)
    })

    it('(b) sticky variant renders blur view with intensity 70', async () => {
      await render(
        <ContactActions
          variant="sticky"
          availability={{ mode: 'full' }}
          busy={false}
          onCall={jest.fn()}
          onWhatsApp={jest.fn()}
          onChat={jest.fn()}
          scrollY={{ value: 400 } as unknown as SharedValue<number>}
          support={{ kind: 'blur' }}
        />
      )

      const blur = screen.getByTestId('mock-blur-view')
      expect(blur.props.intensity).toBe(70)
      expect(blur.props.tint).toBe('light')
      expect(blur.props.blurMethod).toBe('dimezisBlurView')
    })
  })

  describe('3. OwnerManageBar baseline geometry & handlers', () => {
    const defaultActions = [
      { id: 'edit' as const, label: 'تعديل', tone: 'neutral' as const, icon: 'create-outline' },
      { id: 'pause' as const, label: 'إيقاف مؤقت', tone: 'neutral' as const, icon: 'pause-outline' },
      { id: 'delete' as const, label: 'حذف', tone: 'danger' as const, icon: 'trash-outline' },
    ]

    it('(a) inline variant renders edit, pause, and delete buttons', async () => {
      const onAction = jest.fn()
      await render(
        <OwnerManageBar
          variant="inline"
          actions={defaultActions}
          viewCount={154}
          busy={false}
          onAction={onAction}
        />
      )

      expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-pause')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
      expect(screen.getByText('154 مشاهدة')).toBeTruthy()

      const editBtn = screen.getByTestId('btn-owner-edit')
      fireEvent.press(editBtn)
      expect(onAction).toHaveBeenCalledWith('edit')
    })

    it('(b) sticky variant renders blur view with intensity 70 and owner badge', async () => {
      const onAction = jest.fn()
      await render(
        <OwnerManageBar
          variant="sticky"
          actions={defaultActions}
          viewCount={154}
          busy={false}
          onAction={onAction}
          scrollY={{ value: 400 } as unknown as SharedValue<number>}
          support={{ kind: 'blur' }}
        />
      )

      const blur = screen.getByTestId('mock-blur-view')
      expect(blur.props.intensity).toBe(70)
      expect(blur.props.tint).toBe('light')
      expect(blur.props.blurMethod).toBe('dimezisBlurView')
      expect(screen.getByText('إعلانك')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
      expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
    })
  })
})
