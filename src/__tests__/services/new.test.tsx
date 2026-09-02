import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import NewServiceListingScreen from '../../../app/services/new'
import { useServiceWizardStore, defaultServiceFormData } from '../../store/serviceWizardStore'
import { dialogService } from '../../store/dialogStore'
import { servicesApi } from '../../api/services'
import { WORKING_DAYS_AR } from '../../constants/services'
import { router } from 'expo-router'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: () => null,
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

jest.mock('@tanstack/react-query', () => {
  return {
    useMutation: ({ mutationFn }: any) => ({
      mutate: jest.fn((data, options) => {
        mutationFn(data)
        if (options?.onSuccess) options.onSuccess({ data: { id: 'srv-123' } })
      }),
      isPending: false,
    }),
  }
})

jest.mock('../../api/services', () => ({
  servicesApi: {
    create: jest.fn().mockResolvedValue({ data: { id: 'srv-123' } }),
    update: jest.fn().mockResolvedValue({ data: { id: 'srv-123' } }),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn().mockResolvedValue({ data: { url: 'https://cdn.souqone.app/img1.jpg' } }),
    removeServiceImage: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn((title, msg, onConfirm) => {
      if (onConfirm) onConfirm()
    }),
    alert: jest.fn(),
  },
}))

describe('NewServiceListingScreen (Wizard Route)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useServiceWizardStore.setState({
      currentStep: 1,
      formData: { ...defaultServiceFormData },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('prevents step advancement when current step has validation errors', async () => {
    await render(<NewServiceListingScreen />)

    const nextBtn = screen.getByText('متابعة الخطوة التالية')
    await act(async () => {
      fireEvent.press(nextBtn)
    })

    // Current step stays at 1 because fields are missing
    expect(useServiceWizardStore.getState().currentStep).toBe(1)
    expect(screen.getByText('اختر نوع الخدمة')).toBeTruthy()
  })

  it('advances to Step 2 when Step 1 is valid', async () => {
    useServiceWizardStore.setState({
      currentStep: 1,
      formData: {
        ...defaultServiceFormData,
        serviceType: 'MAINTENANCE',
        providerType: 'WORKSHOP',
        providerName: 'كراج السرعة',
      },
    })

    await render(<NewServiceListingScreen />)

    const nextBtn = screen.getByText('متابعة الخطوة التالية')
    await act(async () => {
      fireEvent.press(nextBtn)
    })

    expect(useServiceWizardStore.getState().currentStep).toBe(2)
  })

  it('triggers exit dialog when clicking back from Step 1', async () => {
    useServiceWizardStore.setState({
      currentStep: 1,
      formData: { ...defaultServiceFormData },
    })

    await render(<NewServiceListingScreen />)

    const backBtn = screen.getByLabelText('رجوع')
    await act(async () => {
      fireEvent.press(backBtn)
    })

    expect(dialogService.confirm).toHaveBeenCalledWith(
      'الخروج من النموذج',
      expect.stringContaining('هل تريد الخروج؟'),
      expect.any(Function),
      'خروج',
      'متابعة الإعلان'
    )
    expect(router.back).toHaveBeenCalled()
  })

  it('submits valid payload auto-filling all 7 workingDays when empty and casting numbers', async () => {
    useServiceWizardStore.setState({
      currentStep: 6,
      formData: {
        ...defaultServiceFormData,
        serviceType: 'MAINTENANCE',
        providerType: 'WORKSHOP',
        providerName: 'كراج السرعة',
        images: [{ uri: 'https://cdn.souqone.app/img.jpg' }],
        title: 'صيانة شاملة للسيارات',
        description: 'فحص كمبيوتر وتغيير زيوت مع ضمان شهرين كاملين',
        specializations: ['تغيير زيت وفلاتر'],
        priceFrom: 30,
        priceTo: null,
        governorateId: 1,
        wilayaId: 101,
        workingDays: [], // Empty -> must be auto-filled with all 7 days
      },
    })

    await render(<NewServiceListingScreen />)

    const publishBtn = screen.getByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(publishBtn)
    })

    expect(servicesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'صيانة شاملة للسيارات',
        serviceType: 'MAINTENANCE',
        providerType: 'WORKSHOP',
        providerName: 'كراج السرعة',
        priceFrom: 30,
        governorateId: 1,
        wilayaId: 101,
        workingDays: WORKING_DAYS_AR,
      })
    )
  })
})
