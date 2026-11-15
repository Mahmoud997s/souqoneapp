import fs from 'fs'
import path from 'path'
import { ROUTE_BOTTOM_BAR_ENTRIES } from '../constants/toastLayout'

function collectAppRoutes(dir: string, rootDir: string): string[] {
  const routes: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue
      routes.push(...collectAppRoutes(fullPath, rootDir))
      continue
    }
    if (!entry.name.endsWith('.tsx')) continue
    if (entry.name === '_layout.tsx' || entry.name.endsWith('.spec.tsx')) continue

    const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/')
    const withoutExt = rel.replace(/\.tsx$/, '')
    const segments = withoutExt
      .split('/')
      .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
    if (segments[segments.length - 1] === 'index') {
      segments.pop()
    }
    const route = `/${segments.join('/')}`
    routes.push(route === '' ? '/' : route)
  }
  return Array.from(new Set(routes)).sort()
}

describe('GlobalToast route classification guard', () => {
  it('explicitly classifies every route file under app/ in ROUTE_BOTTOM_BAR_ENTRIES', () => {
    const appDir = path.resolve(__dirname, '../../app')
    const actualRoutes = collectAppRoutes(appDir, appDir)
    const configuredPatterns = new Set(ROUTE_BOTTOM_BAR_ENTRIES.map((e) => e.pattern))

    const unclassified = actualRoutes.filter((route) => !configuredPatterns.has(route))
    expect(unclassified).toEqual([])
  })
})
