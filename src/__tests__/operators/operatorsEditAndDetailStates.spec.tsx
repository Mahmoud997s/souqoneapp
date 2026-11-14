import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EditOperatorScreen from '../../../app/equipment/operators/edit/[id]'
import { dialogService } from '../../store/dialogStore'
import * as equipmentHooks from '../../hooks/useEquipment'

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
  useLocalSearchParams: () => ({ id: 'op-test-123' }),
  usePathname: () => '/equipment/operators/edit/op-test-123',
  useSegments: () => ['equipment', 'operators', 'edit', 'op-test-123'],
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

describe('Operators EditScreen: DetailStates, Retry, PublishSuccessView & 429 (D-281)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders DetailStates loading skeleton when operator data is loading', async () => {
    jest.spyOn(equipmentHooks, 'useOperatorItem').mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any)

    await render(<EditOperatorScreen />, { wrapper: createWrapper() })
    expect(await screen.findByTestId('detail-state-loading')).toBeTruthy()
  })

  it('renders DetailStates classified error with retry button and calls refetch when pressed', async () => {
    const mockRefetch = jest.fn()
    jest.spyOn(equipmentHooks, 'useOperatorItem').mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { message: 'Network Error', isAxiosError: true },
      refetch: mockRefetch,
    } as any)

    await render(<EditOperatorScreen />, { wrapper: createWrapper() })
    expect(await screen.findByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    expect(screen.getByTestId('detail-state-offline')).toBeTruthy()

    const retryBtn = screen.getByText('إعادة المحاولة')
    await act(async () => {
      fireEvent.press(retryBtn)
    })
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('renders PublishSuccessView upon successful update', async () => {
    let capturedSuccessCb: (() => void) | null = null
    jest.spyOn(equipmentHooks, 'useOperatorItem').mockReturnValue({
      data: {
        id: 'op-123',
        operatorType: 'OPERATOR',
        title: 'مشغل شيول محترف',
        experienceYears: 7,
        description: 'تشغيل كافة أنواع الشيولات واللوادر',
        equipmentTypes: ['LOADER'],
        specializations: ['تحميل'],
        certifications: ['رخصة ثقيلة'],
        dailyRate: 35,
        governorateId: 1,
        wilayaId: 101,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any)
    jest.spyOn(equipmentHooks, 'useUpdateOperator').mockReturnValue({
      mutate: jest.fn().mockImplementation((payload, { onSuccess }) => {
        capturedSuccessCb = onSuccess
      }),
      isPending: false,
    } as any)

    await render(<EditOperatorScreen />, { wrapper: createWrapper() })

    // Advance from Step 1 to Step 2
    const nextBtn1 = await screen.findByText('متابعة الخطوة التالية')
    await act(async () => {
      fireEvent.press(nextBtn1)
    })
    expect(await screen.findByText('المعدات والرخص المعتمدة')).toBeTruthy()

    // Advance from Step 2 to Step 3
    const nextBtn2 = await screen.findByText('متابعة الخطوة التالية')
    await act(async () => {
      fireEvent.press(nextBtn2)
    })
    expect(await screen.findByText('التسعير وموقع العمل والتواصل')).toBeTruthy()

    // Submit on Step 3
    const saveBtn = await screen.findByText('حفظ وتحديث البطاقة')
    await act(async () => {
      fireEvent.press(saveBtn)
    })

    expect(capturedSuccessCb).not.toBeNull()
    await act(async () => {
      capturedSuccessCb!()
    })

    expect(await screen.findByTestId('publish-success-view')).toBeTruthy()
    expect(screen.getByText('تم تحديث بطاقتك المهنية بنجاح!')).toBeTruthy()
    expect(screen.getByText('عرض البطاقة المهنية')).toBeTruthy()
  })

  it('handles 429 error and 400 fieldErrors redirection in edit flow', async () => {
    let capturedErrorCb: ((err: any) => void) | null = null
    const alertSpy = jest.spyOn(dialogService, 'alert')
    jest.spyOn(equipmentHooks, 'useOperatorItem').mockReturnValue({
      data: {
        id: 'op-123',
        operatorType: 'OPERATOR',
        title: 'مشغل شيول محترف',
        experienceYears: 7,
        description: 'تشغيل كافة أنواع الشيولات واللوادر',
        equipmentTypes: ['LOADER'],
        specializations: ['تحميل'],
        certifications: ['رخصة ثقيلة'],
        dailyRate: 35,
        governorateId: 1,
        wilayaId: 101,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any)
    jest.spyOn(equipmentHooks, 'useUpdateOperator').mockReturnValue({
      mutate: jest.fn().mockImplementation((payload, { onError }) => {
        capturedErrorCb = onError
      }),
      isPending: false,
    } as any)

    await render(<EditOperatorScreen />, { wrapper: createWrapper() })

    // Advance from Step 1 to Step 2
    const nextBtn1 = await screen.findByText('متابعة الخطوة التالية')
    await act(async () => {
      fireEvent.press(nextBtn1)
    })
    expect(await screen.findByText('المعدات والرخص المعتمدة')).toBeTruthy()

    // Advance from Step 2 to Step 3
    const nextBtn2 = await screen.findByText('متابعة الخطوة التالية')
    await act(async () => {
      fireEvent.press(nextBtn2)
    })
    expect(await screen.findByText('التسعير وموقع العمل والتواصل')).toBeTruthy()

    const saveBtn = await screen.findByText('حفظ وتحديث البطاقة')
    await act(async () => {
      fireEvent.press(saveBtn)
    })

    // 1. 429 Rate Limit
    await act(async () => {
      capturedErrorCb!({
        response: {
          status: 429,
          data: { code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED' },
        },
      })
    })
    expect(alertSpy).toHaveBeenCalledWith('خطأ', expect.stringContaining('اليومي'))

    // 2. 400 Step 1 FieldError (title)
    await act(async () => {
      capturedErrorCb!({
        response: {
          status: 400,
          data: { fieldErrors: { title: 'العنوان غير مناسب' } },
        },
      })
    })
    // Stepper should have redirected back to Step 1
    expect(await screen.findByText('البيانات المهنية والتخصص')).toBeTruthy()
  })
})
