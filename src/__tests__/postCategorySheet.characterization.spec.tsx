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

  it('presents the modal group transparently and keeps sibling modals opaque', () => {
    const rootLayout = readFileSync(resolve(__dirname, '../../app/_layout.tsx'), 'utf8')
    const layout = readFileSync(resolve(__dirname, '../../app/(modals)/_layout.tsx'), 'utf8')
    const sheetStyles = readFileSync(
      resolve(__dirname, '../components/post/PostCategorySheet.styles.ts'),
      'utf8',
    )
    const filtersScreen = readFileSync(resolve(__dirname, '../../app/(modals)/filters.tsx'), 'utf8')
    const imageViewerScreen = readFileSync(
      resolve(__dirname, '../../app/(modals)/image-viewer.tsx'),
      'utf8',
    )
    const presentingOptions = rootLayout.match(
      /name="\(modals\)"\s+options=\{\{([\s\S]*?)\}\}/,
    )?.[1]
    const postCategoryOptions = layout.match(
      /name="post-category"\s+options=\{\{([\s\S]*?)\}\}/,
    )?.[1]
    const filtersOptions = layout.match(/name="filters"\s+options=\{\{([\s\S]*?)\}\}/)?.[1]
    const imageViewerOptions = layout.match(
      /name="image-viewer"\s+options=\{\{([\s\S]*?)\}\}/,
    )?.[1]
    const opaqueBlack = `${String.fromCharCode(35)}000`

    expect(presentingOptions).toContain("presentation: 'transparentModal'")
    expect(presentingOptions).toContain("animation: 'slide_from_bottom'")
    expect(presentingOptions).toContain('gestureEnabled: true')
    expect(postCategoryOptions).toContain("backgroundColor: 'transparent'")
    expect(postCategoryOptions).toContain('headerShown: false')
    expect(postCategoryOptions).toContain('gestureEnabled: true')
    expect(filtersOptions).toContain("presentation: 'modal'")
    expect(filtersOptions).toContain('backgroundColor: Colors.surface')
    expect(filtersScreen).toMatch(/container:\s*\{[\s\S]*?backgroundColor:\s*Colors\.surface/)
    expect(imageViewerOptions).toContain("presentation: 'fullScreenModal'")
    expect(imageViewerScreen).toContain(`backgroundColor: '${opaqueBlack}'`)
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
