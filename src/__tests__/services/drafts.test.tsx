import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import ServiceDraftsScreen from '../../../app/services/drafts'
import { useServiceWizardStore, defaultServiceFormData } from '../../store/serviceWizardStore'
import { toastService } from '../../store/toastStore'
import { router } from 'expo-router'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('../../store/toastStore', () => ({
  toastService: {
    confirm: jest.fn(({ onConfirm }) => {
      if (onConfirm) onConfirm()
    }),
    show: jest.fn(),
  },
}))

describe('ServiceDraftsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useServiceWizardStore.setState({
      currentStep: 3,
      formData: {
        ...defaultServiceFormData,
        title: 'مسودة خدمة ميكانيكا',
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders DraftResumeScreen with category "خدمات السيارات" and title', async () => {
    await render(<ServiceDraftsScreen />)

    expect(screen.getByText('خدمات السيارات')).toBeTruthy()
    expect(screen.getByText('مسودة خدمة ميكانيكا')).toBeTruthy()
  })

  it('resumes draft and navigates to /services/new on resume press', async () => {
    await render(<ServiceDraftsScreen />)

    const resumeBtn = screen.getByText('استكمال ونشر الإعلان')
    await act(async () => {
      fireEvent.press(resumeBtn)
    })

    expect(router.replace).toHaveBeenCalledWith('/services/new')
  })

  it('discards draft, resets store, and navigates to /services/new on discard press', async () => {
    await render(<ServiceDraftsScreen />)

    const discardBtn = screen.getByText('تجاهل المسودة والبدء من جديد')
    await act(async () => {
      fireEvent.press(discardBtn)
    })

    expect(toastService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'مسح المسودة',
        message: expect.stringContaining('هل أنت متأكد؟'),
        intent: 'danger',
        confirmLabel: 'مسح',
        cancelLabel: 'إلغاء',
        onConfirm: expect.any(Function),
      })
    )
    expect(useServiceWizardStore.getState().formData.title).toBe('')
    expect(router.replace).toHaveBeenCalledWith('/services/new')
  })
})
