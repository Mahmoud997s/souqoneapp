import React from 'react'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '../../..')

describe('D-356: Parts wizard stepper & layout parity with cars/equipment', () => {
  it('app/parts/new.tsx renders light Stepper + draftBar inside ScrollView without topBar or cardWrapper', () => {
    const partsSrc = fs.readFileSync(path.join(ROOT, 'app/parts/new.tsx'), 'utf8')
    const eqSrc = fs.readFileSync(path.join(ROOT, 'app/equipment/new.tsx'), 'utf8')

    // Forbidden legacy Parts-only containers
    expect(partsSrc).not.toMatch(/s\.topBar/)
    expect(partsSrc).not.toMatch(/topBar:/)
    expect(partsSrc).not.toMatch(/stepHeaderRow/)
    expect(partsSrc).not.toMatch(/s\.cardWrapper/)
    expect(partsSrc).not.toMatch(/cardWrapper:/)

    // Stepper must be inside ScrollView / WizardKeyboardScrollView with title={getStepTitle()} and variant="light"
    const scrollBlock = partsSrc.match(/<(?:ScrollView|WizardKeyboardScrollView)[\s\S]*?<\/(?:ScrollView|WizardKeyboardScrollView)>/)
    expect(scrollBlock).not.toBeNull()
    expect(scrollBlock![0]).toMatch(/getWizardContentPaddingTop\(insets\.top\)/)
    expect(scrollBlock![0]).toMatch(/<Stepper[\s\S]*?title=\{getStepTitle\(\)\}[\s\S]*?variant="light"/)

    // Same draftBar structure and text as equipment/new.tsx
    expect(scrollBlock![0]).toMatch(/style=\{s\.draftBar\}/)
    expect(scrollBlock![0]).toContain('يتم حفظ مسودتك تلقائياً')
    expect(scrollBlock![0]).toContain('مسح والبدء من جديد')
    expect(eqSrc).toContain('يتم حفظ مسودتك تلقائياً')
    expect(eqSrc).toContain('مسح والبدء من جديد')
  })
})
