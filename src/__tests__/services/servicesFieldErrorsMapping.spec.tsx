import React from 'react'
import { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import NewServiceListingScreen from '../../../app/services/new'
import { servicesApi } from '../../api/services'
import { useAuthStore } from '../../store/authStore'
import { useServiceWizardStore, defaultServiceFormData } from '../../store/serviceWizardStore'
import { dialogService } from '../../store/dialogStore'
import { mapServiceBackendErrors } from '../../hooks/useServiceValidation'
import * as serviceQueryKeysModule from '../../screens/services/hooks/serviceQueryKeys'

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

function makeBackendValidationAxiosError(status: number, data: unknown) {
  return new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {} as any,
    data,
  })
}

describe('mapServiceBackendErrors & NewServiceListingScreen 400 field error routing (D-269)', () => {
  describe('unit: mapServiceBackendErrors', () => {
    it('maps English NestJS ValidationPipe array across steps to Arabic fieldErrors and earliest step', () => {
      const err = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        message: [
          'priceTo must be greater than or equal to priceFrom',
          'title must be shorter than or equal to 200 characters',
          'governorateId must be a positive number',
        ],
        error: 'Bad Request',
      })

      const mapped = mapServiceBackendErrors(err)

      expect(mapped.firstInvalidStep).toBe(3)
      expect(mapped.fieldErrors.title).toBe('عنوان الخدمة غير صالح')
      expect(mapped.fieldErrors.priceTo).toBe('السعر الأعلى يجب أن يكون أكبر من أو يساوي السعر الأدنى')
      expect(mapped.fieldErrors.governorateId).toBe('المحافظة المحددة غير صالحة')
    })

    it('preserves Arabic backend messages verbatim and maps DTO workingHoursOpen/Close to workingHours', () => {
      const err = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        errors: {
          workingHoursOpen: 'وقت الفتح غير صالح',
          priceFrom: 'السعر الأدنى يجب أن يكون 0 أو أكثر',
        },
      })

      const mapped = mapServiceBackendErrors(err)

      expect(mapped.firstInvalidStep).toBe(4)
      expect(mapped.fieldErrors.workingHours).toBe('وقت الفتح غير صالح')
      expect(mapped.fieldErrors.priceFrom).toBe('السعر الأدنى يجب أن يكون 0 أو أكثر')
    })

    it('maps Arabic single string normalized by GlobalExceptionFilter (e.g. images / priceTo)', () => {
      const errImages = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        message: 'يجب إضافة صورة واحدة على الأقل',
      })
      const mappedImages = mapServiceBackendErrors(errImages)
      expect(mappedImages.firstInvalidStep).toBe(2)
      expect(mappedImages.fieldErrors.images).toBe('يجب إضافة صورة واحدة على الأقل')

      const errPriceTo = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        message: 'السعر الأعلى يجب أن يكون أكبر من أو يساوي السعر الأدنى (priceTo must be >= priceFrom)',
      })
      const mappedPrice = mapServiceBackendErrors(errPriceTo)
      expect(mappedPrice.firstInvalidStep).toBe(5)
      expect(mappedPrice.fieldErrors.priceTo).toContain('السعر الأعلى يجب أن يكون أكبر من أو يساوي السعر الأدنى')
    })

    it('ignores non-validation HTTP statuses (401/403/404/409/429/500) and unmappable generic 400', () => {
      for (const status of [401, 403, 404, 409, 429, 500]) {
        const mapped = mapServiceBackendErrors(
          makeBackendValidationAxiosError(status, { message: 'title is invalid' })
        )
        expect(mapped).toEqual({ fieldErrors: {}, firstInvalidStep: null })
      }

      const generic400 = mapServiceBackendErrors(
        makeBackendValidationAxiosError(400, { message: 'البيانات المدخلة غير صحيحة' })
      )
      expect(generic400).toEqual({ fieldErrors: {}, firstInvalidStep: null })
    })
  })

  describe('integration: NewServiceListingScreen step routing and inline error clearing', () => {
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
      priceTo: 60,
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
      useAuthStore.setState({ user: { id: 'u1', phone: '+96891234567' } as any })
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

    async function renderWizard() {
      return await render(
        <QueryClientProvider client={queryClient}>
          <NewServiceListingScreen />
        </QueryClientProvider>
      )
    }

    it('1. routes to first affected step (Step 3) on multi-field 400 error, renders inline error without Alert, clears on edit, preserves Step 5 error until fixed, and succeeds on resubmit', async () => {
      const error400 = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        message: [
          'السعر الأعلى يجب أن يكون أقصاه 50000',
          'title must be shorter than or equal to 200 characters',
        ],
      })
      ;(servicesApi.create as jest.Mock)
        .mockRejectedValueOnce(error400)
        .mockResolvedValueOnce({ data: { id: 'srv-fixed-101' } })

      await seedStep6()
      await renderWizard()

      const submitBtn = await screen.findByText('نشر الإعلان الآن')
      await act(async () => {
        fireEvent.press(submitBtn)
      })

      await waitFor(() => {
        expect(useServiceWizardStore.getState().currentStep).toBe(3)
      })
      expect(dialogService.alert).not.toHaveBeenCalled()
      expect(screen.getByText('عنوان الخدمة غير صالح')).toBeTruthy()

      // Fix title in Step 3 -> clears title error immediately
      const titleInput = screen.getByTestId('title-input')
      await act(async () => {
        fireEvent.changeText(titleInput, 'صيانة محركات وكهرباء السيارات')
      })
      expect(screen.queryByText('عنوان الخدمة غير صالح')).toBeNull()

      // Advance Step 3 -> Step 4 -> Step 5 -> verify Step 5 backend error on priceTo is still shown until edited
      await act(async () => {
        fireEvent.press(screen.getByText('متابعة الخطوة التالية'))
      })
      expect(useServiceWizardStore.getState().currentStep).toBe(4)

      await act(async () => {
        fireEvent.press(screen.getByText('متابعة الخطوة التالية'))
      })
      expect(useServiceWizardStore.getState().currentStep).toBe(5)
      expect(screen.getByText('السعر الأعلى يجب أن يكون أقصاه 50000')).toBeTruthy()

      // Edit priceTo -> clears Step 5 inline error in real time
      await act(async () => {
        fireEvent.changeText(screen.getByTestId('price-to-input'), '55')
      })
      expect(screen.queryByText('السعر الأعلى يجب أن يكون أقصاه 50000')).toBeNull()

      // Advance to Step 6 and resubmit -> succeeds!
      await act(async () => {
        fireEvent.press(screen.getByText('متابعة الخطوة التالية'))
      })
      expect(useServiceWizardStore.getState().currentStep).toBe(6)

      const resubmitBtn = await screen.findByText('نشر الإعلان الآن')
      await act(async () => {
        fireEvent.press(resubmitBtn)
      })

      await waitFor(() => {
        expect(screen.getByTestId('publish-success-view')).toBeTruthy()
      })
    })

    it('2. updateMutation handles structured Arabic 400 error on Step 1 (providerName) and recovers after edit', async () => {
      const update400 = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        errors: {
          providerName: 'اسم مقدم الخدمة غير مسموح به',
        },
      })
      ;(servicesApi.update as jest.Mock)
        .mockRejectedValueOnce(update400)
        .mockResolvedValueOnce({ data: { id: 'srv-edit-22' } })

      await seedStep6({
        editMode: true,
        editListingId: 'srv-edit-22',
        images: [],
        existingImages: [{ id: 'img-1', url: 'https://cdn.souqone.app/img1.jpg' }],
      })
      await renderWizard()

      const saveBtn = await screen.findByText('حفظ التعديلات')
      await act(async () => {
        fireEvent.press(saveBtn)
      })

      await waitFor(() => {
        expect(useServiceWizardStore.getState().currentStep).toBe(1)
      })
      expect(dialogService.alert).not.toHaveBeenCalled()
      expect(screen.getByText('اسم مقدم الخدمة غير مسموح به')).toBeTruthy()

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('provider-name-input'), 'مركز الأمانة لصيانة السيارات')
      })
      expect(screen.queryByText('اسم مقدم الخدمة غير مسموح به')).toBeNull()

      await act(async () => {
        useServiceWizardStore.getState().goToStep(6)
      })
      const saveRetryBtn = await screen.findByText('حفظ التعديلات')
      await act(async () => {
        fireEvent.press(saveRetryBtn)
      })

      await waitFor(() => {
        expect(screen.getByTestId('publish-success-view')).toBeTruthy()
      })
    })

    it('3. routes to Step 4 inline workingHours error on English workingHoursOpen DTO error and falls back to Alert when 400 has no mappable fields', async () => {
      const hours400 = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        message: ['workingHoursOpen must be a valid time string'],
      })
      const unmappable400 = makeBackendValidationAxiosError(400, {
        statusCode: 400,
        message: 'البيانات المدخلة غير صحيحة',
      })
      ;(servicesApi.create as jest.Mock)
        .mockRejectedValueOnce(hours400)
        .mockRejectedValueOnce(unmappable400)

      await seedStep6()
      await renderWizard()

      const submitBtn = await screen.findByText('نشر الإعلان الآن')
      await act(async () => {
        fireEvent.press(submitBtn)
      })

      await waitFor(() => {
        expect(useServiceWizardStore.getState().currentStep).toBe(4)
      })
      expect(screen.getByTestId('error-working-hours')).toBeTruthy()
      expect(dialogService.alert).not.toHaveBeenCalled()

      // Jump to Step 6 and submit unmappable generic 400 -> should show dialogService.alert fallback
      await act(async () => {
        useServiceWizardStore.getState().goToStep(6)
      })
      const submitBtn2 = await screen.findByText('نشر الإعلان الآن')
      await act(async () => {
        fireEvent.press(submitBtn2)
      })

      await waitFor(() => {
        expect(dialogService.alert).toHaveBeenCalledWith('خطأ', 'البيانات المدخلة غير صحيحة')
      })
    })
  })
})
