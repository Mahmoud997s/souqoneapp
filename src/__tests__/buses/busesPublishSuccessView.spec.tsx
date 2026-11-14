import React from 'react'
import { BackHandler } from 'react-native'
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewBusListingScreen from '../../../app/buses/new'
import { busesApi } from '../../api/buses'
import { uploadsApi } from '../../api/uploads'
import { dialogService } from '../../store/dialogStore'
import { useBusWizardStore } from '../../store/busWizardStore'
import { formatCairoResetsTime } from '../../utils/publishRateLimitError'

const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
    push: (...args: any[]) => mockPush(...args),
  },
  Stack: {
    Screen: () => null,
  },
}))

jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: ({ children, testID, style }: any) => (
      <View testID={testID} style={style}>
        {children}
      </View>
    ),
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useProfilePhoneGuard', () => ({
  useProfilePhoneGuard: () => ({ hasPhone: true }),
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
  },
}))

jest.mock('../../api/buses', () => ({
  busesApi: {
    create: jest.fn(),
    update: jest.fn(),
    addImages: jest.fn(),
    removeImage: jest.fn(),
  },
}))

jest.mock('../../utils/fileUploadHelper', () => ({
  buildUploadFilePayload: jest.fn(() => ({
    uri: 'file:///tmp/bus.jpg',
    name: 'bus.jpg',
    type: 'image/jpeg',
  })),
}))

jest.mock('../../utils/safeLog', () => ({
  logWarn: jest.fn(),
}))

jest.mock('../../components/ui/GlassNavBar', () => ({
  GlassNavBar: () => null,
}))

jest.mock('../../components/ui/Stepper', () => ({
  Stepper: () => null,
}))

jest.mock('../../components/buses/wizard/BusStep6Review', () => ({
  BusStep6Review: () => {
    const { View, Text } = require('react-native')
    return (
      <View testID="bus-step-6-review">
        <Text>Review Step</Text>
      </View>
    )
  },
}))

const mockedUploadsSingle = jest.mocked(uploadsApi.single)
const mockedBusesCreate = jest.mocked(busesApi.create)
const mockedBusesUpdate = jest.mocked(busesApi.update)
const mockedBusesAddImages = jest.mocked(busesApi.addImages)

const VALID_BUS_WIZARD_DATA = {
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  make: 'تويوتا',
  model: 'كوستر',
  manufacturerId: null,
  modelId: null,
  year: '2022',
  capacity: '30',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '45000',
  plateNumber: '',
  features: [],
  price: '16500',
  currency: 'OMR',
  isPriceNegotiable: true,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: 'COMPANY',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: 'تويوتا كوستر 2022 بحالة ممتازة',
  description: 'حافلة تويوتا كوستر 30 راكب بحالة ممتازة وصيانة دورية كاملة',
  governorateId: 1,
  wilayaId: 10,
  governorateNameAr: 'مسقط',
  wilayaNameAr: 'السيب',
  latitude: null,
  longitude: null,
  images: ['file:///tmp/bus-1.jpg'],
  existingImages: [],
  removedImageIds: [],
  whatsappEnabled: true,
}

describe('Buses R3-3: NewBusListingScreen image-error fix, PublishSuccessView & 429/mutation errors (D-273)', () => {
  let queryClient: QueryClient
  let confirmSpy: jest.SpyInstance
  let alertSpy: jest.SpyInstance
  let backSpy: jest.SpyInstance
  let capturedBackHandler: (() => boolean | null | undefined) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    capturedBackHandler = null
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    useBusWizardStore.setState({
      currentStep: 6,
      data: { ...VALID_BUS_WIZARD_DATA },
      errors: {},
      editMode: false,
      editListingId: null,
      editVersion: null,
    })

    backSpy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      capturedBackHandler = () => (handler as () => boolean | null | undefined)()
      return { remove: jest.fn() } as any
    })

    confirmSpy = jest
      .spyOn(dialogService, 'confirm')
      .mockImplementation((_title, _message, onConfirm) => {
        onConfirm()
      })
    alertSpy = jest.spyOn(dialogService, 'alert').mockImplementation(() => {})

    mockedUploadsSingle.mockResolvedValue({
      data: { url: 'https://cdn.souqone.app/uploaded-bus-1.jpg' },
    } as any)
    mockedBusesAddImages.mockResolvedValue({ data: { success: true } } as any)
  })

  afterEach(async () => {
    await cleanup()
    backSpy.mockRestore()
    confirmSpy.mockRestore()
    alertSpy.mockRestore()
    queryClient.clear()
  })

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  async function submitPublishFromStep6() {
    const screen = await render(<NewBusListingScreen />, { wrapper })
    const publishBtn = screen.getByText('نشر الإعلان الآن')
    await act(async () => {
      fireEvent.press(publishBtn)
    })
    return screen
  }

  it('1a. Full publish success renders PublishSuccessView, invalidates caches, resets draft, and primaryAction opens /buses/:id', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    mockedBusesCreate.mockResolvedValueOnce({ data: { id: 'bus-999' } } as any)

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('تم نشر إعلان الحافلة بنجاح!')).toBeTruthy()
    expect(mockedBusesAddImages).toHaveBeenCalledWith('bus-999', [
      'https://cdn.souqone.app/uploaded-bus-1.jpg',
    ])
    expect(alertSpy).not.toHaveBeenCalled()
    expect(useBusWizardStore.getState().currentStep).toBe(1)
    expect(useBusWizardStore.getState().data.title).toBe('')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['buses'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['buses_infinite'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-buses'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-listings'] })

    await act(async () => {
      fireEvent.press(screen.getByTestId('publish-success-primary-btn'))
    })
    expect(mockReplace).toHaveBeenCalledWith('/buses/bus-999')
  })

  it('1b. Secondary action ("إضافة حافلة أخرى") clears success screen and returns to wizard cleanly', async () => {
    mockedBusesCreate.mockResolvedValueOnce({ data: { id: 'bus-1000' } } as any)

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('إضافة حافلة أخرى')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByTestId('publish-success-secondary-btn'))
    })

    expect(screen.queryByTestId('publish-success-view')).toBeNull()
    expect(screen.getByText('متابعة الخطوة التالية')).toBeTruthy()
  })

  it('1c. Tertiary action ("العودة للرئيسية") redirects to /', async () => {
    mockedBusesCreate.mockResolvedValueOnce({ data: { id: 'bus-1001' } } as any)

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-tertiary-btn')).toBeTruthy()
    })

    expect(screen.getByText('العودة للرئيسية')).toBeTruthy()
    await act(async () => {
      fireEvent.press(screen.getByTestId('publish-success-tertiary-btn'))
    })

    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('2. Image attachment failure after create does NOT swallow silently and shows warning subtitle in PublishSuccessView', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    mockedBusesCreate.mockResolvedValueOnce({ data: { id: 'bus-no-img-1' } } as any)
    mockedBusesAddImages.mockRejectedValueOnce(new Error('Network fail during image link'))

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(alertSpy).not.toHaveBeenCalledWith('تم بنجاح', expect.any(String))
    expect(
      screen.getByText('تم نشر الحافلة ولكن تعذر ربط بعض الصور، يمكنك تعديل الإعلان وإعادة رفعها.')
    ).toBeTruthy()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['buses'] })
  })

  it('3. HTTP 429 rate-limit response renders formatted Cairo reset message via getPublishRateLimitErrorMessage', async () => {
    const resetsAt = '2026-11-12T00:00:00.000Z'
    const rateLimitError = {
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
          limit: 2,
          resetsAt,
        },
      },
    }
    mockedBusesCreate.mockRejectedValueOnce(rateLimitError)

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledTimes(1)
    })

    const expectedTime = formatCairoResetsTime(resetsAt)
    expect(alertSpy).toHaveBeenCalledWith(
      'خطأ',
      `وصلت للحد اليومي لنشر الإعلانات (2 إعلانات في اليوم). يُعاد تعيين الحد في ${expectedTime}.`
    )
    expect(screen.queryByTestId('publish-success-view')).toBeNull()
  })

  it('4. Network and timeout mutation errors use getMutationErrorMessage instead of generic fallback', async () => {
    const networkErr = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
    }
    mockedBusesCreate.mockRejectedValueOnce(networkErr)

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'خطأ',
        'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.'
      )
    })
    expect(screen.queryByTestId('publish-success-view')).toBeNull()

    alertSpy.mockClear()
    const timeoutErr = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
    }
    mockedBusesCreate.mockRejectedValueOnce(timeoutErr)

    await act(async () => {
      fireEvent.press(screen.getByText('نشر الإعلان الآن'))
    })

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'خطأ',
        'انتهت مهلة الاتصال بالخادم. يرجى إعادة المحاولة.'
      )
    })
  })

  it('5. Hardware back button on PublishSuccessView navigates to /buses and blocks going back to form', async () => {
    mockedBusesCreate.mockResolvedValueOnce({ data: { id: 'bus-hw-back' } } as any)

    const screen = await submitPublishFromStep6()

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(typeof capturedBackHandler).toBe('function')
    let handled: boolean | null | undefined = false
    await act(async () => {
      handled = capturedBackHandler?.()
    })

    expect(handled).toBe(true)
    expect(mockReplace).toHaveBeenCalledWith('/buses')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('6. Edit mode partial image failure renders PublishSuccessView with edit warning subtitle and secondary action to /buses', async () => {
    useBusWizardStore.setState({
      currentStep: 6,
      data: { ...VALID_BUS_WIZARD_DATA },
      errors: {},
      editMode: true,
      editListingId: 'bus-edit-55',
      editVersion: 3,
    })
    mockedBusesUpdate.mockResolvedValueOnce({ data: { id: 'bus-edit-55' } } as any)
    mockedBusesAddImages.mockRejectedValueOnce(new Error('Image patch failed'))

    const screen = await render(<NewBusListingScreen />, { wrapper })
    await act(async () => {
      fireEvent.press(screen.getByText('حفظ التعديلات'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('publish-success-view')).toBeTruthy()
    })

    expect(screen.getByText('تم حفظ تعديلات الحافلة بنجاح!')).toBeTruthy()
    expect(
      screen.getByText('تم حفظ التعديلات ولكن تعذر تحديث بعض الصور، يمكنك تعديل الإعلان وإعادة رفعها.')
    ).toBeTruthy()

    await act(async () => {
      fireEvent.press(screen.getByTestId('publish-success-secondary-btn'))
    })
    expect(mockReplace).toHaveBeenCalledWith('/buses')
  })
})
