import fs from 'fs'
import path from 'path'
import { renderHook, act } from '@testing-library/react-native'
import { startEdit } from '../listingRoutes'
import { useListingNavigation } from '../useListingNavigation'
import { useCarWizardStore } from '../../store/carWizardStore'
import { usePartWizardStore } from '../../store/partWizardStore'
import { useServiceWizardStore } from '../../store/serviceWizardStore'
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

const ROOT = path.resolve(__dirname, '../../..')

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '_parked' || entry.name === '__tests__' || entry.name === 'navigation') {
        continue
      }
      collectSourceFiles(full, out)
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.(spec|test)\.(ts|tsx)$/.test(entry.name)
    ) {
      out.push(full)
    }
  }
  return out
}

describe('D-346 route caller guards & edit identity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCarWizardStore.getState().resetForm()
    usePartWizardStore.getState().reset()
    useServiceWizardStore.getState().reset()
  })

  it('forbids literal detail/edit/post/login route pushes outside src/navigation', () => {
    const files = [
      ...collectSourceFiles(path.join(ROOT, 'src')),
      ...collectSourceFiles(path.join(ROOT, 'app')),
    ]
    const forbidden = [
      /router\.(push|replace)\(\s*['"`]\/login['"`]/,
      /router\.(push|replace)\(\s*\{\s*pathname:\s*['"`]\/login['"`]/,
      /router\.(push|replace)\(\s*['"`]\/\(auth\)\/login/,
      /router\.(push|replace)\(\s*['"`]\/\(modals\)\/post-category['"`]/,
      /router\.(push|replace)\(\s*['"`]\/post['"`]/,
      /router\.(push|replace)\(\s*['"`]\/post\/edit\//,
      /router\.(push|replace)\(\s*`\/listings\//,
    ]
    const violations: string[] = []
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/')
      // Auth screens, Window-1 forbidden files (delete-account), and redirect screens are excluded
      if (
        rel.startsWith('app/(auth)/') ||
        rel === 'app/profile/delete-account.tsx' ||
        rel === 'app/listings/[id].tsx' ||
        rel === 'app/post/edit/[id].tsx' ||
        rel === 'app/(tabs)/post.tsx'
      ) {
        continue
      }
      const content = fs.readFileSync(file, 'utf8')
      for (const rx of forbidden) {
        if (rx.test(content)) {
          violations.push(`${rel} matched ${rx}`)
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('editListing (My Listings) and startEdit (Detail Screen) produce identical store state & route for all 6 types', async () => {
    const carRaw = { id: 'c-1', title: 'Land Cruiser', listingType: 'SALE', price: 15000 }
    const partRaw = { id: 'p-1', title: 'Alternator', condition: 'NEW', price: 80 }
    const serviceRaw = { id: 's-1', title: 'AC Repair', providerName: 'Oman Auto', priceFrom: 15, priceTo: 30 }

    ;(listingsApi.getById as jest.Mock).mockResolvedValueOnce({ data: carRaw })
    ;(partsApi.getById as jest.Mock).mockResolvedValueOnce({ data: partRaw })
    ;(servicesApi.getById as jest.Mock).mockResolvedValueOnce({ data: serviceRaw })

    const { result } = await renderHook(() => useListingNavigation())

    // 1. Cars
    const detailCarRoute = startEdit('LISTING', carRaw)
    const detailCarForm = { ...useCarWizardStore.getState().formData }
    useCarWizardStore.getState().resetForm()
    await act(async () => {
      await result.current.editListing('car', 'c-1')
    })
    expect(mockPush).toHaveBeenLastCalledWith(detailCarRoute)
    expect(useCarWizardStore.getState().formData).toEqual(detailCarForm)

    // 2. Parts
    const detailPartRoute = startEdit('SPARE_PART', partRaw)
    const detailPartForm = { ...usePartWizardStore.getState().formData }
    usePartWizardStore.getState().reset()
    await act(async () => {
      await result.current.editListing('part', 'p-1')
    })
    expect(mockPush).toHaveBeenLastCalledWith(detailPartRoute)
    expect(usePartWizardStore.getState().formData).toEqual(detailPartForm)

    // 3. Services
    const detailServiceRoute = startEdit('CAR_SERVICE', serviceRaw)
    const detailServiceForm = { ...useServiceWizardStore.getState().formData }
    useServiceWizardStore.getState().reset()
    await act(async () => {
      await result.current.editListing('service', 's-1')
    })
    expect(mockPush).toHaveBeenLastCalledWith(detailServiceRoute)
    expect(useServiceWizardStore.getState().formData).toEqual(detailServiceForm)

    // 4. Buses, 5. Equipment, 6. Operators
    for (const [alias, canonical, id] of [
      ['bus', 'BUS_LISTING', 'b-1'],
      ['equipment', 'EQUIPMENT_LISTING', 'e-1'],
      ['operator', 'OPERATOR_LISTING', 'o-1'],
    ] as const) {
      const detailRouteTarget = startEdit(canonical, { id })
      await act(async () => {
        await result.current.editListing(alias, id)
      })
      expect(mockPush).toHaveBeenLastCalledWith(detailRouteTarget)
    }
  })

  it('frozen-payload assertion: startEdit produces exact literal store payload for parts and services', () => {
    const fixedPartRaw: Parameters<typeof startEdit>[1] = {
      id: 'part-frozen-1',
      listingType: 'SALE',
      title: 'فلتر هواء أصلي',
      description: 'مناسب لكامري 2020-2024',
      partCategory: 'ENGINE',
      condition: 'LIKE_NEW',
      partNumber: 'AF-909',
      compatibleMakes: ['Toyota'],
      compatibleModels: ['Camry'],
      yearFrom: 2020,
      yearTo: 2024,
      isOriginal: true,
      hasWarranty: true,
      warrantyDuration: 'SIX_MONTHS',
      quantity: 'TWO_TO_FIVE',
      compatibleVehicleTypes: ['CAR'],
      price: 28,
      currency: 'USD',
      isPriceNegotiable: true,
      whatsappEnabled: true,
      governorateId: 1,
      wilayaId: 10,
      governorateRef: { nameAr: 'مسقط' },
      wilayaRef: { nameAr: 'السيب' },
      latitude: 23.6,
      longitude: 58.2,
      images: [{ id: 'img-1', url: 'https://cdn/part.jpg' }],
    }

    const partRoute = startEdit('SPARE_PART', fixedPartRaw)
    expect(partRoute).toBe('/parts/new')
    const partState = usePartWizardStore.getState().formData
    expect(partState.editMode).toBe(true)
    expect(partState.editListingId).toBe('part-frozen-1')
    expect(partState).toMatchObject({
      editMode: true,
      editListingId: 'part-frozen-1',
      listingType: 'SPARE_PART_SALE',
      title: 'فلتر هواء أصلي',
      description: 'مناسب لكامري 2020-2024',
      partCategory: 'ENGINE',
      condition: 'NEW',
      partNumber: 'AF-909',
      compatibleMakes: ['Toyota'],
      compatibleModels: ['Camry'],
      yearFrom: 2020,
      yearTo: 2024,
      isOriginal: true,
      hasWarranty: true,
      warrantyDuration: 'SIX_MONTHS',
      quantity: 'TWO_TO_FIVE',
      compatibleVehicleTypes: ['CAR'],
      price: 28,
      currency: 'OMR',
      isPriceNegotiable: true,
      whatsappEnabled: true,
      governorateId: 1,
      wilayaId: 10,
      governorateNameAr: 'مسقط',
      wilayaNameAr: 'السيب',
      latitude: 23.6,
      longitude: 58.2,
      existingImages: [{ id: 'img-1', url: 'https://cdn/part.jpg' }],
    })

    const fixedServiceRaw = {
      id: 'srv-frozen-1',
      title: 'تبديل زيوت وفلاتر',
      description: 'خدمة سريعة في الموقع',
      serviceType: 'MAINTENANCE',
      providerType: 'WORKSHOP',
      providerName: 'ورشة النخبة',
      specializations: ['TOYOTA', 'LEXUS'],
      isHomeService: true,
      workingHoursOpen: '08:00',
      workingHoursClose: '20:00',
      workingDays: ['SUN', 'MON'],
      priceFrom: 12,
      priceTo: 25,
      currency: 'OMR',
      whatsappEnabled: true,
      website: 'https://elite.om',
      governorateId: 2,
      wilayaId: 20,
      governorateRef: { nameAr: 'شمال الباطنة' },
      wilayaRef: { nameAr: 'صحار' },
      address: 'المنطقة الصناعية',
      latitude: 24.3,
      longitude: 56.7,
      images: [{ id: 's-img-1', url: 'https://cdn/srv.jpg' }],
    }

    const serviceRoute = startEdit('CAR_SERVICE', fixedServiceRaw)
    expect(serviceRoute).toBe('/services/new')
    const serviceState = useServiceWizardStore.getState().formData
    expect(serviceState).toMatchObject({
      editMode: true,
      editListingId: 'srv-frozen-1',
      title: 'تبديل زيوت وفلاتر',
      description: 'خدمة سريعة في الموقع',
      serviceType: 'MAINTENANCE',
      providerType: 'WORKSHOP',
      providerName: 'ورشة النخبة',
      specializations: ['TOYOTA', 'LEXUS'],
      isHomeService: true,
      workingHoursOpen: '08:00',
      workingHoursClose: '20:00',
      workingDays: ['SUN', 'MON'],
      priceFrom: 12,
      priceTo: 25,
      currency: 'OMR',
      whatsappEnabled: true,
      website: 'https://elite.om',
      governorateId: 2,
      wilayaId: 20,
      governorateNameAr: 'شمال الباطنة',
      wilayaNameAr: 'صحار',
      address: 'المنطقة الصناعية',
      latitude: 24.3,
      longitude: 56.7,
      existingImages: [{ id: 's-img-1', url: 'https://cdn/srv.jpg' }],
    })
  })
})
