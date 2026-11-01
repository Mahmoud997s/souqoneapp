import * as barrel from '../../components/navigation/glassSupport'
import * as capability from '../../components/navigation/glassCapability'
import * as surface from '../../components/navigation/GlassSurface'

describe('glassSupport Barrel Re-export Contract', () => {
  it('re-exports all runtime symbols identically from capability and surface modules', () => {
    expect(barrel.resolveNativeGlassSupport).toBe(capability.resolveNativeGlassSupport)
    expect(barrel.getGlassSupport).toBe(capability.getGlassSupport)
    expect(barrel.useGlassSupport).toBe(capability.useGlassSupport)
    expect(barrel.GlassSurface).toBe(surface.GlassSurface)
  })

  it('defines the expected set of runtime export keys', () => {
    const exportedKeys = Object.keys(barrel).sort()
    expect(exportedKeys).toEqual([
      'GlassSurface',
      'getGlassSupport',
      'resolveNativeGlassSupport',
      'useGlassSupport',
    ])
  })
})
