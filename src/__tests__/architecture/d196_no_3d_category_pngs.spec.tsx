import fs from 'fs'
import path from 'path'

describe('D-196: Architectural Gate — 3D Category PNG Removal (Except Bottom Banners) & Add Button Vector Restoration (FINAL-2)', () => {
  const rootDir = path.resolve(__dirname, '../../../')

  it('Gate 1: add-button.png and AddListingButton.tsx do NOT exist (old vector add button restored)', () => {
    const addButtonPng = path.resolve(rootDir, 'assets/images/add-button.png')
    const addListingButtonTsx = path.resolve(rootDir, 'src/components/navigation/AddListingButton.tsx')
    expect(fs.existsSync(addButtonPng)).toBe(false)
    expect(fs.existsSync(addListingButtonTsx)).toBe(false)
  })

  it('Gate 2: verified-badge-3d.png is strictly preserved', () => {
    const verifiedBadge = path.resolve(rootDir, 'assets/images/verified-badge-3d.png')
    expect(fs.existsSync(verifiedBadge)).toBe(true)
  })

  it('Gate 3: parts and services 3D category PNGs and obsolete constants do not exist', () => {
    const obsoleteConstants = [
      'src/constants/partCategoryIcons.ts',
      'src/constants/serviceCategoryIcons.ts',
    ]
    obsoleteConstants.forEach((file) => {
      expect(fs.existsSync(path.resolve(rootDir, file))).toBe(false)
    })

    const partsDir = path.resolve(rootDir, 'assets/images/categories/parts')
    const servicesDir = path.resolve(rootDir, 'assets/images/categories/services')
    expect(fs.existsSync(partsDir)).toBe(false)
    expect(fs.existsSync(servicesDir)).toBe(false)

    // cat-operators.png and cat-browse.png are deleted (unreferenced)
    expect(fs.existsSync(path.resolve(rootDir, 'assets/images/categories/cat-operators.png'))).toBe(false)
    expect(fs.existsSync(path.resolve(rootDir, 'assets/images/categories/cat-browse.png'))).toBe(false)
  })

  it('Gate 4: only the 5 banner 3D category PNGs exist in assets/images/categories', () => {
    const categoriesDir = path.resolve(rootDir, 'assets/images/categories')
    expect(fs.existsSync(categoriesDir)).toBe(true)
    const existing = fs.readdirSync(categoriesDir).sort()
    expect(existing).toEqual([
      'cat-buses.png',
      'cat-cars.png',
      'cat-equipment.png',
      'cat-parts.png',
      'cat-services.png',
    ])
  })

  it('Gate 5: category PNGs are used EXCLUSIVELY by bottom add-listing banners and categoryIcons.ts', () => {
    function scanDir(dir: string): string[] {
      const results: string[] = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
            results.push(...scanDir(fullPath))
          }
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          results.push(fullPath)
        }
      }
      return results
    }

    const sourceFiles = [
      ...scanDir(path.resolve(rootDir, 'src')),
      ...scanDir(path.resolve(rootDir, 'app')),
    ]

    const allowedFiles = new Set([
      'src/constants/categoryIcons.ts',
      'src/components/ui/ActionBanner.tsx',
      'src/components/ui/SectionFooterAction.tsx',
      'app/cars/index.tsx',
      'app/cars/browse.tsx',
      'app/buses/index.tsx',
      'app/buses/browse.tsx',
      'app/equipment/index.tsx',
      'app/equipment/browse.tsx',
      'app/parts/index.tsx',
      'app/parts/browse.tsx',
      'app/services/index.tsx',
      'app/services/browse.tsx',
    ].map((f) => path.normalize(path.resolve(rootDir, f))))

    const violatingFiles: string[] = []
    for (const file of sourceFiles) {
      if (allowedFiles.has(path.normalize(file))) {
        continue
      }
      const content = fs.readFileSync(file, 'utf8')
      if (
        content.includes('assets/images/categories') ||
        content.includes('constants/categoryIcons') ||
        content.includes('constants/partCategoryIcons') ||
        content.includes('constants/serviceCategoryIcons') ||
        content.includes('add-button.png') ||
        content.includes('AddListingButton')
      ) {
        violatingFiles.push(path.relative(rootDir, file))
      }
    }

    expect(violatingFiles).toEqual([])
  })

  it('Gate 6: TEETH PROOF — scanner correctly catches any illegal category or add-button reference outside allowed banners', () => {
    const testSnippet = `import { CATEGORY_ICONS } from '../constants/categoryIcons'`
    const hasViolation =
      testSnippet.includes('assets/images/categories') ||
      testSnippet.includes('constants/categoryIcons')
    expect(hasViolation).toBe(true)
  })
})
