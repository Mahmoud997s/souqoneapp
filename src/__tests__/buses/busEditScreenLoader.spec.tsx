import React from 'react'
import { AxiosError } from 'axios'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import EditBusScreen from '../../../app/buses/edit/[id]'
import { busesApi } from '../../api/buses'
import { useBusWizardStore } from '../../store/busWizardStore'

const mockReplace = jest.fn()
const mockBack = jest.fn()
let mockCanGoBack = true
let mockSearchParams: { id?: string | string[] } = { id: 'bus-101' }

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
    canGoBack: () => mockCanGoBack,
  },
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => mockSearchParams,
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) => <View {...props} />,
    MaterialCommunityIcons: (props: any) => <View {...props} />,
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../api/buses', () => ({
  busesApi: {
    getById: jest.fn(),
  },
}))

const mockGetById = busesApi.getById as jest.Mock

const SAMPLE_BUS_LISTING = {
  id: 'bus-101',
  version: 4,
  title: 'تويوتا كوستر 2022 نظيف',
  description: 'حافلة جاهزة للعمل بحالة ممتازة',
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  make: 'Toyota',
  model: 'Coaster',
  manufacturerId: 'mfr-toyota',
  modelId: 'mdl-coaster',
  year: 2022,
  capacity: 30,
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: 48000,
  plateNumber: '44123 B',
  features: ['AC', 'GPS'],
  price: 21500,
  currency: 'OMR',
  isPriceNegotiable: true,
  dailyPrice: null,
  monthlyPrice: null,
  withDriver: false,
  governorateId: 1,
  wilayaId: 10,
  governorateNameAr: 'مسقط',
  wilayaNameAr: 'السيب',
  latitude: 23.67,
  longitude: 58.18,
  whatsappEnabled: true,
  images: [{ id: 'img-1', url: 'https://cdn.example.com/bus1.jpg' }],
}

function makeAxiosHttpError(status: number, message = `HTTP ${status}`) {
  return new AxiosError(message, undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as any,
    data: {},
  })
}

describe('EditBusScreen (app/buses/edit/[id])', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = { id: 'bus-101' }
    mockCanGoBack = true
    useBusWizardStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows DetailStates loading skeleton while fetching listing', async () => {
    mockGetById.mockReturnValue(new Promise(() => {}))

    await render(<EditBusScreen />)

    expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
    expect(screen.getByTestId('detail-skeleton')).toBeTruthy()
    expect(mockGetById).toHaveBeenCalledWith('bus-101')
  })

  it('populates busWizardStore editMode from busesApi.getById and replaces route to /buses/new', async () => {
    mockGetById.mockResolvedValueOnce({ data: SAMPLE_BUS_LISTING })

    await render(<EditBusScreen />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/buses/new')
    })

    const state = useBusWizardStore.getState()
    expect(state.editMode).toBe(true)
    expect(state.editListingId).toBe('bus-101')
    expect(state.editVersion).toBe(4)
    expect(state.currentStep).toBe(1)
    expect(state.data.title).toBe('تويوتا كوستر 2022 نظيف')
    expect(state.data.make).toBe('Toyota')
    expect(state.data.model).toBe('Coaster')
    expect(state.data.year).toBe('2022')
    expect(state.data.capacity).toBe('30')
    expect(state.data.price).toBe('21500')
    expect(state.data.busListingType).toBe('BUS_SALE')
    expect(state.data.governorateNameAr).toBe('مسقط')
    expect(state.data.wilayaNameAr).toBe('السيب')
    expect(state.data.existingImages).toHaveLength(1)
  })

  it('renders offline error state on network failure and succeeds after pressing Retry', async () => {
    const offlineError = new AxiosError('Network Error', 'ERR_NETWORK')
    mockGetById
      .mockRejectedValueOnce(offlineError)
      .mockResolvedValueOnce({ data: SAMPLE_BUS_LISTING })

    await render(<EditBusScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
    })
    expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(screen.getByText('إعادة المحاولة'))
    })

    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledTimes(2)
      expect(mockReplace).toHaveBeenCalledWith('/buses/new')
    })
    expect(useBusWizardStore.getState().editMode).toBe(true)
    expect(useBusWizardStore.getState().editListingId).toBe('bus-101')
  })

  it('renders serverError state on HTTP 500 and retries cleanly', async () => {
    mockGetById
      .mockRejectedValueOnce(makeAxiosHttpError(500))
      .mockResolvedValueOnce({ data: SAMPLE_BUS_LISTING })

    await render(<EditBusScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-server-error')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('إعادة المحاولة'))
    })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/buses/new')
    })
  })

  it('renders notFound state on HTTP 404 and navigates back when back button is pressed', async () => {
    mockGetById.mockRejectedValueOnce(makeAxiosHttpError(404))

    await render(<EditBusScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
    })
    expect(screen.getByText('الإعلان غير موجود')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(screen.getByText('الرجوع للرئيسية'))
    })
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('renders notFound immediately when id param is missing and falls back to /buses if cannot go back', async () => {
    mockSearchParams = {}
    mockCanGoBack = false

    await render(<EditBusScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
    })
    expect(mockGetById).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(screen.getByText('الرجوع للرئيسية'))
    })
    expect(mockReplace).toHaveBeenCalledWith('/buses')
  })
})
