import fs from 'fs'
import path from 'path'

/**
 * Regression guard: Scans `src/` and `app/` files for corrupted Arabic text (`???`).
 * Corrupted Arabic occurs when UTF-8 strings are decoded as ASCII/CP1252/ISO-8859-1
 * and saved back, converting Arabic multi-byte sequences into question marks (D-093 Item 5).
 */
describe('noCorruptedArabic regression guard (D-093 Item 5)', () => {
  const workspaceRoot = path.resolve(__dirname, '../..')
  const scanDirs = [path.join(workspaceRoot, 'src'), path.join(workspaceRoot, 'app')]

  function getSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...getSourceFiles(fullPath))
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
        entry.name !== 'noCorruptedArabic.spec.ts'
      ) {
        files.push(fullPath)
      }
    }
    return files
  }

  function findCorruptedArabic(filePath: string): { line: number; text: string }[] {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    const violations: { line: number; text: string }[] = []

    // Regex matches 3 or more consecutive question marks inside string literals or JSX text
    const corruptedPattern = /(?:['"`][^'"`]*\?{3,}[^'"`]*['"`]|>[^<]*\?{3,}[^<]*<)/

    lines.forEach((lineText, index) => {
      // Ignore comment-only lines
      const trimmed = lineText.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return
      }

      if (corruptedPattern.test(lineText)) {
        violations.push({ line: index + 1, text: lineText.trim() })
      }
    })

    return violations
  }

  it('detects no corrupted Arabic (???+) in src/ and app/ source and spec files', () => {
    const allFiles: string[] = []
    for (const d of scanDirs) {
      allFiles.push(...getSourceFiles(d))
    }

    const allViolations: { file: string; line: number; text: string }[] = []

    for (const file of allFiles) {
      const violations = findCorruptedArabic(file)
      for (const v of violations) {
        allViolations.push({
          file: path.relative(workspaceRoot, file).replace(/\\/g, '/'),
          line: v.line,
          text: v.text,
        })
      }
    }

    expect(allViolations).toEqual([])
  })
})
