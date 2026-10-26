import { filterSpecsSections } from './filterSpecsSections'
import type { SpecSectionView } from '../../types/carDetailViewModel.types'

describe('filterSpecsSections', () => {
  const sampleSections: SpecSectionView[] = [
    {
      title: 'المواصفات العامة',
      items: [
        { key: 'year', label: 'سنة الصنع', value: '2024' },
        { key: 'transmission', label: 'ناقل الحركة', value: 'أوتوماتيك' },
        { key: 'fuel', label: 'نوع الوقود', value: 'بنزين' },
      ],
    },
    {
      title: 'الميزات والكماليات',
      items: [
        { key: 'sunroof', label: 'فتحة سقف', value: '' },
        { key: 'camera', label: 'كاميرا خلفية', value: '' },
        { key: 'navigation', label: 'نظام ملاحة', value: '' },
      ],
    },
  ]

  it('returns all sections unmodified when query is empty or whitespace', () => {
    expect(filterSpecsSections(sampleSections, '')).toEqual(sampleSections)
    expect(filterSpecsSections(sampleSections, '   ')).toEqual(sampleSections)
  })

  it('filters sections and items matching label (case-insensitive substring)', () => {
    const result = filterSpecsSections(sampleSections, 'ناقل')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('المواصفات العامة')
    expect(result[0].items).toEqual([{ key: 'transmission', label: 'ناقل الحركة', value: 'أوتوماتيك' }])
  })

  it('filters sections and items matching value (case-insensitive substring)', () => {
    const result = filterSpecsSections(sampleSections, 'بنزين')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('المواصفات العامة')
    expect(result[0].items).toEqual([{ key: 'fuel', label: 'نوع الوقود', value: 'بنزين' }])
  })

  it('filters feature chips by label', () => {
    const result = filterSpecsSections(sampleSections, 'كاميرا')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('الميزات والكماليات')
    expect(result[0].items).toEqual([{ key: 'camera', label: 'كاميرا خلفية', value: '' }])
  })

  it('omits sections that have zero matching items', () => {
    const result = filterSpecsSections(sampleSections, 'فتحة')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('الميزات والكماليات')
  })

  it('returns empty array when no item matches query anywhere', () => {
    const result = filterSpecsSections(sampleSections, 'صاروخ فضائي')
    expect(result).toEqual([])
  })

  it('filters buyer-valuable fields such as delivery, operator, and contract type (D-097)', () => {
    const mixedBuyerSections: SpecSectionView[] = [
      {
        title: 'المواصفات الفنية',
        items: [
          { key: 'hoursUsed', label: 'ساعات العمل', value: '3,500 ساعة' },
          { key: 'withOperator', label: 'مشغّل المعدة', value: 'مع مشغّل' },
          { key: 'deliveryAvailable', label: 'خدمة التوصيل', value: 'متوفر' },
        ],
      },
      {
        title: 'المواصفات الأساسية',
        items: [
          { key: 'contractType', label: 'نوع العقد', value: 'نقل مدرسي / جامعي' },
        ],
      },
    ]

    const filterDelivery = filterSpecsSections(mixedBuyerSections, 'التوصيل')
    expect(filterDelivery).toHaveLength(1)
    expect(filterDelivery[0].items).toEqual([
      { key: 'deliveryAvailable', label: 'خدمة التوصيل', value: 'متوفر' },
    ])

    const filterOperator = filterSpecsSections(mixedBuyerSections, 'مشغّل')
    expect(filterOperator).toHaveLength(1)
    expect(filterOperator[0].items).toEqual([
      { key: 'withOperator', label: 'مشغّل المعدة', value: 'مع مشغّل' },
    ])

    const filterContract = filterSpecsSections(mixedBuyerSections, 'مدرسي')
    expect(filterContract).toHaveLength(1)
    expect(filterContract[0].items).toEqual([
      { key: 'contractType', label: 'نوع العقد', value: 'نقل مدرسي / جامعي' },
    ])
  })

  it('safely handles null and undefined inputs', () => {
    expect(filterSpecsSections(null, 'test')).toEqual([])
    expect(filterSpecsSections(undefined, 'test')).toEqual([])
  })
})
