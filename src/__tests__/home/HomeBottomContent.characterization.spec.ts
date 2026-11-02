import fs from 'node:fs'
import path from 'node:path'

const homeSource = fs.readFileSync(
  path.resolve(__dirname, '../../../app/(tabs)/index.tsx'),
  'utf8'
)

describe('Home bottom content characterization', () => {
  it('keeps the existing post-category destination in the Home add handler', () => {
    expect(homeSource).toContain("router.push('/(modals)/post-category' as any)")
  })

  it('keeps the support button as the last content block', () => {
    const supportIndex = homeSource.indexOf('<SupportHelpButton style=')
    const scrollCloseIndex = homeSource.indexOf('</Animated.ScrollView>', supportIndex)
    expect(supportIndex).toBeGreaterThan(-1)
    const trailingContent = homeSource
      .slice(supportIndex, scrollCloseIndex)
      .replace(/<SupportHelpButton[^>]*\/>/, '')
      .trim()
    expect(trailingContent).toBe('')
  })
})
