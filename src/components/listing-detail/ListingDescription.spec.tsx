import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ListingDescription } from './ListingDescription'

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: any) => <View testID="mock-icon" {...props} /> }
})

describe('ListingDescription', () => {
  it('returns null when text is empty or blank', async () => {
    const { toJSON } = await render(<ListingDescription text="" />)
    expect(toJSON()).toBeNull()

    const { toJSON: toJSON2 } = await render(<ListingDescription text="   " />)
    expect(toJSON2()).toBeNull()
  })

  it('renders stripped plain text without raw markdown symbols', async () => {
    const markdown = '**حافلة بحالة ممتازة**\n# مواصفات خاصة\n* إطارات جديدة'
    await render(<ListingDescription text={markdown} />)

    expect(screen.queryByText('**حافلة بحالة ممتازة**')).toBeNull()
    expect(screen.getByText(/حافلة بحالة ممتازة/)).toBeTruthy()
    expect(screen.getByText(/مواصفات خاصة/)).toBeTruthy()
    expect(screen.getByText(/إطارات جديدة/)).toBeTruthy()
  })

  it('shows expand toggle button for text > 120 chars and toggles expand state', async () => {
    const longText = 'هذا وصف طويل جداً يتجاوز مائة وعشرين حرفاً لغرض اختبار ظهور زر قراءة المزيد وإمكانية توسيع الوصف وقراءته كاملاً بدون أي مشاكل في العرض أو التنسيق.'
    await render(<ListingDescription text={longText} />)

    const toggleBtn = screen.getByTestId('btn-toggle-description')
    expect(toggleBtn).toBeTruthy()
    expect(screen.getByText('قراءة المزيد')).toBeTruthy()

    await fireEvent.press(toggleBtn)
    expect(screen.getByText('عرض أقل')).toBeTruthy()

    await fireEvent.press(toggleBtn)
    expect(screen.getByText('قراءة المزيد')).toBeTruthy()
  })
})
