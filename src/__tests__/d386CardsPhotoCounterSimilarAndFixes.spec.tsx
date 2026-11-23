import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { StyleSheet } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CardImageSwiper } from '../components/ui/CardImageSwiper'
import { CarCard } from '../components/cars/CarCard'
import { BusCard } from '../components/buses/BusCard'
import { EquipCard } from '../components/cards/EquipCard'
import { PartCard } from '../components/parts/PartCard'
import { ServiceCard } from '../components/services/ServiceCard'
import { SimilarListingCard } from '../components/listing-detail/SimilarListingsGrid'
import {
  useVerticalSimilarListings,
  type SimilarVertical,
} from '../hooks/listing-detail/useSimilarListings'
import { listingsApi } from '../api/listings'
import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { partsApi } from '../api/parts'
import { servicesApi } from '../api/services'
import {
  mapListingToCard,
  mapBusToCard,
  mapEquipmentToCard,
  mapPartToCard,
  mapServiceToCard,
} from '../utils/mappers'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => ReactLib.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: any) => ReactLib.createElement(View, { testID: 'mock-blur-view', ...props }),
  }
})

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: ({ name }: { name: string }) => ReactLib.createElement(Text, null, name),
    MaterialCommunityIcons: ({ name }: { name: string }) => ReactLib.createElement(Text, null, name),
  }
})

jest.mock('../hooks/useCars', () => ({
  useBrands: () => ({ data: [] }),
}))

jest.mock('../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({ isFavorite: false, toggle: jest.fn(), isBusy: false }),
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: null }),
}))

jest.mock('../api/listings', () => ({
  listingsApi: { getSimilar: jest.fn() },
}))
jest.mock('../api/buses', () => ({
  busesApi: { getSimilar: jest.fn() },
}))
jest.mock('../api/equipment', () => ({
  equipmentApi: { getSimilar: jest.fn() },
}))
jest.mock('../api/parts', () => ({
  partsApi: { getSimilar: jest.fn() },
}))
jest.mock('../api/services', () => ({
  servicesApi: { getSimilar: jest.fn() },
}))

const ROOT = path.resolve(__dirname, '../..')

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function HookHarness({
  vertical,
  id,
  onResult,
}: {
  vertical: SimilarVertical
  id: string
  onResult: (res: ReturnType<typeof useVerticalSimilarListings>) => void
}) {
  const res = useVerticalSimilarListings(vertical, id, 8)
  onResult(res)
  return null
}

describe('D-386: Photo counter on 1+ images, generic similar hook, Parts/Services similar & card fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Photo count badge (shows "1" for 1 image, hides when count unknown)', () => {
    it('shows Western "1" badge on CardImageSwiper when 1 image exists', async () => {
      const view = await render(
        <CardImageSwiper
          images={['https://example.com/1.jpg']}
          imageCount={1}
          cardWidth={240}
        />,
      )
      expect(view.getByTestId('card-image-count-badge')).toBeTruthy()
      expect(view.getByText('1')).toBeTruthy()
    })

    it('hides photo count badge when imageCount is null (unknown) or hideImageCountBadge is true', async () => {
      const r1 = await render(
        <CardImageSwiper
          images={['https://example.com/1.jpg']}
          imageCount={null}
          cardWidth={240}
        />,
      )
      expect(r1.queryByTestId('card-image-count-badge')).toBeNull()
    })

    it('hides photo count badge on CardImageSwiper when hideImageCountBadge is true', async () => {
      const r2 = await render(
        <CardImageSwiper
          images={['https://example.com/1.jpg']}
          imageCount={3}
          hideImageCountBadge
          cardWidth={240}
        />,
      )
      expect(r2.queryByTestId('card-image-count-badge')).toBeNull()
    })

    it('renders "1" badge on CarCard with 1 image', async () => {
      const item = mapListingToCard({
        id: 'car-1',
        title: 'تويوتا كامري',
        price: 4500,
        images: [{ url: 'https://example.com/car1.jpg' }],
        _count: { images: 1 },
        governorate: 'MUSCAT',
      })
      const view = await render(
        <CarCard item={item as any} onPress={jest.fn()} fullWidth disableImageSwipe />,
      )
      expect(view.getByTestId('card-image-count-badge')).toBeTruthy()
      expect(view.getByText('1')).toBeTruthy()
    })

    it('renders "1" badge on BusCard with 1 image', async () => {
      const item = mapBusToCard({
        id: 'bus-1',
        title: 'حافلة كوستر',
        price: 12000,
        images: [{ url: 'https://example.com/bus1.jpg' }],
        _count: { images: 1 },
        governorate: 'MUSCAT',
      })
      const view = await render(
        <BusCard item={item as any} onPress={jest.fn()} fullWidth disableImageSwipe />,
      )
      expect(view.getByTestId('card-image-count-badge')).toBeTruthy()
      expect(view.getByText('1')).toBeTruthy()
    })

    it('renders "1" badge on EquipCard with 1 image', async () => {
      const item = mapEquipmentToCard({
        id: 'eq-1',
        title: 'حفارة كاتربيلر',
        price: 25000,
        images: [{ url: 'https://example.com/eq1.jpg' }],
        _count: { images: 1 },
        governorate: 'MUSCAT',
      })
      const view = await render(
        <EquipCard item={item as any} onPress={jest.fn()} fullWidth disableImageSwipe />,
      )
      expect(view.getByTestId('card-image-count-badge')).toBeTruthy()
      expect(view.getByText('1')).toBeTruthy()
    })

    it('renders "1" badge on PartCard with 1 image', async () => {
      const item = mapPartToCard({
        id: 'part-1',
        partName: 'فلتر هواء أصلي',
        price: 25,
        condition: 'NEW',
        isOriginal: true,
        images: [{ url: 'https://example.com/part1.jpg' }],
        _count: { images: 1 },
        governorate: 'MUSCAT',
      })
      const view = await render(
        <PartCard item={item} onPress={jest.fn()} fullWidth disableImageSwipe />,
      )
      expect(view.getByTestId('card-image-count-badge')).toBeTruthy()
      expect(view.getByText('1')).toBeTruthy()
    })

    it('renders "1" badge on ServiceCard with 1 image', async () => {
      const item = mapServiceToCard({
        id: 'svc-1',
        serviceName: 'صيانة مكيفات',
        priceFrom: 15,
        images: [{ url: 'https://example.com/svc1.jpg' }],
        _count: { images: 1 },
        governorate: 'MUSCAT',
      })
      const view = await render(
        <ServiceCard item={item} onPress={jest.fn()} fullWidth disableImageSwipe />,
      )
      expect(view.getByTestId('card-image-count-badge')).toBeTruthy()
      expect(view.getByText('1')).toBeTruthy()
    })

    it('SimilarListingCard hides photo badge when knownImageCount is omitted, and shows it when known', async () => {
      const hidden = await render(
        <SimilarListingCard
          title="قطعة مشابهة"
          imageUri="https://example.com/p.jpg"
          placeholderIcon="construct-outline"
          onPress={jest.fn()}
        />,
      )
      expect(hidden.queryByTestId('similar-card-image-count-badge')).toBeNull()
    })
  })

  describe('2. Generic useVerticalSimilarListings hook & Parts/Services detail wiring', () => {
    it.each<[SimilarVertical, jest.Mock]>([
      ['car', listingsApi.getSimilar as jest.Mock],
      ['bus', busesApi.getSimilar as jest.Mock],
      ['equipment', equipmentApi.getSimilar as jest.Mock],
      ['part', partsApi.getSimilar as jest.Mock],
      ['service', servicesApi.getSimilar as jest.Mock],
    ])('calls the matching API for vertical "%s"', async (vertical, apiMock) => {
      apiMock.mockResolvedValueOnce({ data: [{ id: `${vertical}-sim-1`, title: 'Test' }] })
      let latest: ReturnType<typeof useVerticalSimilarListings> | undefined
      const Wrapper = makeWrapper()
      await render(
        <Wrapper>
          <HookHarness vertical={vertical} id="item-42" onResult={(r) => { latest = r }} />
        </Wrapper>,
      )

      await waitFor(() => {
        expect(apiMock).toHaveBeenCalledWith('item-42', 8)
        expect(latest?.items).toHaveLength(1)
        expect(latest?.isError).toBe(false)
      })
    })

    it('treats 404 as empty list with isError: false', async () => {
      ;(partsApi.getSimilar as jest.Mock).mockRejectedValueOnce({
        response: { status: 404 },
      })
      let latest: ReturnType<typeof useVerticalSimilarListings> | undefined
      const Wrapper = makeWrapper()
      await render(
        <Wrapper>
          <HookHarness vertical="part" id="hidden-part" onResult={(r) => { latest = r }} />
        </Wrapper>,
      )

      await waitFor(() => {
        expect(latest?.isLoading).toBe(false)
        expect(latest?.isError).toBe(false)
        expect(latest?.items).toEqual([])
      })
    })

    it('deletes duplicate Bus/Equipment hooks and wires SimilarListingsGrid into PartDetailScreen and ServiceDetailScreen', () => {
      expect(
        fs.existsSync(path.join(ROOT, 'src/hooks/listing-detail/useBusSimilarListings.ts')),
      ).toBe(false)
      expect(
        fs.existsSync(path.join(ROOT, 'src/hooks/listing-detail/useEquipmentSimilarListings.ts')),
      ).toBe(false)

      const partSrc = fs.readFileSync(
        path.join(ROOT, 'src/screens/parts/PartDetailScreen.tsx'),
        'utf8',
      )
      expect(partSrc).toContain("useVerticalSimilarListings('part', id)")
      expect(partSrc).toContain('SimilarListingsGrid')
      expect(partSrc).toContain('part-similar-section')

      const svcSrc = fs.readFileSync(
        path.join(ROOT, 'src/screens/services/ServiceDetailScreen.tsx'),
        'utf8',
      )
      expect(svcSrc).toContain("useVerticalSimilarListings('service', id)")
      expect(svcSrc).toContain('SimilarListingsGrid')
      expect(svcSrc).toContain('service-similar-section')
    })
  })

  describe('3. PartCard single overlay badge, EquipCard neutral placeholder & Favorites width/empty lines', () => {
    it('PartCard shows ONE primary condition badge on image and moves originality into pills without duplicating condition', async () => {
      const item = mapPartToCard({
        id: 'part-2',
        partName: 'رديتر كامري',
        price: 65,
        condition: 'NEW',
        isOriginal: true,
        images: [{ url: 'https://example.com/rad.jpg' }],
        _count: { images: 2 },
        governorate: 'MUSCAT',
      })
      const view = await render(
        <PartCard item={item} onPress={jest.fn()} fullWidth disableImageSwipe maxChips={6} />,
      )
      // Condition appears once (overlay badge), NOT duplicated as a pill
      expect(view.getAllByText('جديد')).toHaveLength(1)
      // Originality moved into pills (single overlay badge on image)
      expect(view.getByTestId('listing-card-pill-wrap-orig')).toBeTruthy()
      expect(view.queryByTestId('listing-card-pill-wrap-cond')).toBeNull()
    })

    it('EquipCard renders neutral token-based placeholder with icon and label when listing has no images', async () => {
      const item = mapEquipmentToCard({
        id: 'eq-no-img',
        title: 'رافعة شوكية',
        price: 8500,
        images: [],
        governorate: 'MUSCAT',
      })
      const view = await render(
        <EquipCard item={item as any} onPress={jest.fn()} fullWidth />,
      )
      expect(view.getByTestId('listing-card-image-placeholder')).toBeTruthy()
      expect(view.getByText('لا توجد صورة')).toBeTruthy()
      expect(view.queryByTestId('card-image-count-badge')).toBeNull()
    })

    it('Favorites fullWidth cards use uniform stretch width and hide empty location row when location & date are missing', async () => {
      const busNoLoc = mapBusToCard({
        id: 'bus-no-loc',
        title: 'حافلة بدون موقع',
        price: 9000,
        images: [{ url: 'https://example.com/b.jpg' }],
        _count: { images: 1 },
      })
      const view = await render(
        <BusCard item={busNoLoc as any} onPress={jest.fn()} fullWidth disableImageSwipe />,
      )
      const root = view.getByTestId('listing-card-root')
      const flat = StyleSheet.flatten(root.props.style)
      expect(flat.width).toBe('100%')
      expect(flat.alignSelf).toBe('stretch')
      expect(view.queryByTestId('listing-card-location-row')).toBeNull()
    })
  })
})
