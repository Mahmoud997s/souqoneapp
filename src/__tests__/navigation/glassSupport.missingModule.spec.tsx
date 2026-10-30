import { Platform } from 'react-native'
import {
  getGlassSupport,
  resolveNativeGlassSupport,
  __resetGlassSupportCacheForTests,
} from '../../components/navigation/glassSupport'

/**
 * D-166b — OTA safety test:
 * Simulates a binary built before expo-glass-effect was installed.
 * The mock factory throws on require, mimicking requireNativeModule failure.
 */
jest.mock('expo-glass-effect', () => {
  throw new Error("Cannot find native module 'ExpoGlassEffect'")
})

describe('glassSupport OTA safety (Task D-166b)', () => {
  const originalOS = Platform.OS

  beforeEach(() => {
    __resetGlassSupportCacheForTests()
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' })
  })

  afterEach(() => {
    __resetGlassSupportCacheForTests()
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS })
  })

  it('(b) require throws: renders the blur branch, does not throw', () => {
    expect(() => getGlassSupport(false)).not.toThrow()
    expect(getGlassSupport(false)).toEqual({ kind: 'blur' })
    expect(resolveNativeGlassSupport()).toEqual({ kind: 'blur' })
  })
})
