import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.expo' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '__tests__'
      ) {
        continue
      }
      getAllSourceFiles(fullPath, fileList)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (
        (ext === '.ts' || ext === '.tsx') &&
        !entry.name.includes('.spec.') &&
        !entry.name.includes('.test.')
      ) {
        fileList.push(fullPath)
      }
    }
  }
  return fileList
}

describe('Architecture: Single Source of Truth for Favorites', () => {
  const srcFiles = getAllSourceFiles(path.join(PROJECT_ROOT, 'src'))
  const appFiles = getAllSourceFiles(path.join(PROJECT_ROOT, 'app'))
  const allCandidateFiles = [...srcFiles, ...appFiles]

  const ALLOWED_FAVORITES_API_CALLERS = [
    path.normalize('src/api/favorites.ts'),
    path.normalize('src/features/favorites/useFavoriteIds.ts'),
    path.normalize('src/features/favorites/useFavoriteToggle.ts'),
    path.normalize('src/hooks/listing-detail/useFavoriteToggle.ts'),
    path.normalize('src/hooks/useListings.ts'), // read-only getAll for favorites screen
  ]

  const ALLOWED_ENTITY_TYPE_MAP_FILES = [
    path.normalize('src/features/favorites/favoriteEntityTypes.ts'),
    path.normalize('src/utils/contactEntityType.ts'),
    path.normalize('src/hooks/useListings.ts'),
    path.normalize('src/hooks/listing-detail/useListingContact.ts'),
    path.normalize('src/utils/notificationRouter.ts'),
  ]

  it('prohibits direct imports or calls to favoritesApi outside the favorites module and api definition', () => {
    const violations: { file: string; line: number; match: string }[] = []

    for (const filePath of allCandidateFiles) {
      const relativePath = path.normalize(path.relative(PROJECT_ROOT, filePath))
      const isAllowed = ALLOWED_FAVORITES_API_CALLERS.some((allowed) =>
        relativePath.endsWith(allowed)
      )
      if (isAllowed) continue

      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        if (
          line.includes('favoritesApi') ||
          line.match(/from\s+['"].*api\/favorites['"]/) ||
          line.match(/['"]\/favorites/)
        ) {
          violations.push({
            file: relativePath,
            line: index + 1,
            match: line.trim(),
          })
        }
      })
    }

    if (violations.length > 0) {
      const formatted = violations
        .map((v) => `  - ${v.file}:${v.line} -> ${v.match}`)
        .join('\n')
      throw new Error(
        `Architecture violation: favoritesApi must NOT be called or imported outside the favorites feature module:\n${formatted}`
      )
    }

    expect(violations).toHaveLength(0)
  })

  it('prohibits defining custom entity-type lookup tables pairing BUS_LISTING and EQUIPMENT_LISTING outside allowed files', () => {
    const violations: { file: string; line: number; match: string }[] = []

    for (const filePath of allCandidateFiles) {
      const relativePath = path.normalize(path.relative(PROJECT_ROOT, filePath))
      const isAllowed = ALLOWED_ENTITY_TYPE_MAP_FILES.some((allowed) =>
        relativePath.endsWith(allowed)
      )
      if (isAllowed) continue

      const content = fs.readFileSync(filePath, 'utf-8')
      // Flag files that define object/map literals pairing BUS_LISTING with EQUIPMENT_LISTING
      if (content.includes('BUS_LISTING') && content.includes('EQUIPMENT_LISTING')) {
        // Exclude plain comments or unrelated text
        const hasMapPattern =
          content.includes("'buses': 'BUS_LISTING'") ||
          content.includes('"buses": "BUS_LISTING"') ||
          content.includes('entityMap') ||
          content.includes('BUS_LISTING:') ||
          /['"]BUS_LISTING['"]\s*:\s*['"]/.test(content)

        if (hasMapPattern) {
          violations.push({
            file: relativePath,
            line: 1,
            match: 'Contains custom BUS_LISTING / EQUIPMENT_LISTING entity-type table',
          })
        }
      }
    }

    if (violations.length > 0) {
      const formatted = violations
        .map((v) => `  - ${v.file}:${v.line} -> ${v.match}`)
        .join('\n')
      throw new Error(
        `Architecture violation: custom entity-type tables pairing BUS_LISTING and EQUIPMENT_LISTING are prohibited outside allowed central files:\n${formatted}`
      )
    }

    expect(violations).toHaveLength(0)
  })
})
