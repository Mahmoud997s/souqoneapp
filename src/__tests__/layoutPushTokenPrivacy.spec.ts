import fs from 'fs'
import path from 'path'

describe('D-229: app/_layout.tsx Push Token and Notification Privacy Protection', () => {
  const layoutPath = path.resolve(__dirname, '../../app/_layout.tsx')

  it('proves app/_layout.tsx does not log push token or raw notification content', () => {
    const content = fs.readFileSync(layoutPath, 'utf8')

    // 1. Must NOT log raw push token variable or expression
    expect(content).not.toContain("console.log('[Push] Token:'")
    expect(content).not.toMatch(/console\.(log|warn|error|info)\s*\([^)]*,\s*token\b/)
    expect(content).not.toMatch(/console\.(log|warn|error|info)\s*\(\s*token\b/)
    expect(content).not.toMatch(/console\.(log|warn|error|info)\s*\([^)]*\$\{token\}/)

    // 2. Must NOT log notification content / title
    expect(content).not.toContain('notification.request.content.title')
    expect(content).not.toMatch(/console\.(log|warn|error|info)\s*\([^)]*notification\.request\.content/)

    // 3. Any remaining push log must be guarded by __DEV__
    const lines = content.split('\n')
    const pushLogLines = lines.filter((l) => l.includes('[Push]') && l.includes('console.'))
    expect(pushLogLines.length).toBeGreaterThan(0)
    for (const logLine of pushLogLines) {
      expect(logLine).toContain('__DEV__')
    }
  })
})
