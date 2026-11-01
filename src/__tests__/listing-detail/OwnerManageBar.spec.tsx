import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import type { GlassViewProps } from 'expo-glass-effect'
import type { SharedValue } from 'react-native-reanimated'
import { OwnerManageBar, type OwnerActionId } from '../../components/listing-detail/OwnerManageBar'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { dialogService } from '../../store/dialogStore'

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

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
  }
})

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    showOptions: jest.fn(),
  },
}))

interface TestElementNode {
  props?: { style?: unknown; testID?: string; children?: unknown }
  parent: unknown
}

function assertNoOpacityInAncestry(startElement: unknown, rootTestId?: string) {
  let current = startElement as TestElementNode | null
  while (current) {
    const flatStyle = (StyleSheet.flatten(current.props?.style) || {}) as Record<string, unknown>
    expect(flatStyle.opacity).toBeUndefined()
    if (rootTestId && current.props?.testID === rootTestId) {
      break
    }
    current = current.parent as TestElementNode | null
  }
}

describe('OwnerManageBar Glass Conversion Specification', () => {
  const defaultActions = [
    { id: 'edit' as OwnerActionId, label: 'تعديل', tone: 'neutral' as const, icon: 'create-outline' },
    { id: 'pause' as OwnerActionId, label: 'إيقاف مؤقت', tone: 'neutral' as const, icon: 'pause-outline' },
    { id: 'delete' as OwnerActionId, label: 'حذف', tone: 'danger' as const, icon: 'trash-outline' },
  ]

  const MockGlassView: React.ComponentType<GlassViewProps> = (props: GlassViewProps) => (
    <View testID="mock-glass-view" {...props} />
  )

  it('1. Sticky liquid branch renders native GlassView and has no opacity in ancestry', async () => {
    await render(
      <OwnerManageBar
        variant="sticky"
        actions={defaultActions}
        viewCount={250}
        busy={false}
        onAction={jest.fn()}
        scrollY={{ value: 400 } as unknown as SharedValue<number>}
        support={{ kind: 'liquid', GlassView: MockGlassView }}
      />
    )

    const liquidSurface = screen.getByTestId('owner-manage-bar-glass-liquid')
    expect(liquidSurface).toBeTruthy()
    expect(screen.getByTestId('mock-glass-view')).toBeTruthy()
    expect(screen.getByText('إعلانك')).toBeTruthy()

    assertNoOpacityInAncestry(liquidSurface)
  })

  it('2. Sticky blur branch matches exact blur recipe (intensity 70) and has no opacity in ancestry', async () => {
    await render(
      <OwnerManageBar
        variant="sticky"
        actions={defaultActions}
        viewCount={250}
        busy={false}
        onAction={jest.fn()}
        scrollY={{ value: 400 } as unknown as SharedValue<number>}
        support={{ kind: 'blur' }}
      />
    )

    const blurSurface = screen.getByTestId('owner-manage-bar-glass-blur')
    expect(blurSurface).toBeTruthy()

    const blurView = screen.getByTestId('mock-blur-view')
    expect(blurView.props.intensity).toBe(70)
    expect(blurView.props.tint).toBe('light')
    expect(blurView.props.blurMethod).toBe('dimezisBlurView')

    const children = blurSurface.props.children
    const washView = Array.isArray(children) ? children[1] : null
    expect(washView).toBeTruthy()
    const washStyle = StyleSheet.flatten(washView.props.style)
    expect(washStyle.backgroundColor).toBe(BottomBarTokens.stickyCardWashBg)

    assertNoOpacityInAncestry(blurSurface)
  })

  it('3. Sticky variant action buttons fire handlers and manage status opens dialog', async () => {
    const onAction = jest.fn()
    await render(
      <OwnerManageBar
        variant="sticky"
        actions={defaultActions}
        viewCount={250}
        busy={false}
        onAction={onAction}
        scrollY={{ value: 400 } as unknown as SharedValue<number>}
        support={{ kind: 'blur' }}
      />
    )

    const editBtn = screen.getByTestId('btn-owner-edit')
    fireEvent.press(editBtn)
    expect(onAction).toHaveBeenCalledWith('edit')

    const deleteBtn = screen.getByTestId('btn-owner-delete')
    fireEvent.press(deleteBtn)
    expect(onAction).toHaveBeenCalledWith('delete')

    const statusBtn = screen.getByTestId('btn-owner-manage-status')
    fireEvent.press(statusBtn)
    expect(dialogService.showOptions).toHaveBeenCalled()
  })
})
