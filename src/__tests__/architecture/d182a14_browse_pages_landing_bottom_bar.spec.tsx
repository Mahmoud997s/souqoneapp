import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderHook } from '@testing-library/react-native'
import {
  useCarsBottomBar,
  useBusesBottomBar,
  useEquipmentBottomBar,
  usePartsBottomBar,
  useServicesBottomBar,
} from '../../hooks/useDepartmentBottomBar'
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../components/navigation/UnifiedBottomBar'

// Mock expo-router
let mockPathname = '/cars/browse'
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(cb, [cb])
  },
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    isLoggedIn: false,
    user: null,
  }),
}))

jest.mock('../../components/ui/DraftResumePrompt', () => ({
  navigateToCarForm: jest.fn(),
  navigateToBusForm: jest.fn(),
  navigateToEquipmentForm: jest.fn(),
  navigateToPartForm: jest.fn(),
  navigateToServiceForm: jest.fn(),
  showDraftResumePrompt: jest.fn(),
  hasMeaningfulPostData: jest.fn(),
}))

describe('D-182a14: Browse pages department bottom bar parity with landing', () => {
  const browseFiles = [
    {
      screen: 'CarsBrowseScreen',
      path: path.resolve(__dirname, '../../../app/cars/browse.tsx'),
      expectedBar: 'CarsBottomBar',
      importPath: '../../src/components/cars/CarsBottomBar',
    },
    {
      screen: 'BusesBrowseScreen',
      path: path.resolve(__dirname, '../../../app/buses/browse.tsx'),
      expectedBar: 'BusesBottomBar',
      importPath: '../../src/components/buses/BusesBottomBar',
    },
    {
      screen: 'EquipmentBrowseScreen',
      path: path.resolve(__dirname, '../../../app/equipment/browse.tsx'),
      expectedBar: 'EquipmentBottomBar',
      importPath: '../../src/components/equipment/EquipmentBottomBar',
    },
    {
      screen: 'PartsBrowseScreen',
      path: path.resolve(__dirname, '../../../app/parts/browse.tsx'),
      expectedBar: 'PartsBottomBar',
      importPath: '../../src/components/parts/PartsBottomBar',
    },
    {
      screen: 'ServicesBrowseScreen',
      path: path.resolve(__dirname, '../../../app/services/browse.tsx'),
      expectedBar: 'ServicesBottomBar',
      importPath: '../../src/components/services/ServicesBottomBar',
    },
    {
      screen: 'OperatorsBrowseScreen',
      path: path.resolve(__dirname, '../../../app/equipment/operators/browse.tsx'),
      expectedBar: 'EquipmentBottomBar',
      importPath: '../../../src/components/equipment/EquipmentBottomBar',
    },
  ]

  browseFiles.forEach(({ screen, path: filePath, expectedBar, importPath }) => {
    describe(`${screen} static contract`, () => {
      const source = fs.readFileSync(filePath, 'utf8')

      it(`imports ${expectedBar} and UNIFIED_BOTTOM_BAR_HEIGHT`, () => {
        expect(source).toContain(expectedBar)
        expect(source).toContain(importPath)
        expect(source).toContain('UNIFIED_BOTTOM_BAR_HEIGHT')
      })

      it(`renders <${expectedBar} /> at the screen root`, () => {
        expect(source).toMatch(new RegExp(`<${expectedBar}(\\s+[^>]*?)?\\s*/>`, 'm'))
      })

      it('allocates bottom padding >= UNIFIED_BOTTOM_BAR_HEIGHT in list content', () => {
        expect(source).toMatch(/paddingBottom:\s*UNIFIED_BOTTOM_BAR_HEIGHT/)
      })
    })
  })

  describe('Dynamic activeTab routing logic via useDepartmentBottomBar', () => {
    it('sets activeTab to browse on /cars/browse and home on /cars', async () => {
      mockPathname = '/cars/browse'
      const { result: browseResult } = await renderHook(() => useCarsBottomBar())
      expect(browseResult.current.activeTab).toBe('browse')

      mockPathname = '/cars'
      const { result: homeResult } = await renderHook(() => useCarsBottomBar())
      expect(homeResult.current.activeTab).toBe('home')
    })

    it('sets activeTab to browse on /buses/browse and home on /buses', async () => {
      mockPathname = '/buses/browse'
      const { result: browseResult } = await renderHook(() => useBusesBottomBar())
      expect(browseResult.current.activeTab).toBe('browse')

      mockPathname = '/buses'
      const { result: homeResult } = await renderHook(() => useBusesBottomBar())
      expect(homeResult.current.activeTab).toBe('home')
    })

    it('sets activeTab to browse on /equipment/browse, operators on /equipment/operators/browse, and home on /equipment', async () => {
      mockPathname = '/equipment/browse'
      const { result: browseResult } = await renderHook(() => useEquipmentBottomBar())
      expect(browseResult.current.activeTab).toBe('browse')

      mockPathname = '/equipment/operators/browse'
      const { result: opResult } = await renderHook(() => useEquipmentBottomBar())
      expect(opResult.current.activeTab).toBe('operators')

      mockPathname = '/equipment'
      const { result: homeResult } = await renderHook(() => useEquipmentBottomBar())
      expect(homeResult.current.activeTab).toBe('home')
    })

    it('sets activeTab to browse on /parts/browse and home on /parts', async () => {
      mockPathname = '/parts/browse'
      const { result: browseResult } = await renderHook(() => usePartsBottomBar())
      expect(browseResult.current.activeTab).toBe('browse')

      mockPathname = '/parts'
      const { result: homeResult } = await renderHook(() => usePartsBottomBar())
      expect(homeResult.current.activeTab).toBe('home')
    })

    it('sets activeTab to browse on /services/browse and home on /services', async () => {
      mockPathname = '/services/browse'
      const { result: browseResult } = await renderHook(() => useServicesBottomBar())
      expect(browseResult.current.activeTab).toBe('browse')

      mockPathname = '/services'
      const { result: homeResult } = await renderHook(() => useServicesBottomBar())
      expect(homeResult.current.activeTab).toBe('home')
    })

    it('proves all 5 landings always default to home even with search query params or unknown child routes', async () => {
      mockPathname = '/cars?filter=used'
      const { result: carsResult } = await renderHook(() => useCarsBottomBar())
      expect(carsResult.current.activeTab).toBe('home')

      mockPathname = '/buses?type=school'
      const { result: busesResult } = await renderHook(() => useBusesBottomBar())
      expect(busesResult.current.activeTab).toBe('home')

      mockPathname = '/equipment?category=heavy'
      const { result: eqResult } = await renderHook(() => useEquipmentBottomBar())
      expect(eqResult.current.activeTab).toBe('home')

      mockPathname = '/parts?make=Toyota'
      const { result: partsResult } = await renderHook(() => usePartsBottomBar())
      expect(partsResult.current.activeTab).toBe('home')

      mockPathname = '/services?gov=muscat'
      const { result: srvResult } = await renderHook(() => useServicesBottomBar())
      expect(srvResult.current.activeTab).toBe('home')
    })
  })
})
