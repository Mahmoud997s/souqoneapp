import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native'
import { AxiosError } from 'axios'
import EditEquipmentLoaderScreen from '../../../app/equipment/edit/[id]'
import { equipmentApi } from '../../api/equipment'
import { useEquipmentWizardStore } from '../../store/equipmentWizardStore'
import { router, useLocalSearchParams } from 'expo-router'

jest.mock('../../api/equipment')

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}))

describe('Equipment Edit Loader Skeleton & Retry (D-266 / R2-2)', () => {
  const mockEquipment = {
    id: 'eq-123',
    title: 'حفار كاتربيلر 320D',
    description: 'حفار بحالة ممتازة وساعات عمل قليلة',
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',
    make: 'Caterpillar',
    model: '320D',
    year: 2020,
    condition: 'USED',
    price: 25000,
    governorateId: 1,
    wilayaId: 10,
    images: [
      { id: 'img-1', url: 'https://cdn.example.com/eq1.jpg' },
      { id: 'img-2', url: 'https://cdn.example.com/eq2.jpg' },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(equipmentApi.getById as jest.Mock).mockReset()
    useEquipmentWizardStore.getState().resetDraft()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders DetailSkeleton while fetching equipment listing for edit', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'eq-123' })
    ;(equipmentApi.getById as jest.Mock).mockImplementationOnce(() => new Promise(() => {}))

    await render(<EditEquipmentLoaderScreen />)

    expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
    expect(screen.getByTestId('detail-skeleton')).toBeTruthy()
  })

  it('shows retry UI on fetch failure and navigates to edit wizard when retry succeeds', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'eq-123' })
    ;(equipmentApi.getById as jest.Mock)
      .mockRejectedValueOnce(new Error('Network offline'))
      .mockResolvedValueOnce({ data: mockEquipment })

    await render(<EditEquipmentLoaderScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
      expect(screen.getByText('تعذر تحميل بيانات المعدة')).toBeTruthy()
    })

    const retryBtn = screen.getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    expect(screen.getByText('الرجوع')).toBeTruthy()

    await act(async () => {
      fireEvent.press(retryBtn)
    })

    await waitFor(() => {
      expect(equipmentApi.getById).toHaveBeenCalledTimes(2)
      expect(equipmentApi.getById).toHaveBeenCalledWith('eq-123')
      expect(router.replace).toHaveBeenCalledWith('/equipment/new')

      const state = useEquipmentWizardStore.getState()
      expect(state.formData.editMode).toBe(true)
      expect(state.formData.editListingId).toBe('eq-123')
      expect(state.formData.title).toBe('حفار كاتربيلر 320D')
      expect(state.formData.existingImages).toHaveLength(2)
      expect(state.formData.removedImageIds).toEqual([])
    })
  })

  it('maps Axios offline network error to offline DetailStates with retry and back controls', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'eq-123' })
    const offlineErr = new AxiosError('Network Error', 'ERR_NETWORK')
    ;(equipmentApi.getById as jest.Mock).mockRejectedValueOnce(offlineErr)

    await render(<EditEquipmentLoaderScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
      expect(screen.getByText('إعادة المحاولة')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('الرجوع'))
    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it('renders notFound state when id parameter is missing instead of hanging in loading state', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({})

    await render(<EditEquipmentLoaderScreen />)

    expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
    expect(equipmentApi.getById).not.toHaveBeenCalled()

    fireEvent.press(screen.getByText('الرجوع للرئيسية'))
    expect(router.back).toHaveBeenCalledTimes(1)
  })
})
