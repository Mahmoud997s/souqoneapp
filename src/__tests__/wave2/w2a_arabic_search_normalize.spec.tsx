import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { normalizeArabic, matchesArabicQuery } from '../../utils/arabicNormalize'
import { SearchableSelectModal } from '../../components/ui/SearchableSelectModal'
import { MultiSelectSearchModal } from '../../components/ui/MultiSelectSearchModal'
import { NestedSearchableList } from '../../components/ui/NestedSearchableList'

describe('Wave 2a (2.5 / F-04): Client-Side Arabic Search Normalization', () => {
  it('normalizeArabic normalizes alef variants, teh marbuta, alif maksura, tashkeel, tatweel, and Arabic/Persian digits', () => {
    expect(normalizeArabic('أودي')).toBe('اودي')
    expect(normalizeArabic('إلنترا')).toBe('النترا')
    expect(normalizeArabic('آكسنت')).toBe('اكسنت')
    expect(normalizeArabic('مَـازْدَا')).toBe('مازدا')
    expect(normalizeArabic('سيارة')).toBe('سياره')
    expect(normalizeArabic('مرمى')).toBe('مرمي')
    expect(normalizeArabic('٢٠٢٤ / ۱۴۰۳')).toBe('2024 / 1403')
    expect(normalizeArabic('  تويوتا CAMRY  ')).toBe('تويوتا camry')
  })

  it('matchesArabicQuery matches "اودي" against "أودي" and supports aliases', () => {
    expect(matchesArabicQuery('أودي', 'اودي')).toBe(true)
    expect(matchesArabicQuery('الباطنة', 'الباطنه')).toBe(true)
    expect(matchesArabicQuery('تويوتا', 'toyota', 'Toyota')).toBe(true)
    expect(matchesArabicQuery('تويوتا', 'نيسان')).toBe(false)
    expect(matchesArabicQuery('أودي', '   ')).toBe(true)
  })

  it('SearchableSelectModal matches "أودي" when user types "اودي"', async () => {
    const data = [
      { id: 'audi', label: 'أودي' },
      { id: 'toyota', label: 'تويوتا' },
    ]
    const { getByPlaceholderText, queryByText } = await render(
      <SearchableSelectModal
        visible={true}
        title="اختر الماركة"
        data={data}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        placeholder="ابحث هنا..."
      />
    )
    await fireEvent.changeText(getByPlaceholderText('ابحث هنا...'), 'اودي')
    expect(queryByText('أودي')).toBeTruthy()
    expect(queryByText('تويوتا')).toBeNull()
  })

  it('MultiSelectSearchModal matches "أودي" when user types "اودي"', async () => {
    const data = [
      { id: 'audi', label: 'أودي' },
      { id: 'toyota', label: 'تويوتا' },
    ]
    const { getByPlaceholderText, queryByText } = await render(
      <MultiSelectSearchModal
        visible={true}
        title="اختر الماركات"
        data={data}
        selectedValues={[]}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        placeholder="ابحث هنا..."
      />
    )
    await fireEvent.changeText(getByPlaceholderText('ابحث هنا...'), 'اودي')
    expect(queryByText('أودي')).toBeTruthy()
    expect(queryByText('تويوتا')).toBeNull()
  })

  it('NestedSearchableList matches "أودي" when user types "اودي"', async () => {
    const data = [
      { id: 'audi', label: 'أودي', value: 'Audi' },
      { id: 'toyota', label: 'تويوتا', value: 'Toyota' },
    ]
    const { getByPlaceholderText, queryByText } = await render(
      <NestedSearchableList
        data={data}
        onSelect={jest.fn()}
        placeholder="ابحث هنا..."
      />
    )
    await fireEvent.changeText(getByPlaceholderText('ابحث هنا...'), 'اودي')
    expect(queryByText('أودي')).toBeTruthy()
    expect(queryByText('تويوتا')).toBeNull()
  })
})
