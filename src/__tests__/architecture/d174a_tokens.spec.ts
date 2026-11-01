import { CardSystem } from '../../constants/cardSystem'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Colors } from '../../constants/colors'

describe('D-174a Token Deduplication & Dead Token Absence (Value-Equality)', () => {
  describe('Value-equality of migrated literals to tokens', () => {
    it('CardSystem.glass capsule tokens equal exact old literals from glassSupport.tsx', () => {
      expect(CardSystem.glass.capsuleTint).toBe('rgba(238, 242, 245, 0.55)')
      expect(CardSystem.glass.capsuleBlurWashBg).toBe('rgba(238, 242, 245, 0.82)')
      expect(CardSystem.glass.capsuleBorderColor).toBe('rgba(229, 231, 235, 0.90)')
    })

    it('CardSystem.glass action button tokens equal exact old literals from ListingCardBase.tsx', () => {
      expect(CardSystem.glass.actionBtnBg).toBe('rgba(255, 255, 255, 0.88)')
      expect(CardSystem.glass.actionBtnBorderColor).toBe('rgba(255, 255, 255, 0.95)')
    })

    it('CardSystem.glass verified badge token equals exact old literal from VerifiedBadge.tsx', () => {
      expect(CardSystem.glass.verifiedBadgeDarkBorderColor).toBe('rgba(0, 156, 181, 0.35)')
    })

    it('TopBarTokens.whiteWashBg imports from BottomBarTokens.whiteWashBg with exact value', () => {
      expect(TopBarTokens.whiteWashBg).toBe(BottomBarTokens.whiteWashBg)
      expect(TopBarTokens.whiteWashBg).toBe('rgba(255, 255, 255, 0.78)')
    })

    it('SearchCategoryTabs tokens equal exact literals and prove surfaceAlt inequality', () => {
      expect(TopBarTokens.categoryTrackBg).toBe('#f1f5f9')
      expect(TopBarTokens.categoryTabBg).toBe('#ffffff')
      // Note: Equality check is intentionally case-insensitive as color parsing in React Native/CSS is case-insensitive (#ffffff vs #FFFFFF)
      expect(Colors.white.toLowerCase()).toBe('#ffffff')
      // Proves why Colors.surfaceAlt (#F7F8FA) was not used in place of #f1f5f9
      expect(Colors.surfaceAlt.toLowerCase()).not.toBe('#f1f5f9')
    })
  })

  describe('Dead tokens removed from exported token sets', () => {
    it('BottomBarTokens does not expose dead keys', () => {
      const keys = Object.keys(BottomBarTokens)
      expect(keys).not.toContain('activePillWidth')
      expect(keys).not.toContain('activePillHeight')
      expect(keys).not.toContain('activePillRadius')
      expect(keys).not.toContain('inactiveIconColor')
      expect(keys).not.toContain('blurIntensityIos')
      expect(keys).not.toContain('blurIntensityAndroid')
      expect(keys).not.toContain('collapsedRadius')
    })

    it('CardSystem.glass does not expose dead keys', () => {
      const keys = Object.keys(CardSystem.glass)
      expect(keys).not.toContain('outerRadius')
    })
  })
})
