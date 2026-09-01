import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import EditListingLoader from '../../app/post/edit/[id]'
import { partsApi } from '../api/parts'
import { listingsApi } from '../api/listings'
import { busesApi } from '../api/buses'
import { servicesApi } from '../api/services'
import { usePartWizardStore } from '../store/partWizardStore'
import { useCarWizardStore } from '../store/carWizardStore'
import { useBusWizardStore } from '../store/busWizardStore'
import { usePostStore } from '../store/postStore'
import { router, useLocalSearchParams } from 'expo-router'

jest.mock('../../src/api/parts')
jest.mock('../../src/api/listings')
jest.mock('../../src/api/buses')
jest.mock('../../src/api/equipment')
jest.mock('../../src/api/services')
jest.mock('../../src/api/cars', () => ({
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

describe('EditListingLoader Parts & Multi-Vertical Dispatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePartWizardStore.getState().reset()
    useCarWizardStore.getState().resetForm()
    useBusWizardStore.getState().reset()
    usePostStore.getState().reset()
  })

  it('intercepts type="parts", populates partWizardStore, and redirects to /parts/new', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-888',
      type: 'parts',
    })

    const partPayload = {
      id: 'part-888',
      title: 'دينمو كامري',
      description: 'دينمو بحالة ممتازة',
      partCategory: 'ELECTRICAL',
      condition: 'USED',
      partNumber: '27060-0V010',
      price: 60,
      currency: 'OMR',
      isPriceNegotiable: true,
      governorateId: 1,
      wilayaId: 10,
      governorateRef: { id: 1, nameAr: 'مسقط' },
      wilayaRef: { id: 10, nameAr: 'السيب' },
      images: [{ id: 'img-1', url: 'https://cdn/p1.jpg' }],
    }

    ;(partsApi.getById as jest.Mock).mockResolvedValue({ data: partPayload })

    render(<EditListingLoader />)

    await waitFor(() => {
      expect(partsApi.getById).toHaveBeenCalledWith('part-888')
      const store = usePartWizardStore.getState()
      expect(store.formData.editMode).toBe(true)
      expect(store.formData.editListingId).toBe('part-888')
      expect(store.formData.title).toBe('دينمو كامري')
      expect(store.formData.partCategory).toBe('ELECTRICAL')
      expect(store.formData.governorateNameAr).toBe('مسقط')
      expect(store.formData.wilayaNameAr).toBe('السيب')
      expect(store.formData.existingImages).toEqual([{ id: 'img-1', url: 'https://cdn/p1.jpg' }])
      expect(router.replace).toHaveBeenCalledWith('/parts/new')
    })
  })

  it('intercepts type="bus", populates busWizardStore, and redirects to /buses/new', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'bus-101',
      type: 'buses',
    })

    const busPayload = {
      id: 'bus-101',
      busListingType: 'RENTAL',
      busType: 'MINIBUS',
      title: 'باص كوستر للايجار',
      price: 250,
      images: [],
    }

    ;(busesApi.getById as jest.Mock).mockResolvedValue({ data: busPayload })

    render(<EditListingLoader />)

    await waitFor(() => {
      expect(busesApi.getById).toHaveBeenCalledWith('bus-101')
      const store = useBusWizardStore.getState()
      expect(store.editMode).toBe(true)
      expect(store.editListingId).toBe('bus-101')
      expect(router.replace).toHaveBeenCalledWith('/buses/new')
    })
  })

  it('falls through to legacy postStore for generic categories like services', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'srv-202',
      type: 'services',
    })

    const servicePayload = {
      id: 'srv-202',
      type: 'service',
      serviceType: 'CAR_WASH',
      title: 'غسيل وتلميع سيارات متنقل',
      price: 15,
      images: [],
    }

    ;(servicesApi.getById as jest.Mock).mockResolvedValue({ data: servicePayload })

    render(<EditListingLoader />)

    await waitFor(() => {
      expect(servicesApi.getById).toHaveBeenCalledWith('srv-202')
      const store = usePostStore.getState()
      expect(store.editMode).toBe(true)
      expect(store.editListingId).toBe('srv-202')
      expect(store.category).toBe('services')
      expect(router.replace).toHaveBeenCalledWith('/post/step2')
    })
  })
})
