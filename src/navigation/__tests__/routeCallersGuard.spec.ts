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
})
