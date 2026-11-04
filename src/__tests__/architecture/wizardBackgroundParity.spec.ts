import fs from 'fs'
import path from 'path'
import { Colors } from '../../constants/colors'

const WIZARD_SCREEN_FILES = [
  { vertical: 'cars', file: 'app/cars/new.tsx' },
  { vertical: 'buses', file: 'app/buses/new.tsx' },
  { vertical: 'equipment', file: 'app/equipment/new.tsx' },
  { vertical: 'parts', file: 'app/parts/new.tsx' },
  { vertical: 'services', file: 'app/services/new.tsx' },
  { vertical: 'operators-add', file: 'app/equipment/operators/add.tsx' },
  { vertical: 'operators-edit', file: 'app/equipment/operators/edit/[id].tsx' },
  { vertical: 'draft-resume', file: 'src/components/post/DraftResumeScreen.tsx' },
]

describe('D-198: Wizard Background Parity with Home Screen', () => {
  describe('Repo-level static assertions (teeth: no ambient backdrop or orbs)', () => {
    it('ensures no wizard screen contains legacy ambient gradient backdrop colors (#EAF2FF, #F3EEFF, #FFF6EE)', () => {
      const violations: string[] = []
      const forbiddenColors = ['#EAF2FF', '#F3EEFF', '#FFF6EE']

      WIZARD_SCREEN_FILES.forEach(({ vertical, file }) => {
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, 'utf8')
        forbiddenColors.forEach((color) => {
          if (content.toLowerCase().includes(color.toLowerCase())) {
            violations.push(`${file} (${vertical}) still contains forbidden backdrop color ${color}`)
          }
        })
      })

      expect(violations).toEqual([])
    })

    it('ensures no wizard screen contains orbPrimary or orbAccent backdrop orbs', () => {
      const violations: string[] = []

      WIZARD_SCREEN_FILES.forEach(({ vertical, file }) => {
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, 'utf8')
        if (content.includes('orbPrimary') || content.includes('orbAccent')) {
          violations.push(`${file} (${vertical}) still references orbPrimary or orbAccent`)
        }
      })

      expect(violations).toEqual([])
    })

    it('ensures every wizard screen sets root background to Colors.homeBg', () => {
      const violations: string[] = []

      WIZARD_SCREEN_FILES.forEach(({ vertical, file }) => {
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, 'utf8')
        const hasHomeBgInRoot =
          content.includes('backgroundColor: Colors.homeBg') ||
          content.includes("backgroundColor: '#F8F9FB'")

        if (!hasHomeBgInRoot) {
          violations.push(`${file} (${vertical}) root does not reference Colors.homeBg`)
        }
      })

      expect(violations).toEqual([])
    })
  })

  describe('Per-vertical background verification', () => {
    WIZARD_SCREEN_FILES.forEach(({ vertical, file }) => {
      it(`verifies ${vertical} (${file}) has flat Colors.homeBg root and no LinearGradient backdrop`, () => {
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, 'utf8')

        // Must reference Colors.homeBg
        expect(content.includes('backgroundColor: Colors.homeBg')).toBe(true)

        // Must not render ambient LinearGradient backdrop
        expect(content.includes("['#EAF2FF'")).toBe(false)
        expect(content.includes("'#FFF6EE'")).toBe(false)
        expect(content.includes('s.orbPrimary')).toBe(false)
        expect(content.includes('styles.orbPrimary')).toBe(false)
      })
    })
  })
})
