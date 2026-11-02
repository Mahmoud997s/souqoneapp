import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { POST_CATEGORIES } from '../../constants/postCategories'
import { PostCategorySheet } from './PostCategorySheet'
import { PostCategoryTokens } from './postCategoryTokens'

const inlineColorPattern = new RegExp(
  `${String.fromCharCode(35)}[0-9a-f]{3,8}\\b|r${'gba?'}\\(`,
  'i',
)

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

  it('renders the category assets on accessible glass cards', async () => {
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
    for (const category of POST_CATEGORIES) {
      const card = screen.getByLabelText(category.title)
      const icon = screen.getByTestId(`post-category-icon-${category.id}`)
      expect(card.props.accessibilityRole).toBe('button')
      expect(icon.props.source).toEqual(category.icon)
      expect(icon.props.contentFit).toBe('contain')
      expect(screen.getByTestId(`post-category-glass-${category.id}`)).toBeTruthy()
    }
    expect(PostCategoryTokens.cardMinHeight).toBeGreaterThanOrEqual(44)
  })

  it('centers the single parts card at the same width as the other cards', async () => {
    await render(
      <PostCategorySheet
        categories={POST_CATEGORIES}
        topInset={24}
        bottomInset={16}
        onSelectCategory={jest.fn()}
        onCancel={jest.fn()}
      />,
    )

    const partsRow = screen.getByTestId('post-category-parts-row')
    const partsCard = screen.getByTestId('post-category-card-parts')
    const firstCard = screen.getByTestId('post-category-card-cars')
    expect(StyleSheet.flatten(partsRow.props.style).justifyContent).toBe('center')
    expect(StyleSheet.flatten(partsCard.props.style).width).toBe(
      StyleSheet.flatten(firstCard.props.style).width,
    )
  })

  it('reserves the cancel bar and safe-area inset below the category list', async () => {
    const bottomInset = 48
    const rendered = await render(
      <PostCategorySheet
        categories={POST_CATEGORIES}
        topInset={24}
        bottomInset={bottomInset}
        onSelectCategory={jest.fn()}
        onCancel={jest.fn()}
      />,
    )

    const list = screen.getByTestId('post-category-list')
    expect(StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom).toBe(
      PostCategoryTokens.cancelHeight +
        PostCategoryTokens.cancelTopPadding +
        Math.max(bottomInset, Spacing.space4),
    )
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
