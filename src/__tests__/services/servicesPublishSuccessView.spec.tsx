import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewServiceListingScreen from '../../../app/services/new'
import { servicesApi } from '../../api/services'
import { router } from 'expo-router'
import { useServiceWizardStore, defaultServiceFormData } from '../../store/serviceWizardStore'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import * as serviceQueryKeysModule from '../../screens/services/hooks/serviceQueryKeys'
import { getPublishRateLimitErrorMessage } from '../../utils/publishRateLimitError'

jest.mock('../../api/services', () => ({
  servicesApi: {
    create: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn().mockResolvedValue({ data: { url: 'https://cdn.souqone.app/img1.jpg' } }),
    removeServiceImage: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: () => null,
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn((_title, _msg, onConfirm) => {
      if (onConfirm) onConfirm()
    }),
  },
}))

describe('Services PublishSuccessView, 429 Rate Limit, and Unified Error Handling (D-265)', () => {
  let queryClient: QueryClient
  let invalidateSpy: jest.SpyInstance

  const baseValidFormData = {
    ...defaultServiceFormData,
    serviceType: 'MAINTENANCE' as const,
    providerType: 'WORKSHOP' as const,
    providerName: 'كراج السرعة',
    images: [{ uri: 'https://cdn.souqone.app/img.jpg' }],
    title: 'صيانة شاملة للسيارات الحديثة',
    description: 'فحص كمبيوتر وتغيير زيوت وفلاتر مع ضمان شامل',
    specializations: ['تغيير زيت وفلاتر'],
    priceFrom: 30,
    priceTo: null,
    governorateId: 1,
    wilayaId: 101,
    governorateNameAr: 'مسقط',
    wilayaNameAr: 'السيب',
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    invalidateSpy = jest
      .spyOn(serviceQueryKeysModule, 'invalidateServiceListingQueries')
      .mockResolvedValue(undefined)

    useAuthStore.setState({
      user: { id: 'u1', phone: '+96891234567' } as any,
    })
  })

  afterEach(async () => {
    invalidateSpy.mockRestore()
    queryClient.clear()
    await cleanup()
    await AsyncStorage.clear()
  })

  async function seedStep6(overrides: Partial<typeof baseValidFormData> = {}) {
    const statePayload = {
      currentStep: 6,
      formData: {
        ...baseValidFormData,
        ...overrides,
      },
    }
    await AsyncStorage.setItem(
      'service-wizard-draft',
      JSON.stringify({ state: statePayload, version: 0 })
    )
    useServiceWizardStore.setState(statePayload)
  }

  async function renderScreen() {
    return await render(
      <QueryClientProvider client={queryClient}>
        <NewServiceListingScreen />
      </QueryClientProvider>
    )
  }

  it('1. create success renders PublishSuccessView without alert and navigates to service detail on "عرض الخدمة"', async () => {
    ;(servicesApi.create as jest.Mock).mockResolvedValueOnce({
      data: { id: 'srv-created-123' },
    })

    await seedStep6()
    await renderScreen()

    const submitBtn = await screen.findByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith(queryClient, 'srv-created-123')

    const primaryBtn = await screen.findByTestId('publish-success-primary-btn')
    expect(screen.getByText('عرض الخدمة')).toBeTruthy()

    await act(async () => {
      fireEvent.press(primaryBtn)
    })

    expect(router.replace).toHaveBeenCalledWith('/services/srv-created-123')
    expect(useServiceWizardStore.getState().formData.title).toBe('')
    expect(useServiceWizardStore.getState().currentStep).toBe(1)
  })

  it('2. create success pressing "إضافة خدمة أخرى" resets wizard state and returns to Step 1', async () => {
    ;(servicesApi.create as jest.Mock).mockResolvedValueOnce({
      id: 'srv-created-456',
    })

    await seedStep6()
    await renderScreen()

    const submitBtn = await screen.findByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('إضافة خدمة أخرى')).toBeTruthy()
    const secondaryBtn = await screen.findByTestId('publish-success-secondary-btn')

    await act(async () => {
      fireEvent.press(secondaryBtn)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('publish-success-view')).toBeNull()
    })
    expect(useServiceWizardStore.getState().formData.title).toBe('')
    expect(useServiceWizardStore.getState().currentStep).toBe(1)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('3. create success pressing "العودة للرئيسية" resets store and replaces route to "/"', async () => {
    ;(servicesApi.create as jest.Mock).mockResolvedValueOnce({
      data: { id: 'srv-created-999' },
    })

    await seedStep6()
    await renderScreen()

    const submitBtn = await screen.findByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('العودة للرئيسية')).toBeTruthy()
    const tertiaryBtn = await screen.findByTestId('publish-success-tertiary-btn')

    await act(async () => {
      fireEvent.press(tertiaryBtn)
    })

    expect(router.replace).toHaveBeenCalledWith('/')
    expect(useServiceWizardStore.getState().formData.title).toBe('')
    expect(useServiceWizardStore.getState().currentStep).toBe(1)
  })

  it('4. edit success renders PublishSuccessView with edit title and goes back on "الرجوع"', async () => {
    ;(servicesApi.update as jest.Mock).mockResolvedValueOnce({
      data: { id: 'srv-edit-789' },
    })

    await seedStep6({
      editMode: true,
      editListingId: 'srv-edit-789',
      images: [],
      existingImages: [{ id: 'img-1', url: 'https://cdn.souqone.app/img.jpg' }],
    })
    await renderScreen()

    const saveBtn = await screen.findByText('حفظ التعديلات')
    await act(async () => {
      fireEvent.press(saveBtn)
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('تم حفظ التعديلات بنجاح!')).toBeTruthy()
    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith(queryClient, 'srv-edit-789')

    const secondaryBtn = await screen.findByTestId('publish-success-secondary-btn')
    expect(screen.getByText('الرجوع')).toBeTruthy()

    await act(async () => {
      fireEvent.press(secondaryBtn)
    })

    expect(router.back).toHaveBeenCalledTimes(1)
    expect(useServiceWizardStore.getState().formData.editMode).toBe(false)
  })

  it('5. structured 429 on create shows getPublishRateLimitErrorMessage with resetsAt & limit', async () => {
    const error429 = {
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          statusCode: 429,
          code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
          window: 'DAILY',
          limit: 3,
          resetsAt: '2026-11-12T00:00:00.000Z',
        },
      },
    }
    ;(servicesApi.create as jest.Mock).mockRejectedValueOnce(error429)

    await seedStep6()
    await renderScreen()

    const submitBtn = await screen.findByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        getPublishRateLimitErrorMessage(error429)
      )
    })
    expect(screen.queryByTestId('publish-success-view')).toBeNull()
  })

  it('6. legacy 429 on create & monthly 429 on update both use getPublishRateLimitErrorMessage', async () => {
    const legacy429 = {
      response: { status: 429 },
    }
    ;(servicesApi.create as jest.Mock).mockRejectedValueOnce(legacy429)

    await seedStep6()
    const { unmount } = await renderScreen()

    const submitBtn = await screen.findByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
      )
    })

    await unmount()
    jest.clearAllMocks()

    const monthly429 = {
      response: {
        status: 429,
        data: {
          code: 'PUBLISH_RATE_LIMIT_MONTHLY_REACHED',
          window: 'MONTHLY',
          limit: 10,
        },
      },
    }
    ;(servicesApi.update as jest.Mock).mockRejectedValueOnce(monthly429)

    await seedStep6({
      editMode: true,
      editListingId: 'srv-edit-789',
      images: [],
      existingImages: [{ id: 'img-1', url: 'https://cdn.souqone.app/img.jpg' }],
    })
    await renderScreen()

    const saveBtn = await screen.findByText('حفظ التعديلات')
    await act(async () => {
      fireEvent.press(saveBtn)
    })

    await waitFor(() => {
      expect(dialogService.alert).toHaveBeenCalledWith(
        'خطأ',
        getPublishRateLimitErrorMessage(monthly429)
      )
    })
  })

  it('7. unified getMutationErrorMessage handles offline, 409 conflict, 401/403 auth, and 500 server errors cleanly', async () => {
    const cases: Array<{ label: string; err: unknown; expectedMsg: string }> = [
      {
        label: 'offline',
        err: { isAxiosError: true, code: 'ERR_NETWORK', request: {} },
        expectedMsg: 'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.',
      },
      {
        label: 'timeout',
        err: { isAxiosError: true, code: 'ECONNABORTED' },
        expectedMsg: 'انتهت مهلة الاتصال بالخادم. يرجى إعادة المحاولة.',
      },
      {
        label: 'conflict-409',
        err: { isAxiosError: true, response: { status: 409, data: {} } },
        expectedMsg: 'تم تعديل البيانات من جهاز آخر. يرجى التحديث والمحاولة مجدداً.',
      },
      {
        label: 'unauthorized-401',
        err: { isAxiosError: true, response: { status: 401, data: {} } },
        expectedMsg: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      },
      {
        label: 'forbidden-403',
        err: { isAxiosError: true, response: { status: 403, data: {} } },
        expectedMsg: 'ليس لديك الصلاحية لتنفيذ هذا الإجراء.',
      },
      {
        label: 'server-500',
        err: { isAxiosError: true, response: { status: 500, data: {} } },
        expectedMsg: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
      },
    ]

    for (const c of cases) {
      jest.clearAllMocks()
      ;(servicesApi.create as jest.Mock).mockRejectedValueOnce(c.err)

      await seedStep6()
      const { unmount } = await renderScreen()

      const submitBtn = await screen.findByText('نشر الإعلان الآن')
      await act(async () => {
        fireEvent.press(submitBtn)
      })

      await waitFor(() => {
        expect(dialogService.alert).toHaveBeenCalledWith('خطأ', c.expectedMsg)
      })
      await unmount()
    }
  })
})
