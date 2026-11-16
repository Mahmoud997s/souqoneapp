import { Colors, BrandColors, withAlpha } from '../colors'

describe('colors.ts token foundation & withAlpha (D-347 PR-7a)', () => {
  it('supports #RGB, #RRGGBB, #RRGGBBAA, rgb(), and rgba() without double-wrapping', () => {
    expect(withAlpha('#0F0', 0.5)).toBe('rgba(0, 255, 0, 0.5)')
    expect(withAlpha('#009CB5', 0.3)).toBe('rgba(0, 156, 181, 0.3)')
    expect(withAlpha('#009CB580', 0.25)).toBe('rgba(0, 156, 181, 0.25)')
    expect(withAlpha('rgb(220, 38, 38)', 0.12)).toBe('rgba(220, 38, 38, 0.12)')
    expect(withAlpha('rgba(220, 38, 38, 0.9)', 0.4)).toBe('rgba(220, 38, 38, 0.4)')
  })

  it('clamps alpha to [0, 1]', () => {
    expect(withAlpha('#009CB5', -0.5)).toBe('rgba(0, 156, 181, 0)')
    expect(withAlpha('#009CB5', 2.5)).toBe('rgba(0, 156, 181, 1)')
    expect(withAlpha('rgba(15, 23, 42, 0.5)', 99)).toBe('rgba(15, 23, 42, 1)')
  })

  it('returns invalid inputs unchanged and never throws', () => {
    expect(withAlpha('', 0.5)).toBe('')
    expect(withAlpha('not-a-color', 0.5)).toBe('not-a-color')
    expect(withAlpha('#12', 0.5)).toBe('#12')
    expect(withAlpha('#GGGGGG', 0.5)).toBe('#GGGGGG')
    expect(withAlpha('hsl(0, 100%, 50%)', 0.5)).toBe('hsl(0, 100%, 50%)')
    expect(withAlpha('#009CB5', Number.NaN)).toBe('#009CB5')
  })

  it('exposes BrandColors and named soft tokens', () => {
    expect(BrandColors.googleBorder).toBe('#DADCE0')
    expect(BrandColors.googleText).toBe('#3C4043')
    expect(BrandColors.appleBg).toBe('#000000')
    expect(Colors.primarySoft30).toBe('rgba(0, 156, 181, 0.30)')
    expect(Colors.slateBorder).toBe('#E2E8F0')
  })
})
