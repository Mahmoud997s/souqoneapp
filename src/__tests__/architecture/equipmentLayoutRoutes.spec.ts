import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const ROUTE_ROOT = path.join(PROJECT_ROOT, 'app/equipment')
const LAYOUT_PATH = path.join(ROUTE_ROOT, '_layout.tsx')

describe('equipment layout routes', () => {
  it('declares only routes backed by an equipment route file or directory index', () => {
    const layout = fs.readFileSync(LAYOUT_PATH, 'utf8')
    const screenNames: string[] = []
    const screenPattern = /<Stack\.Screen\s+name=["']([^"']+)["']/g
    let match: RegExpExecArray | null

    while ((match = screenPattern.exec(layout)) !== null) {
      screenNames.push(match[1])
    }

    expect(screenNames.length).toBeGreaterThan(0)

    const missingRoutes = screenNames.filter((name) => {
      const routePath = path.join(ROUTE_ROOT, name)
      return ![
        `${routePath}.tsx`,
        `${routePath}.ts`,
        path.join(routePath, 'index.tsx'),
        path.join(routePath, 'index.ts'),
        path.join(routePath, '_layout.tsx'),
      ].some((candidate) => fs.existsSync(candidate))
    })

    expect(missingRoutes).toEqual([])
  })
})
