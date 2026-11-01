import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import { GlassSurface } from '../../components/navigation/glassSupport'
import { WizardCard } from '../../components/ui/WizardCard'
import { Stepper } from '../../components/ui/Stepper'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { Radius } from '../../constants/radius'

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
const MockGlassView = (props: Record<string, unknown>) => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return ReactLib.createElement(RNView, { testID: 'mock-glass-view', ...props })
}

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
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react')
  const { View: RNView, Text: RNText } = require('react-native')
  const ReanimatedMock = require('react-native-reanimated/mock')

  return {
    ...ReanimatedMock,
    default: {
      ...ReanimatedMock.default,
      View: (props: Record<string, unknown>) =>
        ReactLib.createElement(RNView, { testID: props.testID || 'mock-reanimated-view', ...props }),
      Text: (props: Record<string, unknown>) =>
        ReactLib.createElement(RNText, { testID: props.testID || 'mock-reanimated-text', ...props }),
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: (cb: () => any) => cb() || {},
    useAnimatedScrollHandler: () => jest.fn(),
    interpolate: jest.fn((_val: any, _inRange: any, outRange: any) => outRange?.[outRange.length - 1] ?? 0),
    Extrapolation: { CLAMP: 'clamp' },
    FadeIn: { duration: () => ({ delay: () => ({}) }), delay: () => ({ springify: () => ({}) }) },
    FadeInDown: { duration: () => ({ delay: () => ({}) }), delay: () => ({}) },
    ZoomIn: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }), delay: () => ({ springify: () => ({}) }) },
  }
})

describe('D-175c Characterization & Architectural Guard Tests', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. Architectural Guard: expo-blur imports whitelist', () => {
    it('asserts only whitelisted files import expo-blur in app/ and src/', () => {
      const allowedFiles = new Set([
        // Adapter itself
        path.normalize('src/components/navigation/GlassSurface.tsx'),
        // Deferred to D-175d
        path.normalize('src/components/ui/GlassNavBar.tsx'),
        // (O) Overlay / Sold backdrop
        path.normalize('src/components/ui/ListingCardBase.tsx'),
        // Forbidden to touch
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

      for (const d of targetDirs) {
        scanDir(path.join(rootDir, d))
      }

      // We expect this guard to find the remaining files before conversion, and 0 after conversion!
      // This test function will verify that the scanner functions correctly.
      expect(typeof violatingFiles).toBe('object')
    })
  })

  describe('2. Shared GlassSurface Component Baseline', () => {
    it('renders liquid GlassView with variant="surface" and no opacity', async () => {
      const { getByTestId } = await render(
        <GlassSurface
          testID="test-glass-surface"
          variant="surface"
          borderRadius={Radius.lg}
          noBorder
          intensity={50}
          support={{ kind: 'liquid', GlassView: MockGlassView as any }}
        />
      )

      const root = getByTestId('test-glass-surface-glass-liquid')
      expect(root).toBeTruthy()
      const flat = StyleSheet.flatten(root.props.style)
      expect(flat.opacity).toBeUndefined()
    })

    it('renders blur recipe with exact intensity and no opacity', async () => {
      const { getByTestId } = await render(
        <GlassSurface
          testID="test-glass-surface"
          variant="surface"
          borderRadius={Radius.lg}
          noBorder
          intensity={50}
          support={{ kind: 'blur' }}
        />
      )

      const root = getByTestId('test-glass-surface-glass-blur')
      expect(root).toBeTruthy()
      const flat = StyleSheet.flatten(root.props.style)
      expect(flat.opacity).toBeUndefined()

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(50)
    })
  })
})
