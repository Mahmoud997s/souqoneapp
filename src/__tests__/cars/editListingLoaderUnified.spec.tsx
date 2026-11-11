import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { AxiosError } from 'axios'
import EditListingLoader from '../../../app/post/edit/[id]'
import { listingsApi } from '../../api/listings'
import { partsApi } from '../../api/parts'
import { busesApi } from '../../api/buses'
import { servicesApi } from '../../api/services'
import { equipmentApi } from '../../api/equipment'
import { useLocalSearchParams } from 'expo-router'

jest.mock('../../../app/post/edit/[id]', () => {
  const actual = jest.requireActual('../../../app/post/edit/[id]')
  return actual
})

jest.mock('../../api/parts')
jest.mock('../../api/listings')
jest.mock('../../api/buses')
jest.mock('../../api/equipment')
jest.mock('../../api/services')
jest.mock('../../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('EditListingLoader S3 Unified DetailStates & Retry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders classified DetailStates for cars failure and triggers retry on press', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'car-123',
      type: 'cars',
    })

    const mockGetById = listingsApi.getById as jest.Mock
    mockGetById.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK')
    )
    ;(partsApi.getById as jest.Mock).mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK')
    )
    ;(servicesApi.getById as jest.Mock).mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK')
    )
    ;(busesApi.getById as jest.Mock).mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK')
    )

    render(<EditListingLoader />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
      expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
    })

    // Mock successful retry
    mockGetById.mockReset()
    mockGetById.mockResolvedValueOnce({
      data: {
        id: 'car-123',
        category: 'cars',
        title: 'تويوتا كامري 2020',
        description: 'نظيفة جدا',
        brandId: 'toyota',
        carModelId: 'camry',
        images: [],
      },
    })

    const retryBtn = screen.getByLabelText('إعادة المحاولة')
    await act(async () => {
      fireEvent.press(retryBtn)
    })

    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledWith('car-123')
    })
  })
})
