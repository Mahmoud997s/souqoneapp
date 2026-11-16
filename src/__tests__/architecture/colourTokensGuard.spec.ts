import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '../../..')

/**
 * Strips // line comments and /* ... *\/ block comments while preserving line count
 * and string literals, so comment-only colour mentions never trigger the guard.
 */
export function stripCommentsPreservingStrings(source: string): string {
  let out = ''
  let i = 0
  const n = source.length
  while (i < n) {
    const ch = source[i]
    const next = source[i + 1]

    // Preserve single/double/template string literals
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      out += ch
      i++
      while (i < n) {
        const c = source[i]
        out += c
        if (c === '\\' && i + 1 < n) {
          out += source[i + 1]
          i += 2
          continue
        }
        i++
        if (c === quote) break
      }
      continue
    }

    // Line comment
    if (ch === '/' && next === '/') {
      i += 2
      while (i < n && source[i] !== '\n') i++
      continue
    }

    // Block comment (preserve newlines for accurate line numbers)
    if (ch === '/' && next === '*') {
      i += 2
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') out += '\n'
        i++
      }
      i += 2
      continue
    }

    out += ch
    i++
  }
  return out
}

const RAW_COLOUR_RE =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)|(?:Colors\.[A-Za-z0-9_]+|[A-Za-z0-9_.]+)\s*\+\s*['"][0-9a-fA-F]{2}['"]/g

export function findRawColourViolations(
  content: string,
  relPath: string,
): string[] {
  const stripped = stripCommentsPreservingStrings(content)
  const lines = stripped.split(/\r?\n/)
  const hits: string[] = []
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    // Single documented dynamic-suffix exception (M-130 / M-136)
    if (
      relPath === 'src/components/navigation/UnifiedBottomBar.tsx' &&
      /borderColor:\s*activeColor\s*\+\s*'30'/.test(line)
    ) {
      continue
    }
    const matches = line.match(RAW_COLOUR_RE)
    if (matches) {
      hits.push(`${relPath}:${idx + 1} -> ${matches.join(', ')}`)
    }
  }
  return hits
}

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '_parked' || entry.name === '__tests__') continue
      collectSourceFiles(full, out)
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.(spec|test)\.(ts|tsx)$/.test(entry.name)
    ) {
      out.push(full)
    }
  }
  return out
}

const ALLOWLIST_FILES = new Set([
  // DATA files (paint swatches, badge intents, avatar colour wheel)
  'src/constants/cars.ts',
  'src/constants/buses.ts',
  'src/constants/badges.ts',
  'src/utils/format.ts',
  // DEFINITION files (canonical colour/token/gradient definitions)
  'src/constants/colors.ts',
  'src/constants/cardSystem.ts',
  'src/constants/topBarTokens.ts',
  'src/constants/filterGlassTokens.ts',
  'src/constants/gradients.ts',
  'src/constants/bottomBarTokens.ts',
])

describe('D-347 PR-7j: Colour Tokens & withAlpha CI Guard', () => {
  describe('comment-stripping fixtures (M-117 amendment 4)', () => {
    it('ignores raw hex, rgb/rgba, and +2-hex suffixes inside // and /* */ comments', () => {
      const fixture = `
        // Legacy colour: #FFFFFF rgba(0, 0, 0, 0.5) Colors.primary + '30'
        /*
         * Multi-line comment with #123456, rgb(10, 20, 30), activeColor + '25'
         */
        const valid = Colors.surface // trailing comment #000000
      `
      expect(findRawColourViolations(fixture, 'src/example.tsx')).toEqual([])
    })

    it('detects raw #hex, rgb/rgba, and +2-hex suffixes in executable code', () => {
      const fixture = `
        const a = '#fff'
        const b = 'rgba(255, 0, 0, 0.5)'
        const c = Colors.primary + '30'
        const d = 'rgb(1, 2, 3)'
      `
      const hits = findRawColourViolations(fixture, 'src/example.tsx')
      expect(hits).toHaveLength(4)
      expect(hits[0]).toContain('#fff')
      expect(hits[1]).toContain('rgba(255, 0, 0, 0.5)')
      expect(hits[2]).toContain("Colors.primary + '30'")
      expect(hits[3]).toContain('rgb(1, 2, 3)')
    })
  })

  it('forbids raw colour literals in all active THEME files outside the allowlist', () => {
    const files = [
      ...collectSourceFiles(path.join(ROOT, 'app')),
      ...collectSourceFiles(path.join(ROOT, 'src')),
    ]
    const violations: string[] = []
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/')
      if (ALLOWLIST_FILES.has(rel)) continue
      const content = fs.readFileSync(file, 'utf8')
      violations.push(...findRawColourViolations(content, rel))
    }
    expect(violations).toEqual([])
  })

  it('forbids withAlpha misuse in THEME and list-item render files outside colors.ts', () => {
    const files = [
      ...collectSourceFiles(path.join(ROOT, 'app')),
      ...collectSourceFiles(path.join(ROOT, 'src')),
    ]
    const violations: string[] = []
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/')
      if (rel === 'src/constants/colors.ts') continue
      const content = stripCommentsPreservingStrings(fs.readFileSync(file, 'utf8'))
      if (/\bwithAlpha\s*\(/.test(content)) {
        violations.push(rel)
      }
    }
    expect(violations).toEqual([])
  })
})
