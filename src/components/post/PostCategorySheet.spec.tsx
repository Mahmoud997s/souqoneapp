import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { Colors } from '../../constants/colors'
import { POST_CATEGORIES } from '../../constants/postCategories'
import { PostCategorySheet } from './PostCategorySheet'
import { PostCategoryTokens } from './postCategoryTokens'

const inlineColorPattern = new RegExp(
  `${String.fromCharCode(35)}[0-9a-f]{3,8}\\b|r${'gba?'}\\(`,
  'i',
)

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: NativeView } = require('react-native')
  return {
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(NativeView, { ...props }),
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(NativeView, { ...props }),
  }
})

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View: NativeView } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) => ReactLib.createElement(NativeView, props),
  }
})

jest.mock('../navigation/glassSupport', () => {
  const ReactLib = require('react')
  const { View: NativeView } = require('react-native')
  return {
    GlassSurface: ({ testID }: { testID?: string }) =>
      ReactLib.createElement(NativeView, { testID }),
  }
})

describe('PostCategorySheet visual contract', () => {
  afterEach(cleanup)

  it('renders ~2/3 sheet height with dim backdrop that calls onCancel on press', async () => {
    const onCancel = jest.fn()
    await render(
      <PostCategorySheet
        categories={POST_CATEGORIES}
        topInset={24}
        bottomInset={16}
        onSelectCategory={jest.fn()}
        onCancel={onCancel}
      />,
    )

    const backdrop = screen.getByTestId('post-category-backdrop')
    const sheet = screen.getByTestId('post-category-sheet')
    expect(backdrop).toBeTruthy()
    expect(StyleSheet.flatten(sheet.props.style).height).toBeGreaterThanOrEqual(535)

    await fireEvent.press(backdrop)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders 5 compact horizontal rectangular rows in exact order with paleMint icon box and chevron-back', async () => {
    await render(
      <PostCategorySheet
        categories={POST_CATEGORIES}
        topInset={24}
        bottomInset={16}
        onSelectCategory={jest.fn()}
        onCancel={jest.fn()}
      />,
    )

    expect(screen.getByTestId('post-category-sheet-glass')).toBeTruthy()
    expect(POST_CATEGORIES.map((c) => c.id)).toEqual([
      'cars',
      'buses',
      'equipment',
      'services',
      'parts',
    ])

    for (const category of POST_CATEGORIES) {
      const card = screen.getByTestId(`post-category-card-${category.id}`)
      const iconBox = screen.getByTestId(`post-category-icon-box-${category.id}`)
      const icon = screen.getByTestId(`post-category-icon-${category.id}`)
      const chevron = screen.getByTestId(`post-category-chevron-${category.id}`)

      expect(card.props.accessibilityRole).toBe('button')
      expect(StyleSheet.flatten(card.props.style).width).toBe('100%')
      expect(StyleSheet.flatten(card.props.style).height).toBe(64)
      expect(StyleSheet.flatten(iconBox.props.style).backgroundColor).toBe(Colors.paleMint)
      expect(icon.props.name).toBe(category.icon)
      expect(icon.props.size).toBe(24)
      expect(icon.props.color).toBe(Colors.primary)
      expect(chevron.props.name).toBe('chevron-back')
      expect(screen.getByTestId(`post-category-glass-${category.id}`)).toBeTruthy()
    }
    expect(PostCategoryTokens.rowHeight).toBe(64)
    expect(PostCategoryTokens.rowGap).toBe(10)
  })

  it('fits all 5 rows, header, and cancel button inside 2/3 sheet height without scrolling on standard phones', async () => {
    const bottomInset = 16
    await render(
      <PostCategorySheet
        categories={POST_CATEGORIES}
        topInset={24}
        bottomInset={bottomInset}
        onSelectCategory={jest.fn()}
        onCancel={jest.fn()}
      />,
    )

    const list = screen.getByTestId('post-category-list')
    expect(list.props.bounces).toBe(false)

    const rowsTotal =
      POST_CATEGORIES.length * PostCategoryTokens.rowHeight +
      (POST_CATEGORIES.length - 1) * PostCategoryTokens.rowGap
    const chromeHeight =
      PostCategoryTokens.handleTopPadding +
      PostCategoryTokens.handleHeight +
      PostCategoryTokens.handleBottomPadding +
      PostCategoryTokens.sheetTitleLineHeight +
      Spacing.space1 +
      PostCategoryTokens.sheetSubtitleLineHeight +
      PostCategoryTokens.titleBottomGap +
      PostCategoryTokens.cancelTopPadding +
      PostCategoryTokens.cancelHeight +
      Math.max(bottomInset, Spacing.space4)

    expect(rowsTotal + chromeHeight).toBeLessThanOrEqual(544)
  })

  it('keeps the category implementation free of inline color literals', () => {
    const files = [
      resolve(__dirname, '../../../app/(modals)/post-category.tsx'),
      resolve(__dirname, './PostCategoryCard.tsx'),
      resolve(__dirname, './PostCategorySheet.tsx'),
      resolve(__dirname, './PostCategorySheet.styles.ts'),
      resolve(__dirname, './postCategoryTokens.ts'),
      resolve(__dirname, '../../constants/postCategories.ts'),
    ]

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toMatch(inlineColorPattern)
    }
  })
})
