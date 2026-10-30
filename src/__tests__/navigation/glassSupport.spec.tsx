import React from 'react'
import { AccessibilityInfo, Platform, View } from 'react-native'
import { renderHook, act, cleanup } from '@testing-library/react-native'
import {
  resolveNativeGlassSupport,
  getGlassSupport,
  useGlassSupport,
  __resetGlassSupportCacheForTests,
} from '../../components/navigation/glassSupport'

const mockIsLiquidGlassAvailable = jest.fn(() => true)
const mockIsGlassEffectAPIAvailable = jest.fn(() => true)
const MockGlassView = (props: React.ComponentProps<typeof View>) => <View {...props} />

jest.mock('expo-glass-effect', () => ({
  GlassView: MockGlassView,
  GlassContainer: MockGlassView,
  isLiquidGlassAvailable: () => mockIsLiquidGlassAvailable(),
  isGlassEffectAPIAvailable: () => mockIsGlassEffectAPIAvailable(),
}))

describe('glassSupport adapter (Task D-166b)', () => {
  const originalOS = Platform.OS

  beforeEach(() => {
    __resetGlassSupportCacheForTests()
    mockIsLiquidGlassAvailable.mockReturnValue(true)
    mockIsGlassEffectAPIAvailable.mockReturnValue(true)
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' })
  })

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
    __resetGlassSupportCacheForTests()
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS })
  })

  function setPlatform(os: typeof Platform.OS) {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os })
  }

  it('(a) module present and APIs true on iOS: renders the liquid branch', () => {
    setPlatform('ios')
    const support = getGlassSupport(false)
    expect(support.kind).toBe('liquid')
    if (support.kind === 'liquid') {
      expect(support.GlassView).toBe(MockGlassView)
    }
  })

  it('(c) isLiquidGlassAvailable() false: blur', () => {
    setPlatform('ios')
    mockIsLiquidGlassAvailable.mockReturnValue(false)

    expect(getGlassSupport(false)).toEqual({ kind: 'blur' })
  })

  it('(d) isGlassEffectAPIAvailable() false: blur', () => {
    setPlatform('ios')
    mockIsGlassEffectAPIAvailable.mockReturnValue(false)

    expect(getGlassSupport(false)).toEqual({ kind: 'blur' })
  })

  it('(d) isGlassEffectAPIAvailable() throwing: blur and does not throw', () => {
    setPlatform('ios')
    mockIsGlassEffectAPIAvailable.mockImplementation(() => {
      throw new Error("Cannot find native module 'ExpoGlassEffect'")
    })

    expect(() => getGlassSupport(false)).not.toThrow()
    expect(getGlassSupport(false)).toEqual({ kind: 'blur' })
  })

  it('(e) reduce-transparency enabled: blur', () => {
    setPlatform('ios')
    expect(getGlassSupport(true)).toEqual({ kind: 'blur' })
    expect(getGlassSupport(false).kind).toBe('liquid')
  })

  it('(e) useGlassSupport follows the Reduce Transparency setting (blur until known)', async () => {
    setPlatform('ios')
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true)

    const { result } = await renderHook(() => useGlassSupport())
    await act(async () => {})
    expect(result.current.kind).toBe('blur')
  })

  it('(e) useGlassSupport switches to liquid once Reduce Transparency is known to be off', async () => {
    setPlatform('ios')
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false)

    const { result } = await renderHook(() => useGlassSupport())
    expect(result.current.kind).toBe('liquid')
  })

  it('(f) Android: blur and the package is never required', () => {
    setPlatform('android')
    mockIsLiquidGlassAvailable.mockClear()
    mockIsGlassEffectAPIAvailable.mockClear()

    const support = getGlassSupport(false)
    expect(support).toEqual({ kind: 'blur' })
    expect(mockIsLiquidGlassAvailable).not.toHaveBeenCalled()
    expect(mockIsGlassEffectAPIAvailable).not.toHaveBeenCalled()
  })

  it('(g) the adapter result is cached (one require)', () => {
    setPlatform('ios')
    mockIsLiquidGlassAvailable.mockClear()

    const first = resolveNativeGlassSupport()
    const second = resolveNativeGlassSupport()
    getGlassSupport(false)

    expect(second).toBe(first)
    expect(mockIsLiquidGlassAvailable).toHaveBeenCalledTimes(1)
  })
})
