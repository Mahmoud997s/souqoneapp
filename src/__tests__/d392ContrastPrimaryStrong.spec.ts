import fs from 'fs'
import path from 'path'
import { Colors } from '../constants/colors'
import { Gradients } from '../constants/gradients'
import { FilterGlassTokens, QuickChipTokens } from '../constants/filterGlassTokens'

const ROOT = path.resolve(__dirname, '../..')

function srgbToLinear(channel: number): number {
  const s = channel / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  )
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

describe('D-392: WCAG AA Contrast for White Text/Icons on Primary Fills (Colors.primaryStrong)', () => {
  it('Colors.primaryStrong reaches >= 4.5:1 WCAG AA contrast against white while Colors.primary stays #009CB5 for brand accents', () => {
    expect(Colors.primary).toBe('#009CB5')
    expect(Colors.primaryStrong).toBe('#007F95')

    const oldRatio = contrastRatio(Colors.primary, Colors.white)
    const newRatio = contrastRatio(Colors.primaryStrong, Colors.white)

    expect(oldRatio).toBeLessThan(4.5)
    expect(newRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('shared button, chip, and tab tokens use Colors.primaryStrong under white text/icons', () => {
    expect(Gradients.button).toEqual([Colors.primaryStrong, Colors.primaryStrong])
    expect(FilterGlassTokens.chip.activeBg).toBe(Colors.primaryStrong)
    expect(FilterGlassTokens.tab.activeBg).toBe(Colors.primaryStrong)
    expect(QuickChipTokens.selected.bg).toBe(Colors.primaryStrong)
    expect(QuickChipTokens.selected.borderColor).toBe(Colors.primaryStrong)
    expect(QuickChipTokens.selectedPressed.bg).toBe(Colors.primaryStrong)
    expect(QuickChipTokens.selectedPressed.borderColor).toBe(Colors.primaryStrong)
  })

  it('listed white-on-primary components use Colors.primaryStrong and no longer use backgroundColor: Colors.primary for text/icon fills', () => {
    const consumers: Array<{ file: string; expectedSubstring: string }> = [
      { file: 'src/components/wizard/WizardOptionChip.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/ui/FilterChip.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/navigation/BottomBarAddButton.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/ui/Stepper.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/ui/DecisionToastCard.tsx', expectedSubstring: 'Colors.primaryStrong' },
      { file: 'src/components/ui/EmptyState.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/ui/FilterBottomSheetLayout.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/listing-detail/ContactActions.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/components/listing-detail/OwnerManageBar.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/screens/search/SearchScreen.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/screens/search/components/SearchAutocompleteList.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
      { file: 'src/screens/search/components/SearchEmptyState.tsx', expectedSubstring: 'backgroundColor: Colors.primaryStrong' },
    ]

    for (const { file, expectedSubstring } of consumers) {
      const src = readRepoFile(file)
      expect(src).toContain(expectedSubstring)
      if (file !== 'src/components/ui/Stepper.tsx') {
        expect(src).not.toMatch(/backgroundColor:\s*Colors\.primary\b/)
      }
    }
  })
})
