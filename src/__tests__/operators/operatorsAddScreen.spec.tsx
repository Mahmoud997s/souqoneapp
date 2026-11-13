import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AddOperatorScreen from '../../../app/equipment/operators/add'
import { dialogService } from '../../store/dialogStore'
import * as equipmentHooks from '../../hooks/useEquipment'
import { useOperatorWizardStore } from '../../store/operatorWizardStore'
import { useAuthStore } from '../../store/authStore'

let mockWizardState: any = {}

jest.mock('../../store/operatorWizardStore', () => {
  const actual = jest.requireActual('../../store/operatorWizardStore')
  return {
    ...actual,
    useOperatorWizardStore: jest.fn(() => mockWizardState),
  }
})

jest.mock('../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
    ]),
    getWilayas: jest.fn().mockResolvedValue([
      { id: 101, governorateId: 1, nameAr: 'السيب', nameEn: 'Seeb' },
    ]),
  },
}))

jest.mock('../../components/ui/GovernorateWilayaSelect', () => ({
  GovernorateWilayaSelect: () => null,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/equipment/operators/add',
  useSegments: () => ['equipment', 'operators', 'add'],
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  Stack: {
    Screen: () => null,
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('AddOperatorScreen (S5 / 429 / 400 FieldErrors) (D-281)', () => {
  const validFormData = {
    operatorType: 'OPERATOR',
    title: 'مشغل رافعة معتمد',
    experienceYears: '5',
    description: 'خبرة في تشغيل الرافعات البرجية والمتحركة',
    equipmentTypes: ['CRANE'],
    specializations: ['رفع الأحمال'],
    certifications: ['رخصة مهنية'],
    dailyRate: '30',
    hourlyRate: '6',
    currency: 'OMR',
    isPriceNegotiable: true,
    governorateId: 1,
    wilayaId: 101,
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    whatsappEnabled: true,
    profileImageUrl: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      user: { id: 'user-1', phone: '+96891234567' } as any,
    })
    jest.spyOn(equipmentHooks, 'useMyOperators').mockReturnValue({ data: [], isLoading: false } as any)
    mockWizardState = {
      currentStep: 3,
      formData: { ...validFormData },
      errors: {},
      setStep: jest.fn((step) => {
        mockWizardState.currentStep = step
      }),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      setFormField: jest.fn(),
      setFormData: jest.fn(),
      clearFieldError: jest.fn(),
      setErrors: jest.fn((errs) => {
        mockWizardState.errors = errs
      }),
      validateStep: jest.fn(() => true),
      resetDraft: jest.fn(),
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('shows PublishSuccessView upon successful creation and resets draft', async () => {
    let capturedSuccessCb: (() => void) | null = null
    jest.spyOn(equipmentHooks, 'useCreateOperator').mockReturnValue({
      mutate: jest.fn().mockImplementation((payload, { onSuccess }) => {
        capturedSuccessCb = onSuccess
      }),
      isPending: false,
    } as any)

    await render(<AddOperatorScreen />, { wrapper: createWrapper() })
    const submitBtn = screen.getByText('نشر بطاقتي في الدليل')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    expect(capturedSuccessCb).not.toBeNull()
    await act(async () => {
      capturedSuccessCb!()
    })

    expect(await screen.findByTestId('publish-success-view')).toBeTruthy()
    expect(screen.getByText('تم نشر بطاقتك المهنية بنجاح!')).toBeTruthy()
    expect(screen.getByText('عرض دليل المشغلين')).toBeTruthy()
    expect(mockWizardState.resetDraft).toHaveBeenCalled()
  })

  it('handles 429 rate limit error via getPublishRateLimitErrorMessage', async () => {
    let capturedErrorCb: ((err: any) => void) | null = null
    jest.spyOn(equipmentHooks, 'useCreateOperator').mockReturnValue({
      mutate: jest.fn().mockImplementation((payload, { onError }) => {
        capturedErrorCb = onError
      }),
      isPending: false,
    } as any)
    const alertSpy = jest.spyOn(dialogService, 'alert')

    await render(<AddOperatorScreen />, { wrapper: createWrapper() })
    const submitBtn = screen.getByText('نشر بطاقتي في الدليل')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await act(async () => {
      capturedErrorCb!({
        response: {
          status: 429,
          data: {
            code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
            window: 'DAILY',
          },
        },
      })
    })

    expect(alertSpy).toHaveBeenCalledWith('خطأ', expect.stringContaining('اليومي'))
  })

  it('redirects wizard to firstInvalidStep and sets field errors on 400 validation error', async () => {
    let capturedErrorCb: ((err: any) => void) | null = null
    jest.spyOn(equipmentHooks, 'useCreateOperator').mockReturnValue({
      mutate: jest.fn().mockImplementation((payload, { onError }) => {
        capturedErrorCb = onError
      }),
      isPending: false,
    } as any)

    await render(<AddOperatorScreen />, { wrapper: createWrapper() })
    const submitBtn = screen.getByText('نشر بطاقتي في الدليل')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await act(async () => {
      capturedErrorCb!({
        response: {
          status: 400,
          data: {
            fieldErrors: {
              title: 'العنوان مستخدم بالفعل أو قصير',
            },
          },
        },
      })
    })

    expect(mockWizardState.setStep).toHaveBeenCalledWith(1)
    expect(mockWizardState.setErrors).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'العنوان مستخدم بالفعل أو قصير' })
    )
  })
})
