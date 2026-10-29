import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { buildOperatorPayload } from '../../utils/operator-payload'
import { useEquipmentWizardStore } from '../../store/equipmentWizardStore'
import { usePartWizardStore } from '../../store/partWizardStore'
import { useServiceWizardStore } from '../../store/serviceWizardStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))
jest.mock('../../components/ui/GovernorateWilayaSelect', () => ({
  GovernorateWilayaSelect: () => null,
}))

describe('Edit Forms WhatsApp Preservation (Spec 4)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('Operator Edit: preserves whatsappEnabled=true in buildOperatorPayload', () => {
    const existingOperator: any = {
      title: 'مشغل رافعة شوكية محترف',
      description: 'خبرة 5 سنوات في الموانئ والمستودعات',
      operatorType: 'OPERATOR',
      experienceYears: '5',
      equipmentTypes: ['FORKLIFT'],
      specializations: ['HEAVY_LIFT'],
      certifications: ['CERT_A'],
      dailyRate: '30',
      hourlyRate: '5',
      currency: 'OMR',
      isPriceNegotiable: true,
      governorateId: 1,
      wilayaId: 10,
      whatsappEnabled: true,
    }

    const payload = buildOperatorPayload(existingOperator)
    expect(payload.whatsappEnabled).toBe(true)
  })

  it('Equipment Edit: initEditMode loads whatsappEnabled=true from existing listing', () => {
    const existingListing: any = {
      id: 'eq-999',
      title: 'حفار كوماتسو 2022',
      equipmentType: 'EXCAVATOR',
      listingType: 'EQUIPMENT_SALE',
      price: 25000,
      governorateId: 1,
      wilayaId: 10,
      whatsappEnabled: true,
      images: ['https://example.com/excavator.jpg'],
    }

    useEquipmentWizardStore.getState().initEditMode(existingListing)
    const formData = useEquipmentWizardStore.getState().formData

    expect(formData.editMode).toBe(true)
    expect(formData.editListingId).toBe('eq-999')
    expect(formData.whatsappEnabled).toBe(true)
  })

  it('Parts & Services Edit: setEditMode loads whatsappEnabled=true from existing listing', () => {
    usePartWizardStore.getState().setEditMode('part-123', {
      title: 'دينامو تويوتا أصلي',
      whatsappEnabled: true,
    } as any)
    expect(usePartWizardStore.getState().formData.whatsappEnabled).toBe(true)

    useServiceWizardStore.getState().setEditMode('srv-456', {
      title: 'ورشة ميكانيكا وصيانة',
      whatsappEnabled: true,
    } as any)
    expect(useServiceWizardStore.getState().formData.whatsappEnabled).toBe(true)
  })
})
