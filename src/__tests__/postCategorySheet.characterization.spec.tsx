import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native'
import { router } from 'expo-router'
import {
  navigateToBusForm,
  navigateToCarForm,
  navigateToEquipmentForm,
  navigateToPartForm,
  navigateToServiceForm,
} from '../components/ui/DraftResumePrompt'
import PostCategoryModal from '../../app/(modals)/post-category'

const mockStoreSet = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
}))

jest.mock('../store/postStore', () => {
  const store = jest.fn(() => ({ set: mockStoreSet }))
  return { usePostStore: store }
})

jest.mock('../components/ui/DraftResumePrompt', () => ({
  navigateToBusForm: jest.fn(),
  navigateToCarForm: jest.fn(),
  navigateToEquipmentForm: jest.fn(),
  navigateToPartForm: jest.fn(),
  navigateToServiceForm: jest.fn(),
  showDraftResumePrompt: jest.fn(),
  hasMeaningfulPostData: jest.fn(),
}))

const categoryHandlers = [
  ['سيارات ومركبات', navigateToCarForm],
  ['حافلات', navigateToBusForm],
  ['معدات', navigateToEquipmentForm],
  ['قطع غيار', navigateToPartForm],
  ['خدمات', navigateToServiceForm],
] as const

describe('PostCategoryModal behavior', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('uses a transparent modal presentation only for the post-category sheet', () => {
    const layout = readFileSync(resolve(__dirname, '../../app/(modals)/_layout.tsx'), 'utf8')
    const sheetStyles = readFileSync(
      resolve(__dirname, '../components/post/PostCategorySheet.styles.ts'),
      'utf8',
    )
    const postCategoryOptions = layout.match(
      /name="post-category"\s+options=\{\{([\s\S]*?)\}\}/,
    )?.[1]

    expect(postCategoryOptions).toContain("presentation: 'transparentModal'")
    expect(postCategoryOptions).toContain("animation: 'slide_from_bottom'")
    expect(postCategoryOptions).toContain("backgroundColor: 'transparent'")
    expect(postCategoryOptions).toContain('headerShown: false')
    expect(postCategoryOptions).toContain('gestureEnabled: true')
    expect(sheetStyles).toMatch(/container:\s*\{[\s\S]*?backgroundColor:\s*'transparent'/)
  })

  it.each(categoryHandlers)(
    'selecting %s calls its existing form handler in replace mode',
    async (title, handler) => {
      await render(<PostCategoryModal />)
      await fireEvent.press(screen.getByText(title))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('replace')
      expect(router.replace).not.toHaveBeenCalled()
    },
  )

  it('cancelling calls router.back', async () => {
    await render(<PostCategoryModal />)
    await fireEvent.press(screen.getByText('إلغاء'))
    expect(router.back).toHaveBeenCalledTimes(1)
  })
})
