import { renderHook, act } from '@testing-library/react-native'
import {
  buildListingShareUrl,
  detailRoute,
  editRoute,
  loginRoute,
  postEntryRoute,
  startEdit,
} from '../listingRoutes'
import { useListingNavigation } from '../useListingNavigation'
import { useCarWizardStore } from '../../store/carWizardStore'
import { usePartWizardStore } from '../../store/partWizardStore'
import { useServiceWizardStore } from '../../store/serviceWizardStore'
import { useAuthStore } from '../../store/authStore'
import { toastService } from '../../store/toastStore'
import { listingsApi } from '../../api/listings'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

jest.mock('../../api/listings', () => ({
  listingsApi: { getById: jest.fn() },
}))

jest.mock('../../api/parts', () => ({
  partsApi: { getById: jest.fn() },
}))

jest.mock('../../api/services', () => ({
  servicesApi: { getById: jest.fn() },
}))

describe('listingRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCarWizardStore.getState().resetForm()
    usePartWizardStore.getState().reset()
    useServiceWizardStore.getState().reset()
    useAuthStore.setState({ isLoggedIn: true })
  })

  it.each([
    ['LISTING', '101', '/cars/101', '/cars/new', 'https://souqone.app/listings/101'],
    ['car', '101', '/cars/101', '/cars/new', 'https://souqone.app/listings/101'],
    ['BUS_LISTING', '202', '/buses/202', '/buses/edit/202', 'https://souqone.app/buses/202'],
    ['bus', '202', '/buses/202', '/buses/edit/202', 'https://souqone.app/buses/202'],
    ['EQUIPMENT_LISTING', '303', '/equipment/303', '/equipment/edit/303', 'https://souqone.app/equipment/303'],
    ['equipment', '303', '/equipment/303', '/equipment/edit/303', 'https://souqone.app/equipment/303'],
    ['OPERATOR_LISTING', '404', '/equipment/operators/404', '/equipment/operators/edit/404', 'https://souqone.app/equipment/operators/404'],
    ['operator', '404', '/equipment/operators/404', '/equipment/operators/edit/404', 'https://souqone.app/equipment/operators/404'],
    ['SPARE_PART', '505', '/parts/505', '/parts/new', 'https://souqone.app/parts/505'],
    ['part', '505', '/parts/505', '/parts/new', 'https://souqone.app/parts/505'],
    ['CAR_SERVICE', '606', '/services/606', '/services/new', 'https://souqone.app/services/606'],
    ['service', '606', '/services/606', '/services/new', 'https://souqone.app/services/606'],
  ])(
    'maps %s (%s) to detailRoute=%s, editRoute=%s, shareUrl=%s',
    (entityType, id, expectedDetail, expectedEdit, expectedShare) => {
      expect(detailRoute(entityType, id)).toBe(expectedDetail)
      expect(editRoute(entityType, id)).toBe(expectedEdit)
      expect(buildListingShareUrl(entityType, id)).toBe(expectedShare)
    }
  )

  it('returns canonical postEntryRoute and loginRoute', () => {
    expect(postEntryRoute()).toBe('/(modals)/post-category')
    expect(loginRoute()).toBe('/(auth)/login')
    expect(loginRoute('/cars/12')).toBe('/(auth)/login?redirect=%2Fcars%2F12')
    expect(loginRoute('//evil.com')).toBe('/(auth)/login')
  })

  it('startEdit populates the wizard store for LISTING, SPARE_PART, CAR_SERVICE and returns target route', () => {
    const carRoute = startEdit('LISTING', {
      id: 'car-1',
      title: 'Camry',
      listingType: 'SALE',
      price: 5000,
    })
    expect(carRoute).toBe('/cars/new')
    expect(useCarWizardStore.getState().formData.editMode).toBe(true)
    expect(useCarWizardStore.getState().formData.editListingId).toBe('car-1')
    expect(useCarWizardStore.getState().formData.title).toBe('Camry')

    const partRoute = startEdit('SPARE_PART', {
      id: 'part-1',
      title: 'Brake Pad',
      condition: 'LIKE_NEW',
      price: 25,
    })
    expect(partRoute).toBe('/parts/new')
    expect(usePartWizardStore.getState().formData.editMode).toBe(true)
    expect(usePartWizardStore.getState().formData.editListingId).toBe('part-1')
    expect(usePartWizardStore.getState().formData.condition).toBe('NEW')

    const serviceRoute = startEdit('CAR_SERVICE', {
      id: 'srv-1',
      title: 'Oil Change',
      providerName: 'Al Noor Garage',
      priceFrom: 10,
      priceTo: 20,
    })
    expect(serviceRoute).toBe('/services/new')
    expect(useServiceWizardStore.getState().formData.editMode).toBe(true)
    expect(useServiceWizardStore.getState().formData.editListingId).toBe('srv-1')
    expect(useServiceWizardStore.getState().formData.providerName).toBe('Al Noor Garage')

    expect(startEdit('BUS_LISTING', { id: 'bus-1' })).toBe('/buses/edit/bus-1')
    expect(startEdit('EQUIPMENT_LISTING', { id: 'eq-1' })).toBe('/equipment/edit/eq-1')
    expect(startEdit('OPERATOR_LISTING', { id: 'op-1' })).toBe('/equipment/operators/edit/op-1')
  })

  it('useListingNavigation fetches item when omitted in editListing and handles errors cleanly', async () => {
    ;(listingsApi.getById as jest.Mock).mockResolvedValueOnce({
      data: { id: 'car-99', title: 'Fetched Car', listingType: 'SALE' },
    })
    ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(new Error('network'))
    ;(servicesApi.getById as jest.Mock).mockResolvedValueOnce({
      id: 'srv-99',
      title: 'Fetched Service',
    })
    const showSpy = jest.spyOn(toastService, 'show').mockImplementation(jest.fn())

    const { result } = await renderHook(() => useListingNavigation())

    await act(async () => {
      const ok = await result.current.editListing('LISTING', 'car-99')
      expect(ok).toBe(true)
    })
    expect(listingsApi.getById).toHaveBeenCalledWith('car-99')
    expect(mockPush).toHaveBeenCalledWith('/cars/new')
    expect(result.current.isEditingLoading).toBe(false)

    await act(async () => {
      const ok = await result.current.editListing('SPARE_PART', 'part-99')
      expect(ok).toBe(false)
    })
    expect(showSpy).toHaveBeenCalled()
    expect(result.current.isEditingLoading).toBe(false)

    await act(async () => {
      const ok = await result.current.editListing('CAR_SERVICE', 'srv-99')
      expect(ok).toBe(true)
    })
    expect(servicesApi.getById).toHaveBeenCalledWith('srv-99')
    expect(mockPush).toHaveBeenCalledWith('/services/new')
  })

  it('useListingNavigation routes openListing, openPostListing (auth check), and goToLogin', async () => {
    const { result } = await renderHook(() => useListingNavigation())

    act(() => {
      result.current.openListing('BUS_LISTING', 'b-1')
    })
    expect(mockPush).toHaveBeenCalledWith('/buses/b-1')

    await act(async () => {
      useAuthStore.setState({ isLoggedIn: false })
    })
    await act(async () => {
      result.current.openPostListing({ requireAuth: true })
    })
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2F(modals)%2Fpost-category')

    await act(async () => {
      useAuthStore.setState({ isLoggedIn: true })
    })
    await act(async () => {
      result.current.openPostListing({ requireAuth: true })
    })
    expect(mockPush).toHaveBeenCalledWith('/(modals)/post-category')

    act(() => {
      result.current.goToLogin('/cars/5', 'replace')
    })
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login?redirect=%2Fcars%2F5')
  })
})
