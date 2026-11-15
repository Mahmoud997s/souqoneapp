import fs from 'node:fs'
import path from 'node:path'
import { postEntryRoute } from '../../navigation/listingRoutes'

const homeSource = fs.readFileSync(
  path.resolve(__dirname, '../../../app/(tabs)/index.tsx'),
  'utf8'
)

describe('Home bottom content characterization', () => {
  it('keeps the existing post-category destination in the Home add handler via postEntryRoute', () => {
    expect(homeSource).toContain('router.push(postEntryRoute())')
    expect(postEntryRoute()).toBe('/(modals)/post-category')
  })

  it('renders banner then support, and does NOT render or import HomeHowItWorks', () => {
    expect(homeSource).not.toContain('HomeHowItWorks')
    expect(homeSource).not.toContain('<HomeHowItWorks')

    const addBannerIndex = homeSource.indexOf('<HomeAddListingBanner')
    const supportIndex = homeSource.indexOf('<SupportHelpButton style=')
    const scrollCloseIndex = homeSource.indexOf('</Animated.ScrollView>', supportIndex)

    expect(addBannerIndex).toBeGreaterThan(-1)
    expect(supportIndex).toBeGreaterThan(addBannerIndex)

    const betweenBannerAndSupport = homeSource
      .slice(addBannerIndex, supportIndex)
      .replace(/<HomeAddListingBanner[^>]*\/>/, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .trim()
    expect(betweenBannerAndSupport).toBe('')

    const trailingContent = homeSource
      .slice(supportIndex, scrollCloseIndex)
      .replace(/<SupportHelpButton[^>]*\/>/, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .trim()
    expect(trailingContent).toBe('')
  })
})
