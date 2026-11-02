import fs from 'node:fs'
import path from 'node:path'

const homeSource = fs.readFileSync(
  path.resolve(__dirname, '../../../app/(tabs)/index.tsx'),
  'utf8'
)

describe('Home bottom content characterization', () => {
  it('keeps the existing post-category destination in the Home add handler', () => {
    expect(homeSource).toContain("router.push('/(modals)/post-category'")
  })

  it('keeps the support button as the last content block', () => {
    const howItWorksIndex = homeSource.indexOf('<HomeHowItWorks')
    const addBannerIndex = homeSource.indexOf('<HomeAddListingBanner')
    const supportIndex = homeSource.indexOf('<SupportHelpButton style=')
    const scrollCloseIndex = homeSource.indexOf('</Animated.ScrollView>', supportIndex)
    expect(howItWorksIndex).toBeGreaterThan(-1)
    expect(addBannerIndex).toBeGreaterThan(howItWorksIndex)
    expect(supportIndex).toBeGreaterThan(-1)
    expect(supportIndex).toBeGreaterThan(addBannerIndex)
    const trailingContent = homeSource
      .slice(supportIndex, scrollCloseIndex)
      .replace(/<SupportHelpButton[^>]*\/>/, '')
      .trim()
    expect(trailingContent).toBe('')
  })
})
