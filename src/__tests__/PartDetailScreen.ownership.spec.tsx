import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import PartDetailScreen from '../../app/parts/[id]'
import { useAuthStore } from '../store/authStore'
import { usePartWizardStore } from '../store/partWizardStore'
import { usePart } from '../hooks/useParts'
import { usePartDetail } from '../screens/parts/hooks/usePartDetail'
import { mapPartDetailViewModel } from '../screens/parts/mappers/partDetailViewModel'
import { partsApi } from '../api/parts'
import { dialogService } from '../store/dialogStore'
import { router } from 'expo-router'

jest.mock('../../src/hooks/useParts')
jest.mock('../../src/screens/parts/hooks/usePartDetail')
jest.mock('../../src/hooks/listing-detail/usePartDetail')
jest.mock('../../src/features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))
jest.mock('../../src/hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    call: jest.fn(),
    whatsApp: jest.fn(),
    chat: jest.fn(),
    busy: false,
  }),
}))
jest.mock('../../src/utils/assertOwnerHasPhoneForEdit', () => ({
  assertOwnerHasPhoneForEdit: jest.fn().mockResolvedValue(true),
}))
jest.mock('../../src/hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))
jest.mock('../../src/api/parts', () => ({
  partsApi: {
    remove: jest.fn(),
  },
}))
jest.mock('../../src/api/chat', () => ({
  chatApi: {
    createRoom: jest.fn(),
  },
}))
jest.mock('expo-image', () => ({
  Image: ({ source, style }: any) => <></>,
}))
const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
}
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'part-123' }),
  router: mockRouter,
  useRouter: () => mockRouter,
}))
jest.mock('../../src/store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn(),
    alert: jest.fn(),
  },
}))

const mockPartData = {
  id: 'part-123',
  title: 'سفايف كامري 2020',
  description: 'سفايف أصلية وكالة',
  partCategory: 'BRAKES',
  condition: 'NEW',
  partNumber: '04465-33470',
  compatibleMakes: ['toyota'],
  compatibleModels: ['Camry'],
  yearFrom: 2018,
  yearTo: 2022,
  isOriginal: true,
  hasWarranty: true,
  warrantyDuration: 'SIX_MONTHS',
  quantity: 'ONE',
  compatibleVehicleTypes: ['CAR'],
  price: 45,
  currency: 'OMR',
  isPriceNegotiable: false,
  whatsappEnabled: true,
  contactPhone: '91234567',
  whatsapp: '91234567',
  governorateId: 1,
  wilayaId: 10,
  governorateRef: { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
  wilayaRef: { id: 10, nameAr: 'السيب', nameEn: 'Seeb' },
  latitude: 23.6,
  longitude: 58.4,
  sellerId: 'user-seller-99',
  seller: {
    id: 'user-seller-99',
    username: 'ahmed_parts',
    displayName: 'أحمد لقطع الغيار',
    phone: '91234567',
  },
  images: [{ id: 'img-1', url: 'https://cdn.example.com/p1.jpg' }],
}

describe('PartDetailScreen Ownership & Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePartWizardStore.getState().reset()
    ;(usePart as jest.Mock).mockReturnValue({
      data: mockPartData,
      isLoading: false,
      isError: false,
    })
    ;(usePartDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: mapPartDetailViewModel(mockPartData),
      raw: mockPartData,
      refetch: jest.fn(),
      error: null,
    })
  })

  it('renders owner actions (Delete / Edit) when current user is the seller', async () => {
    useAuthStore.setState({
      user: { id: 'user-seller-99', email: 'ahmed@example.com', phone: '91234567' } as any,
    })

    await render(<PartDetailScreen />)

    expect(screen.getByText('حذف')).toBeTruthy()
    expect(screen.getByText('تعديل')).toBeTruthy()
    expect(screen.queryByText('محادثة')).toBeNull()
  })

  it('renders buyer actions (Call / WhatsApp / Chat) when user is not the seller', async () => {
    useAuthStore.setState({
      user: { id: 'buyer-user-55', email: 'buyer@example.com' } as any,
    })

    await render(<PartDetailScreen />)

    expect(screen.queryByText('حذف')).toBeNull()
    expect(screen.queryByText('تعديل')).toBeNull()
    expect(screen.getAllByText('محادثة').length).toBeGreaterThan(0)
    expect(screen.getAllByText('اتصال').length).toBeGreaterThan(0)
    expect(screen.getAllByText('واتساب').length).toBeGreaterThan(0)
  })

  it('renders buyer actions when user is logged out (null)', async () => {
    useAuthStore.setState({ user: null })

    await render(<PartDetailScreen />)

    expect(screen.queryByText('حذف')).toBeNull()
    expect(screen.queryByText('تعديل')).toBeNull()
    expect(screen.getAllByText('محادثة').length).toBeGreaterThan(0)
  })

  it('handleEditPart populates partWizardStore with editMode and navigates to /parts/new', async () => {
    useAuthStore.setState({
      user: { id: 'user-seller-99', email: 'ahmed@example.com', phone: '91234567' } as any,
    })

    await render(<PartDetailScreen />)

    const editBtn = screen.getByText('تعديل')
    await fireEvent.press(editBtn)

    const storeState = usePartWizardStore.getState()
    expect(storeState.formData.editMode).toBe(true)
    expect(storeState.formData.editListingId).toBe('part-123')
    expect(storeState.formData.title).toBe('سفايف كامري 2020')
    expect(storeState.formData.description).toBe('سفايف أصلية وكالة')
    expect(storeState.formData.partCategory).toBe('BRAKES')
    expect(storeState.formData.condition).toBe('NEW')
    expect(storeState.formData.partNumber).toBe('04465-33470')
    expect(storeState.formData.price).toBe(45)
    expect(storeState.formData.governorateNameAr).toBe('مسقط')
    expect(storeState.formData.wilayaNameAr).toBe('السيب')
    expect(storeState.formData.existingImages).toEqual([
      { id: 'img-1', url: 'https://cdn.example.com/p1.jpg' },
    ])
    expect(mockRouter.push).toHaveBeenCalledWith('/parts/new')
  })

  it('handleDeletePart prompts confirmation dialog, calls partsApi.remove, and navigates back', async () => {
    useAuthStore.setState({
      user: { id: 'user-seller-99', email: 'ahmed@example.com', phone: '91234567' } as any,
    })

    ;(partsApi.remove as jest.Mock).mockResolvedValue({})

    await render(<PartDetailScreen />)

    const deleteBtn = screen.getByText('حذف')
    await fireEvent.press(deleteBtn)

    expect(dialogService.confirm).toHaveBeenCalledWith(
      'حذف الإعلان',
      expect.stringContaining('هل أنت متأكد من حذف هذا الإعلان؟'),
      expect.any(Function),
      'نعم، احذف',
      'تراجع',
      true
    )

    // Execute the onConfirm callback
    const confirmCallback = (dialogService.confirm as jest.Mock).mock.calls[0][2]
    await act(async () => {
      await confirmCallback()
    })

    expect(partsApi.remove).toHaveBeenCalledWith('part-123')
    expect(dialogService.alert).toHaveBeenCalledWith(
      'تم',
      'تم حذف إعلان القطعة بنجاح',
      'success'
    )
    expect(mockRouter.back).toHaveBeenCalled()
  })
})
