import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, fireEvent } from '@testing-library/react-native'
import { PART_CATEGORIES, PART_CATEGORY_LABELS } from '../constants/parts'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../constants/services'
import { PartStep1Category } from '../components/parts/wizard/PartStep1Category'
import { ServiceStep1Type } from '../components/services/wizard/ServiceStep1Type'
import { PARTS_LANDING_CATEGORIES, PartsCategoriesGrid } from '../components/parts/PartsCategoriesGrid'
import { SERVICES_LANDING_CATEGORIES, ServicesCategoriesGrid } from '../components/services/ServicesCategoriesGrid'
import { PartsVisualFilters } from '../components/parts/PartsVisualFilters'
import { ServicesVisualFilters } from '../components/services/ServicesVisualFilters'
import { MAIN_CATEGORY_TABS } from '../components/profile/MyListingsVisualFilters'
import { mapPartToCard } from '../utils/mappers'
import { buildPartsQueryParams } from '../utils/browse-filters/partsBrowseFilters'
import { buildServicesQueryParams } from '../utils/browse-filters/servicesBrowseFilters'
import { PartFormData } from '../store/partWizardStore'
import { ServiceFormData } from '../store/serviceWizardStore'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  router: { push: mockPush, back: jest.fn() },
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Feather: 'Feather',
}))

const ROOT = path.resolve(__dirname, '../..')

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

describe('D-389: Single Source of Truth for Parts & Services Category Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Parts categories derive from src/constants/parts.ts (PART_CATEGORIES)', () => {
    it('PartStep1Category wizard renders all 11 PART_CATEGORIES in canonical order and emits exact enum id', async () => {
      const onUpdateField = jest.fn()
      const { getByTestId, getByText } = await render(
        <PartStep1Category
          formData={{} as PartFormData}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      )

      await fireEvent.press(getByTestId('part-category-select'))

      for (const cat of PART_CATEGORIES) {
        expect(getByTestId(`category-${cat.id}`)).toBeTruthy()
        expect(getByText(cat.label)).toBeTruthy()
      }

      await fireEvent.press(getByTestId('category-SUSPENSION'))
      expect(onUpdateField).toHaveBeenCalledWith('partCategory', 'SUSPENSION')
    })

    it('PartsCategoriesGrid derives exact ids, order, and labels from PART_CATEGORIES and navigates with enum id', async () => {
      const gridItems = PARTS_LANDING_CATEGORIES.filter((c) => c.id !== 'all')
      expect(gridItems.map((c) => ({ id: c.id, label: c.label }))).toEqual(
        PART_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))
      )

      const { getByText } = await render(<PartsCategoriesGrid />)
      await fireEvent.press(getByText(PART_CATEGORY_LABELS.ENGINE))
      expect(mockPush).toHaveBeenCalledWith('/parts/browse?category=ENGINE')
    })

    it('PartsVisualFilters renders canonical PART_CATEGORIES labels and passes exact enum id to onSelectFilter', async () => {
      const onSelectFilter = jest.fn()
      const { getByText } = await render(
        <PartsVisualFilters onSelectFilter={onSelectFilter} onViewAll={jest.fn()} />
      )

      for (const cat of PART_CATEGORIES) {
        expect(getByText(cat.label)).toBeTruthy()
      }

      await fireEvent.press(getByText(PART_CATEGORY_LABELS.BRAKES))
      expect(onSelectFilter).toHaveBeenCalledWith('category', 'BRAKES', PART_CATEGORY_LABELS.BRAKES)
    })

    it('MyListingsVisualFilters parts tab derives exact ids, order, and labels from PART_CATEGORIES', () => {
      const partsTab = MAIN_CATEGORY_TABS.find((t) => t.id === 'parts')
      expect(partsTab).toBeDefined()
      const categoryItems = partsTab!.items.filter((i) =>
        PART_CATEGORIES.some((c) => c.id === i.id)
      )
      expect(categoryItems.map((i) => ({ id: i.id, label: i.label }))).toEqual(
        PART_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))
      )
    })

    it('mapPartToCard and buildPartsQueryParams use canonical labels and exact enum values for all 11 categories', () => {
      for (const cat of PART_CATEGORIES) {
        const mapped = mapPartToCard({
          id: `part-${cat.id}`,
          title: 'قطعة تجريبية',
          price: 50,
          partCategory: cat.id,
        })
        expect(mapped.details?.some((d) => d.value === cat.label)).toBe(true)

        const query = buildPartsQueryParams({ category: cat.id })
        expect(query.partCategory).toBe(cat.id)
      }
    })
  })

  describe('2. Services types derive from src/constants/services.ts (SERVICE_TYPES)', () => {
    it('ServiceStep1Type wizard renders all 9 SERVICE_TYPES in canonical order and emits exact enum id', async () => {
      const onUpdateField = jest.fn()
      const { getByTestId, getByText } = await render(
        <ServiceStep1Type
          formData={{} as ServiceFormData}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      )

      await fireEvent.press(getByTestId('service-type-select'))

      for (const st of SERVICE_TYPES) {
        expect(getByTestId(`service-type-${st.id}`)).toBeTruthy()
        expect(getByText(st.label)).toBeTruthy()
      }

      await fireEvent.press(getByTestId('service-type-ACCESSORIES_INSTALL'))
      expect(onUpdateField).toHaveBeenCalledWith('serviceType', 'ACCESSORIES_INSTALL')
    })

    it('ServicesCategoriesGrid derives exact ids, order, and labels from SERVICE_TYPES and navigates with enum id', async () => {
      const gridItems = SERVICES_LANDING_CATEGORIES.filter((c) => c.id !== 'all')
      expect(gridItems.map((c) => ({ id: c.id, label: c.label }))).toEqual(
        SERVICE_TYPES.map((t) => ({ id: t.id, label: t.label }))
      )

      const { getByText } = await render(<ServicesCategoriesGrid />)
      await fireEvent.press(getByText(SERVICE_TYPE_LABELS.TOWING))
      expect(mockPush).toHaveBeenCalledWith('/services/browse?serviceType=TOWING')
    })

    it('ServicesVisualFilters renders canonical SERVICE_TYPES labels and passes exact enum id to onSelectFilter', async () => {
      const onSelectFilter = jest.fn()
      const { getByText } = await render(
        <ServicesVisualFilters onSelectFilter={onSelectFilter} onViewAll={jest.fn()} />
      )

      for (const st of SERVICE_TYPES) {
        expect(getByText(st.label)).toBeTruthy()
      }

      await fireEvent.press(getByText(SERVICE_TYPE_LABELS.BODYWORK))
      expect(onSelectFilter).toHaveBeenCalledWith(
        'serviceType',
        'BODYWORK',
        SERVICE_TYPE_LABELS.BODYWORK
      )
    })

    it('MyListingsVisualFilters services tab derives exact ids, order, and labels from SERVICE_TYPES', () => {
      const servicesTab = MAIN_CATEGORY_TABS.find((t) => t.id === 'services')
      expect(servicesTab).toBeDefined()
      const serviceItems = servicesTab!.items.filter((i) =>
        SERVICE_TYPES.some((t) => t.id === i.id)
      )
      expect(serviceItems.map((i) => ({ id: i.id, label: i.label }))).toEqual(
        SERVICE_TYPES.map((t) => ({ id: t.id, label: t.label }))
      )
    })

    it('buildServicesQueryParams sends exact enum value for every SERVICE_TYPES entry', () => {
      for (const st of SERVICE_TYPES) {
        const query = buildServicesQueryParams({ serviceType: st.id })
        expect(query.serviceType).toBe(st.id)
      }
    })
  })

  describe('3. No local duplicate category/type copies remain in consumers', () => {
    it('all Parts and Services consumers import from src/constants/parts.ts or src/constants/services.ts', () => {
      expect(readRepoFile('src/components/parts/wizard/PartStep1Category.tsx')).not.toContain(
        'CATEGORIES_DATA'
      )
      expect(readRepoFile('src/components/parts/PartCard.tsx')).not.toContain('const CATEGORY_MAP')
      expect(readRepoFile('src/utils/mappers.ts')).not.toContain('const CATEGORY_MAP')
      expect(readRepoFile('src/components/services/ServiceCard.tsx')).not.toContain(
        'const SERVICE_TYPE_LABELS'
      )
      expect(readRepoFile('src/components/parts/PartsCategoriesGrid.tsx')).toContain(
        'PART_CATEGORIES'
      )
      expect(readRepoFile('src/components/services/ServicesCategoriesGrid.tsx')).toContain(
        'SERVICE_TYPES'
      )
      expect(readRepoFile('src/components/profile/MyListingsVisualFilters.tsx')).toContain(
        'PART_CATEGORIES'
      )
      expect(readRepoFile('src/components/profile/MyListingsVisualFilters.tsx')).toContain(
        'SERVICE_TYPES'
      )
    })
  })
})
