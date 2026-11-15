import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import { renderHook } from '@testing-library/react-native'
import FavoritesScreen, { FAVORITES_CATEGORY_FILTERS } from '../../../app/profile/favorites'
import {
  FAVORITES_CATEGORY_FILTERS as SHARED_FILTERS,
  normalizeFavoritesTabParam,
  buildFavoritesRoute,
} from '../../utils/favoritesCategoryTabs'
import {
  useCarsBottomBar,
  useServicesBottomBar,
  usePartsBottomBar,
  useEquipmentBottomBar,
  useBusesBottomBar,
} from '../../hooks/useDepartmentBottomBar'
import { FilterGlassTokens } from '../../constants/filterGlassTokens'
import { Colors } from '../../constants/colors'

let mockParams: Record<string, string | string[] | undefined> = {}
const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/cars',
  useFocusEffect: jest.fn(),
  router: {
    push: (...args: any[]) => mockPush(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
    MaterialCommunityIcons: (props: any) => React.createElement(Text, props, props.name),
  }
})

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ supported: false, mode: 'blur' }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
    isVisible: { value: 1 },
  }),
}))

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    setNavVisible: jest.fn(),
    isNavVisible: { value: 1 },
  }),
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: any) => {
    const state = { isAuthenticated: true, isLoggedIn: true, user: { id: 'u1' } }
    return typeof selector === 'function' ? selector(state) : state
  },
}))

const mockFavoritesData = [
  { id: 'car-1', category: 'cars', title: 'تويوتا كامري' },
  { id: 'srv-1', category: 'services', title: 'صيانة مكيف' },
  { id: 'prt-1', category: 'parts', title: 'فلتر زيت' },
]

jest.mock('../../hooks/useListings', () => ({
  useFavorites: () => ({
    data: mockFavoritesData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}))

jest.mock('../../hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }),
}))

jest.mock('../../screens/search/components/SearchCardDispatcher', () => ({
  SearchCardDispatcher: ({ item }: any) => {
    const React = require('react')
    const { Text } = require('react-native')
    return React.createElement(Text, { testID: `fav-card-${item.id}` }, item.title)
  },
}))

jest.mock('../../components/ui/GlassNavBar', () => ({
  GlassNavBar: () => null,
}))

describe('D-338: Favorites ?tab normalization, canonical bottom bar routes, and FilterGlassTokens.tab styling', () => {
  beforeEach(() => {
    mockParams = {}
    mockPush.mockClear()
    mockBack.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  describe('1. Shared source of truth (favoritesCategoryTabs.ts)', () => {
    it('exports identical FAVORITES_CATEGORY_FILTERS in favorites.tsx and shared utility', () => {
      expect(FAVORITES_CATEGORY_FILTERS).toEqual(SHARED_FILTERS)
      expect(SHARED_FILTERS.map((f) => f.id)).toEqual([
        'all',
        'cars',
        'services',
        'parts',
        'buses',
        'equipment',
      ])
    })

    it('normalizes canonical IDs, Arabic labels, array params, and unknown values to safe IDs', () => {
      expect(normalizeFavoritesTabParam('cars')).toBe('cars')
      expect(normalizeFavoritesTabParam('services')).toBe('services')
      expect(normalizeFavoritesTabParam('parts')).toBe('parts')
      expect(normalizeFavoritesTabParam('buses')).toBe('buses')
      expect(normalizeFavoritesTabParam('equipment')).toBe('equipment')
      expect(normalizeFavoritesTabParam('all')).toBe('all')

      expect(normalizeFavoritesTabParam('سيارات')).toBe('cars')
      expect(normalizeFavoritesTabParam('خدمات')).toBe('services')
      expect(normalizeFavoritesTabParam('قطع غيار')).toBe('parts')
      expect(normalizeFavoritesTabParam('حافلات')).toBe('buses')
      expect(normalizeFavoritesTabParam('معدات')).toBe('equipment')
      expect(normalizeFavoritesTabParam('الكل')).toBe('all')

      expect(normalizeFavoritesTabParam(['سيارات'])).toBe('cars')
      expect(normalizeFavoritesTabParam('  سيارات  ')).toBe('cars')
      expect(normalizeFavoritesTabParam(undefined)).toBe('all')
      expect(normalizeFavoritesTabParam('')).toBe('all')
      expect(normalizeFavoritesTabParam('jobs')).toBe('all')
      expect(normalizeFavoritesTabParam('unknown')).toBe('all')
    })

    it('builds canonical favorites routes via buildFavoritesRoute', () => {
      expect(buildFavoritesRoute()).toBe('/profile/favorites')
      expect(buildFavoritesRoute('all')).toBe('/profile/favorites')
      expect(buildFavoritesRoute('الكل')).toBe('/profile/favorites')
      expect(buildFavoritesRoute('cars')).toBe('/profile/favorites?tab=cars')
      expect(buildFavoritesRoute('سيارات')).toBe('/profile/favorites?tab=cars')
      expect(buildFavoritesRoute('قطع غيار')).toBe('/profile/favorites?tab=parts')
    })
  })

  describe('2. useDepartmentBottomBar canonical favorites routes', () => {
    it('uses canonical tab IDs in all 5 department bottom bar hooks', async () => {
      const cases = [
        { hook: useCarsBottomBar, expected: '/profile/favorites?tab=cars' },
        { hook: useServicesBottomBar, expected: '/profile/favorites?tab=services' },
        { hook: usePartsBottomBar, expected: '/profile/favorites?tab=parts' },
        { hook: useEquipmentBottomBar, expected: '/profile/favorites?tab=equipment' },
        { hook: useBusesBottomBar, expected: '/profile/favorites?tab=buses' },
      ]

      for (const { hook, expected } of cases) {
        mockPush.mockClear()
        const { result } = await renderHook(() => hook())
        const favTab = result.current.tabs.find((t) => t.id === 'favorites')
        expect(favTab).toBeDefined()
        result.current.handleTabPress(favTab!)
        expect(mockPush).toHaveBeenCalledWith(expected)
      }
    })
  })

  describe('3. FavoritesScreen normalization, param sync, and FilterGlassTokens.tab styling', () => {
    it('normalizes legacy Arabic ?tab=سيارات, filters to cars, and applies turquoise active styling', async () => {
      mockParams = { tab: 'سيارات' }
      const { getByTestId, queryByTestId } = await render(<FavoritesScreen />)

      expect(getByTestId('fav-card-car-1')).toBeTruthy()
      expect(queryByTestId('fav-card-srv-1')).toBeNull()
      expect(queryByTestId('fav-card-prt-1')).toBeNull()

      const carsTab = getByTestId('favorites-tab-cars')
      const carsTabStyle = StyleSheet.flatten(carsTab.props.style)
      expect(carsTabStyle.backgroundColor).toBe(FilterGlassTokens.tab.activeBg)
      expect(carsTabStyle.backgroundColor).toBe(Colors.primary)

      const carsLabel = getByTestId('favorites-tab-label-cars')
      const carsLabelStyle = StyleSheet.flatten(carsLabel.props.style)
      expect(carsLabelStyle.color).toBe(FilterGlassTokens.tab.activeTextColor)
      expect(carsLabelStyle.color).toBe(Colors.white)
      expect(carsLabelStyle.fontFamily).toBe(FilterGlassTokens.tab.activeFontFamily)

      const allTab = getByTestId('favorites-tab-all')
      const allTabStyle = StyleSheet.flatten(allTab.props.style)
      expect(allTabStyle.backgroundColor).toBe(FilterGlassTokens.tab.inactiveBg)
    })

    it('syncs activeTab when route params.tab changes and updates when user taps another tab', async () => {
      mockParams = { tab: 'cars' }
      const { rerender, getByTestId, queryByTestId } = await render(<FavoritesScreen />)
      expect(getByTestId('fav-card-car-1')).toBeTruthy()
      expect(queryByTestId('fav-card-srv-1')).toBeNull()

      mockParams = { tab: 'services' }
      await rerender(<FavoritesScreen />)
      expect(getByTestId('fav-card-srv-1')).toBeTruthy()
      expect(queryByTestId('fav-card-car-1')).toBeNull()

      await fireEvent.press(getByTestId('favorites-tab-parts'))
      expect(getByTestId('fav-card-prt-1')).toBeTruthy()
      expect(queryByTestId('fav-card-srv-1')).toBeNull()
    })
  })
})
