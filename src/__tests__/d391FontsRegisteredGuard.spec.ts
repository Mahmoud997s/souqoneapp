import fs from 'fs'
import path from 'path'
import ts from 'typescript'

const ROOT = path.resolve(__dirname, '../..')

// Registered in app/_layout.tsx via useFonts(...)
const REGISTERED_FONT_FAMILIES = new Set([
  'Almarai_400Regular',
  'Almarai_700Bold',
  'Almarai_800ExtraBold',
])

// Emoji-only text blocks intentionally use the system emoji font (not Almarai)
const EMOJI_ALLOWLIST = new Set([
  'src/components/chat/ReactionPicker.tsx:emoji',
])

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (
        entry.name === '__tests__' ||
        entry.name === '_parked' ||
        entry.name === 'node_modules'
      ) {
        continue
      }
      walkSourceFiles(full, out)
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.(spec|test)\.(ts|tsx)$/.test(entry.name)
    ) {
      out.push(full)
    }
  }
  return out
}

interface FontAuditResult {
  missingFamily: string[]
  unregisteredFamily: string[]
  redundantFontWeight: string[]
}

function auditFonts(): FontAuditResult {
  const files = [
    ...walkSourceFiles(path.join(ROOT, 'app')),
    ...walkSourceFiles(path.join(ROOT, 'src')),
  ]
  const missingFamily: string[] = []
  const unregisteredFamily: string[] = []
  const redundantFontWeight: string[] = []

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    // src/constants/typography.ts defines the Typography presets themselves
    if (rel === 'src/constants/typography.ts') continue

    const source = fs.readFileSync(file, 'utf8')
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)

    function visit(node: ts.Node, parentPropName: string) {
      if (ts.isObjectLiteralExpression(node)) {
        let hasFontSize = false
        let fontFamilyNode: ts.Expression | null = null
        let hasTokenPairFamilies = false
        let hasFontWeight = false
        let hasTypographySpread = false

        for (const prop of node.properties) {
          if (ts.isSpreadAssignment(prop)) {
            const txt = prop.expression.getText(sf)
            if (txt.includes('Typography.') || txt.includes('Typography[')) {
              hasTypographySpread = true
            }
          } else if (
            ts.isPropertyAssignment(prop) &&
            (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))
          ) {
            const key = prop.name.text
            if (key === 'fontSize') {
              hasFontSize = true
            } else if (key === 'fontFamily') {
              fontFamilyNode = prop.initializer
            } else if (key === 'inactiveFontFamily' || key === 'activeFontFamily') {
              if (
                (ts.isStringLiteral(prop.initializer) ||
                  ts.isNoSubstitutionTemplateLiteral(prop.initializer)) &&
                REGISTERED_FONT_FAMILIES.has(prop.initializer.text)
              ) {
                hasTokenPairFamilies = true
              } else if (
                ts.isStringLiteral(prop.initializer) ||
                ts.isNoSubstitutionTemplateLiteral(prop.initializer)
              ) {
                const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
                unregisteredFamily.push(
                  `${rel}:${line} [${parentPropName || '<inline>'}] ${key}=${prop.initializer.text}`
                )
              }
            } else if (key === 'fontWeight') {
              hasFontWeight = true
            }
          }
        }

        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
        const blockName = parentPropName || '<inline>'

        if (fontFamilyNode) {
          if (
            ts.isStringLiteral(fontFamilyNode) ||
            ts.isNoSubstitutionTemplateLiteral(fontFamilyNode)
          ) {
            if (!REGISTERED_FONT_FAMILIES.has(fontFamilyNode.text)) {
              unregisteredFamily.push(`${rel}:${line} [${blockName}] fontFamily=${fontFamilyNode.text}`)
            }
          }
          if (hasFontWeight) {
            redundantFontWeight.push(`${rel}:${line} [${blockName}]`)
          }
        }

        if (hasFontSize && !fontFamilyNode && !hasTypographySpread && !hasTokenPairFamilies) {
          const allowKey = `${rel}:${blockName}`
          if (!EMOJI_ALLOWLIST.has(allowKey)) {
            missingFamily.push(`${rel}:${line} [${blockName}]`)
          }
        }
      }

      ts.forEachChild(node, (child) => {
        let nextName = parentPropName
        if (
          ts.isPropertyAssignment(node) &&
          (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
        ) {
          nextName = node.name.text
        }
        visit(child, nextName)
      })
    }

    visit(sf, '')
  }

  return { missingFamily, unregisteredFamily, redundantFontWeight }
}

describe('D-391: Registered Almarai Font Guard', () => {
  it('every style block setting fontSize uses a registered Almarai fontFamily (or Typography preset), with emoji-only allowlist', () => {
    const { missingFamily, unregisteredFamily } = auditFonts()
    expect(unregisteredFamily).toEqual([])
    expect(missingFamily).toEqual([])
  })

  it('no style block combines fontFamily with a redundant fontWeight', () => {
    const { redundantFontWeight } = auditFonts()
    expect(redundantFontWeight).toEqual([])
  })
})
