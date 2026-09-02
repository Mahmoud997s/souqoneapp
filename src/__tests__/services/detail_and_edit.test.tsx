import React from 'react'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react-native'
import ServiceDetailScreen from '../../../app/services/[id]'
import EditListingLoader from '../../../app/post/edit/[id]'
import { useServiceWizardStore } from '../../store/serviceWizardStore'
import { useAuthStore } from '../../store/authStore'
import { servicesApi } from '../../api/services'
import { router } from 'expo-router'

const mockServiceData = {
  id: 'srv-999',
  title: 'كراج الفخامة لصيانة وبرمجة السيارات',
  description: 'صيانة محركات وجيربوكس مع ضمان سنة كاملة وفحص كمبيوتر متقدم',
  serviceType: 'MAINTENANCE',
  providerType: 'WORKSHOP',
  providerName: 'كراج الفخامة',
  specializations: ['تغيير زيت وفلاتر', 'ميكانيكا عامة', 'فحص كمبيوتر شامل'],
  isHomeService: true,
  workingHoursOpen: '08:00',
  workingHoursClose: '20:00',
  workingDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  priceFrom: 25,
  priceTo: 150,
  currency: 'OMR',
  contactPhone: '96891234567',
  whatsapp: '96891234567',
  website: 'https://alfakhama.om',
  governorateId: 1,
  wilayaId: 101,
  governorateRef: { nameAr: 'مسقط' },
  wilayaRef: { nameAr: 'السيب' },
  address: 'المعبيلة الصناعية - شارع 10',
  latitude: 23.588,
  longitude: 58.3829,
  images: [
    { id: 'img-1', url: 'https://cdn.souqone.app/srv1.jpg' },
    { id: 'img-2', url: 'https://cdn.souqone.app/srv2.jpg' },
  ],
  seller: {
    id: 'user-owner-123',
    username: 'fakhama_auto',
    displayName: 'كراج الفخامة',
    phone: '96891234567',
    isVerified: true,
  },
}

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: 'srv-999', type: 'service' }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('expo-image', () => ({
  Image: ({ source, ...props }: any) => <>{props.children}</>,
}))

jest.mock('../../hooks/useServices', () => ({
  useService: () => ({
    data: mockServiceData,
    isLoading: false,
    isError: false,
  }),
}))

jest.mock('../../api/services', () => ({
  servicesApi: {
    getById: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn((title, msg, onConfirm) => {
      if (onConfirm) onConfirm()
    }),
    alert: jest.fn(),
  },
}))

describe('Services Edit Flow (Phase 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(servicesApi.getById as jest.Mock).mockResolvedValue({ data: mockServiceData })
    ;(servicesApi.remove as jest.Mock).mockResolvedValue({})
    useAuthStore.setState({
      user: { id: 'user-owner-123', email: 'owner@souqone.com' } as any,
    })
    useServiceWizardStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  describe('ServiceDetailScreen Edit button', () => {
    it('renders Edit button for the owner and populates serviceWizardStore on press', async () => {
      await render(<ServiceDetailScreen />)

      const editBtn = screen.getByText('تعديل')
      expect(editBtn).toBeTruthy()

      await act(async () => {
        fireEvent.press(editBtn)
      })

      const state = useServiceWizardStore.getState()
      expect(state.formData.editMode).toBe(true)
      expect(state.formData.editListingId).toBe('srv-999')
      expect(state.formData.title).toBe('كراج الفخامة لصيانة وبرمجة السيارات')
      expect(state.formData.serviceType).toBe('MAINTENANCE')
      expect(state.formData.providerType).toBe('WORKSHOP')
      expect(state.formData.providerName).toBe('كراج الفخامة')
      expect(state.formData.specializations).toEqual([
        'تغيير زيت وفلاتر',
        'ميكانيكا عامة',
        'فحص كمبيوتر شامل',
      ])
      expect(state.formData.isHomeService).toBe(true)
      expect(state.formData.workingHoursOpen).toBe('08:00')
      expect(state.formData.workingHoursClose).toBe('20:00')
      expect(state.formData.workingDays).toEqual([
        'السبت',
        'الأحد',
        'الاثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
      ])
      expect(state.formData.priceFrom).toBe(25)
      expect(state.formData.priceTo).toBe(150)
      expect(state.formData.governorateId).toBe(1)
      expect(state.formData.wilayaId).toBe(101)
      expect(state.formData.governorateNameAr).toBe('مسقط')
      expect(state.formData.wilayaNameAr).toBe('السيب')
      expect(state.formData.existingImages).toEqual([
        { id: 'img-1', url: 'https://cdn.souqone.app/srv1.jpg' },
        { id: 'img-2', url: 'https://cdn.souqone.app/srv2.jpg' },
      ])

      // Confirm that no version property is set anywhere
      expect((state.formData as any).version).toBeUndefined()

      // Confirm navigation
      expect(router.push).toHaveBeenCalledWith('/services/new')
    })
  })

  describe('EditListingLoader route (/post/edit/[id])', () => {
    it('fetches service and routes to /services/new with setEditMode', async () => {
      await render(<EditListingLoader />)

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/services/new')
      })

      const state = useServiceWizardStore.getState()
      expect(state.formData.editMode).toBe(true)
      expect(state.formData.editListingId).toBe('srv-999')
      expect(state.formData.title).toBe('كراج الفخامة لصيانة وبرمجة السيارات')
      expect(state.formData.serviceType).toBe('MAINTENANCE')
      expect(state.formData.providerType).toBe('WORKSHOP')
      expect(state.formData.specializations).toEqual([
        'تغيير زيت وفلاتر',
        'ميكانيكا عامة',
        'فحص كمبيوتر شامل',
      ])
    })
  })
})
