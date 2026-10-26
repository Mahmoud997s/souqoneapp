import { buildOperatorChips } from './buildOperatorChips'

describe('buildOperatorChips', () => {
  it('case 1: returns empty chips and 0 extraCount when all inputs are empty (0 chips)', () => {
    const result = buildOperatorChips({
      operatorTypeLabel: null,
      experienceText: null,
      hasCertifications: false,
      equipmentTags: [],
      maxChips: 3,
    })

    expect(result.chips).toEqual([])
    expect(result.extraCount).toBe(0)
    expect(result.totalChips).toBe(0)
  })

  it('case 2: returns exactly maxChips with extraCount = 0 when total equals maxChips', () => {
    const result = buildOperatorChips({
      operatorTypeLabel: 'مشغل معدات',
      experienceText: '5 سنوات خبرة',
      hasCertifications: true,
      equipmentTags: [],
      maxChips: 3,
    })

    expect(result.chips).toHaveLength(3)
    expect(result.chips[0].key).toBe('type')
    expect(result.chips[1].key).toBe('exp')
    expect(result.chips[2].key).toBe('cert')
    expect(result.extraCount).toBe(0)
    expect(result.totalChips).toBe(3)
  })

  it('case 3: returns maxChips and extraCount = 1 when total is maxChips + 1', () => {
    const result = buildOperatorChips({
      operatorTypeLabel: 'مشغل معدات',
      experienceText: '5 سنوات خبرة',
      hasCertifications: true,
      equipmentTags: ['حفار'],
      maxChips: 3,
    })

    expect(result.chips).toHaveLength(3)
    expect(result.extraCount).toBe(1)
    expect(result.totalChips).toBe(4)
    expect(result.chips.map((c) => c.key)).toEqual(['type', 'exp', 'cert'])
  })

  it('case 4a: includes certification in slot #3 before equipment tags when hasCertifications is true', () => {
    const result = buildOperatorChips({
      operatorTypeLabel: 'مشغل رافعة',
      experienceText: null,
      hasCertifications: true,
      equipmentTags: ['رافعة برجية', 'بلدوزر'],
      maxChips: 3,
    })

    expect(result.chips).toHaveLength(3)
    expect(result.chips[0].key).toBe('type')
    expect(result.chips[1].key).toBe('cert')
    expect(result.chips[2].key).toBe('eq-0')
    expect(result.extraCount).toBe(1)
    expect(result.totalChips).toBe(4)
  })

  it('case 4b: replaces certification slot with equipment tags when hasCertifications is false', () => {
    const result = buildOperatorChips({
      operatorTypeLabel: 'مشغل رافعة',
      experienceText: null,
      hasCertifications: false,
      equipmentTags: ['رافعة برجية', 'بلدوزر'],
      maxChips: 3,
    })

    expect(result.chips).toHaveLength(3)
    expect(result.chips[0].key).toBe('type')
    expect(result.chips[1].key).toBe('eq-0')
    expect(result.chips[2].key).toBe('eq-1')
    expect(result.extraCount).toBe(0)
    expect(result.totalChips).toBe(3)
  })

  it('case 5: respects maxChips = 1 with multiple items and computes extraCount correctly', () => {
    const result = buildOperatorChips({
      operatorTypeLabel: 'مشغل معدات',
      experienceText: '8 سنوات خبرة',
      hasCertifications: true,
      equipmentTags: ['حفار', 'جرافة'],
      maxChips: 1,
    })

    expect(result.chips).toHaveLength(1)
    expect(result.chips[0].key).toBe('type')
    expect(result.extraCount).toBe(4)
    expect(result.totalChips).toBe(5)
  })
})
