import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ListingDescription } from './ListingDescription'
import { Spacing } from '../../constants/spacing'

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

  it('enforces >= 44pt touch target on toggle button and distinct heading/body Almarai scale (F-03)', async () => {
    const longText = 'هذا وصف طويل جداً يتجاوز مائة وعشرين حرفاً لغرض اختبار ظهور زر قراءة المزيد وإمكانية توسيع الوصف وقراءته كاملاً بدون أي مشاكل في العرض أو التنسيق.'
    await render(<ListingDescription text={longText} />)

    const toggleBtn = screen.getByTestId('btn-toggle-description')
    const toggleBtnStyle = StyleSheet.flatten(toggleBtn.props.style)
    expect(toggleBtnStyle?.minHeight).toBeGreaterThanOrEqual(Spacing.touch)

    const heading = screen.getByText('الوصف')
    const body = screen.getByText(longText)
    const toggleLabel = screen.getByText('قراءة المزيد')

    const headingStyle = StyleSheet.flatten(heading.props.style)
    const bodyStyle = StyleSheet.flatten(body.props.style)
    const toggleLabelStyle = StyleSheet.flatten(toggleLabel.props.style)

    expect(headingStyle?.fontSize).toBe(16)
    expect(bodyStyle?.fontSize).toBe(14)
    expect(headingStyle!.fontSize! - bodyStyle!.fontSize!).toBeGreaterThanOrEqual(2)
    expect(toggleLabelStyle?.fontSize).toBeGreaterThanOrEqual(11)
    expect(toggleLabelStyle?.writingDirection).toBe('rtl')
  })

  it('exposes accessibilityRole button and dynamic accessibilityLabel on toggle', async () => {
    const longText = 'هذا وصف طويل جداً يتجاوز مائة وعشرين حرفاً لغرض اختبار ظهور زر قراءة المزيد وإمكانية توسيع الوصف وقراءته كاملاً بدون أي مشاكل في العرض أو التنسيق.'
    await render(<ListingDescription text={longText} />)

    const toggleBtn = screen.getByTestId('btn-toggle-description')
    expect(toggleBtn.props.accessibilityRole).toBe('button')
    expect(toggleBtn.props.accessibilityLabel).toBe('قراءة المزيد')

    await fireEvent.press(toggleBtn)
    expect(toggleBtn.props.accessibilityLabel).toBe('عرض أقل')
  })

  it('shows toggle when text has more linebreaks than collapsedLines even if length <= 120 chars', async () => {
    const shortMultiLine = 'سطر أول\nسطر ثانٍ\nسطر ثالث\nسطر رابع'
    await render(<ListingDescription text={shortMultiLine} collapsedLines={2} />)

    const toggleBtn = screen.getByTestId('btn-toggle-description')
    expect(toggleBtn).toBeTruthy()
  })
})
