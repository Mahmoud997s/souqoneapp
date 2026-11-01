import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import TestRenderer, { act } from 'react-test-renderer'
import fs from 'fs'
import path from 'path'
import { GlassNavBar, type GlassNavBarAction } from '../../components/ui/GlassNavBar'
import type { GlassViewProps } from 'expo-glass-effect'

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

// Mock expo-glass-effect
const MockGlassView: React.ComponentType<GlassViewProps> = (props: GlassViewProps) =>
  React.createElement(View, { testID: 'mock-glass-view', ...props })

jest.mock('expo-glass-effect', () => ({
  GlassView: MockGlassView,
  GlassContainer: MockGlassView,
  isLiquidGlassAvailable: () => true,
  isGlassEffectAPIAvailable: () => true,
}))

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
  }
})

function assertNoOpacityInAncestry(startElement: any, stopAtTestId?: string) {
  let current = startElement
  while (current) {
    if (current.props) {
      if (stopAtTestId && current.props.testID === stopAtTestId) {
        break
      }
      if (current.props.style) {
        const flat = StyleSheet.flatten(current.props.style)
        if (flat && typeof flat.opacity === 'number' && flat.opacity < 1) {
          throw new Error(
            `Opacity ancestor detected! Found opacity=${flat.opacity} on element testID=${current.props.testID || 'unknown'}`
          )
        }
      }
    }
    current = current.parent
  }
}

describe('D-175d Characterization Tests: GlassNavBar Geometry & Props API', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. Fixed container geometry and modifiers', () => {
    it('(a) applies paddingTop, absolute positioning, 1px bottom border, and horizontal padding', async () => {
      const { getByText, getByLabelText } = await render(
        <GlassNavBar
          title="الملف الشخصي"
          paddingTop={48}
          onBackPress={jest.fn()}
        />
      )

      const titleText = getByText('الملف الشخصي')
      expect(titleText).toBeTruthy()

      const backBtn = getByLabelText('رجوع')
      const row = backBtn.parent
      const container = row?.parent
      expect(container).toBeTruthy()

      const style = StyleSheet.flatten(container?.props.style)
      expect(style.position).toBe('absolute')
      expect(style.top).toBe(0)
      expect(style.left).toBe(0)
      expect(style.right).toBe(0)
      expect(style.zIndex).toBe(100)
      expect(style.overflow).toBe('hidden')
      expect(style.paddingTop).toBe(48)
      expect(style.paddingHorizontal).toBe(16)
      expect(style.paddingBottom).toBe(8)
      expect(style.borderBottomWidth).toBe(1)
      expect(style.borderBottomColor).toBe('rgba(255,255,255,0.5)')
    })

    it('(b) hideBottomBorder resets borderBottomWidth to 0', async () => {
      const { getByLabelText } = await render(
        <GlassNavBar
          title="شاشة بدون حد"
          paddingTop={44}
          onBackPress={jest.fn()}
          hideBottomBorder={true}
        />
      )

      const backBtn = getByLabelText('رجوع')
      const container = backBtn.parent?.parent
      const style = StyleSheet.flatten(container?.props.style)
      expect(style.borderBottomWidth).toBe(0)
    })

    it('(c) isTransparent renders transparent container without blur', async () => {
      const { getByLabelText, queryByTestId } = await render(
        <GlassNavBar
          title="شاشة شفافة"
          paddingTop={44}
          onBackPress={jest.fn()}
          isTransparent={true}
        />
      )

      const backBtn = getByLabelText('رجوع')
      const container = backBtn.parent?.parent
      const style = StyleSheet.flatten(container?.props.style)
      expect(style.backgroundColor).toBe('transparent')
      expect(queryByTestId('glass-nav-bar-surface-glass-blur')).toBeNull()
      expect(queryByTestId('glass-nav-bar-surface-glass-liquid')).toBeNull()
    })
  })

  describe('2. Controls geometry and typography', () => {
    it('(a) back button has exact 38x38 dimensions, radius 12, 1px border, and translucent white background', async () => {
      const { getByLabelText } = await render(
        <GlassNavBar
          title="الرجوع"
          paddingTop={44}
          onBackPress={jest.fn()}
        />
      )

      const backBtn = getByLabelText('رجوع')
      const style = StyleSheet.flatten(backBtn.props.style)
      expect(style.width).toBe(38)
      expect(style.height).toBe(38)
      expect(style.borderRadius).toBe(12)
      expect(style.backgroundColor).toBe('rgba(255,255,255,0.7)')
      expect(style.borderWidth).toBe(1)
      expect(style.borderColor).toBe('rgba(255,255,255,0.8)')
    })

    it('(b) title badge has flex: 1, height 38, radius 12, and exact Almarai typography', async () => {
      const { getByText } = await render(
        <GlassNavBar
          title="إضافة بطاقة مهنية"
          paddingTop={44}
          onBackPress={jest.fn()}
        />
      )

      const title = getByText('إضافة بطاقة مهنية')
      const titleStyle = StyleSheet.flatten(title.props.style)
      expect(titleStyle.fontFamily).toBe('Almarai_800ExtraBold')
      expect(titleStyle.fontSize).toBe(14)
      expect(titleStyle.lineHeight).toBe(19)
      expect(titleStyle.color).toBe('#1E293B')
      expect(titleStyle.textAlign).toBe('center')
      expect(titleStyle.writingDirection).toBe('rtl')

      const badge = title.parent
      const badgeStyle = StyleSheet.flatten(badge?.props.style)
      expect(badgeStyle.flex).toBe(1)
      expect(badgeStyle.height).toBe(38)
      expect(badgeStyle.borderRadius).toBe(12)
      expect(badgeStyle.backgroundColor).toBe('rgba(255,255,255,0.7)')
      expect(badgeStyle.borderWidth).toBe(1)
      expect(badgeStyle.borderColor).toBe('rgba(255,255,255,0.8)')
      expect(badgeStyle.paddingHorizontal).toBe(12)
    })

    it('(c) empty actions array renders 38x38 placeholder to keep title centered', async () => {
      const { getByLabelText } = await render(
        <GlassNavBar
          title="بدون أزرار"
          paddingTop={44}
          onBackPress={jest.fn()}
          actions={[]}
        />
      )

      const backBtn = getByLabelText('رجوع')
      const row = backBtn.parent
      const children = row?.props.children
      expect(children).toHaveLength(3)

      const placeholder = children[2]
      const placeholderStyle = StyleSheet.flatten(placeholder.props.style)
      expect(placeholderStyle.width).toBe(38)
      expect(placeholderStyle.height).toBe(38)
    })
  })

  describe('3. Actions interaction and states', () => {
    it('(a) triggers onBackPress when back button is pressed', () => {
      const onBackPress = jest.fn()
      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <GlassNavBar
            title="اختبار الرجوع"
            paddingTop={44}
            onBackPress={onBackPress}
          />
        )
      })

      const backBtn = tree!.root.findByProps({ accessibilityLabel: 'رجوع' })
      act(() => {
        backBtn.props.onPress()
      })
      expect(onBackPress).toHaveBeenCalledTimes(1)
    })

    it('(b) renders custom actions with testID, icon, and handles press', () => {
      const handleAction1 = jest.fn()
      const handleAction2 = jest.fn()

      const actions: GlassNavBarAction[] = [
        {
          icon: 'share-social-outline',
          onPress: handleAction1,
          accessibilityLabel: 'مشاركة',
          testID: 'action-share',
        },
        {
          icon: 'heart-outline',
          onPress: handleAction2,
          accessibilityLabel: 'تفضيل',
          testID: 'action-fav',
        },
      ]

      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <GlassNavBar
            title="شاشة مع أكشنز"
            paddingTop={44}
            onBackPress={jest.fn()}
            actions={actions}
          />
        )
      })

      const shareBtn = tree!.root.findByProps({ testID: 'action-share' })
      const favBtn = tree!.root.findByProps({ testID: 'action-fav' })

      act(() => {
        shareBtn.props.onPress()
      })
      expect(handleAction1).toHaveBeenCalledTimes(1)

      act(() => {
        favBtn.props.onPress()
      })
      expect(handleAction2).toHaveBeenCalledTimes(1)
    })

    it('(c) disabled action button is not clickable and applies opacity 0.6', () => {
      const handleDisabled = jest.fn()
      const actions: GlassNavBarAction[] = [
        {
          icon: 'checkmark-outline',
          onPress: handleDisabled,
          accessibilityLabel: 'حفظ',
          testID: 'action-save',
          disabled: true,
        },
      ]

      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <GlassNavBar
            title="شاشة مع زر معطل"
            paddingTop={44}
            onBackPress={jest.fn()}
            actions={actions}
          />
        )
      })

      const saveBtn = tree!.root.findByProps({ testID: 'action-save' })
      expect(saveBtn.props.disabled).toBe(true)

      const style = StyleSheet.flatten(saveBtn.props.style)
      expect(style.opacity).toBe(0.6)
    })
  })

  describe('4. GlassSurface Dual Branching & Ancestry Opacity', () => {
    it('(a) Liquid branch renders GlassView and has no opacity in ancestry', async () => {
      const { getByTestId } = await render(
        <GlassNavBar
          title="شاشة ليكويد"
          paddingTop={44}
          onBackPress={jest.fn()}
          support={{ kind: 'liquid', GlassView: MockGlassView as any }}
        />
      )

      const liquidSurface = getByTestId('glass-nav-bar-surface-glass-liquid')
      expect(liquidSurface).toBeTruthy()
      expect(getByTestId('mock-glass-view')).toBeTruthy()

      assertNoOpacityInAncestry(liquidSurface, 'glass-nav-bar')
    })

    it('(b) Blur branch renders BlurView with intensity 60, tint light, and has no opacity in ancestry', async () => {
      const { getByTestId } = await render(
        <GlassNavBar
          title="شاشة بلور"
          paddingTop={44}
          onBackPress={jest.fn()}
          support={{ kind: 'blur' }}
        />
      )

      const blurSurface = getByTestId('glass-nav-bar-surface-glass-blur')
      expect(blurSurface).toBeTruthy()
      const blurView = getByTestId('mock-blur-view')
      expect(blurView).toBeTruthy()
      expect(blurView.props.intensity).toBe(60)
      expect(blurView.props.tint).toBe('light')

      assertNoOpacityInAncestry(blurSurface, 'glass-nav-bar')
    })
  })

  describe('5. Architectural Guard: expo-blur whitelist enforcement', () => {
    it('verifies GlassNavBar.tsx does NOT import expo-blur, and only 3 allowed files remain', () => {
      const glassNavBarPath = path.resolve(__dirname, '../../components/ui/GlassNavBar.tsx')
      const glassNavBarContent = fs.readFileSync(glassNavBarPath, 'utf8')

      expect(glassNavBarContent).not.toContain("from 'expo-blur'")
      expect(glassNavBarContent).not.toContain('from "expo-blur"')

      const allowedFiles = new Set([
        path.normalize('src/components/navigation/GlassSurface.tsx'),
        path.normalize('src/components/ui/ListingCardBase.tsx'),
        path.normalize('app/(auth)/login.tsx'),
      ])

      const rootDir = path.resolve(__dirname, '../../..')
      const targetDirs = ['app', 'src']
      const violatingFiles: string[] = []

      function scanDir(dirPath: string) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)
          if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '_parked') {
              continue
            }
            scanDir(fullPath)
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx') || entry.name.endsWith('.test.tsx')) {
              continue
            }
            const relPath = path.relative(rootDir, fullPath)
            const content = fs.readFileSync(fullPath, 'utf8')
            if (content.includes("from 'expo-blur'") || content.includes('from "expo-blur"')) {
              if (!allowedFiles.has(relPath)) {
                violatingFiles.push(relPath)
              }
            }
          }
        }
      }

      for (const dir of targetDirs) {
        scanDir(path.resolve(rootDir, dir))
      }

      expect(violatingFiles).toEqual([])
    })
  })
})
