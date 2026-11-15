export type FavoritesTabId = 'all' | 'cars' | 'services' | 'parts' | 'buses' | 'equipment'

export interface FavoritesCategoryFilter {
  id: FavoritesTabId
  label: string
}

export const FAVORITES_CATEGORY_FILTERS: readonly FavoritesCategoryFilter[] = [
  { id: 'all', label: 'الكل' },
  { id: 'cars', label: 'سيارات' },
  { id: 'services', label: 'خدمات' },
  { id: 'parts', label: 'قطع غيار' },
  { id: 'buses', label: 'حافلات' },
  { id: 'equipment', label: 'معدات' },
] as const

const TAB_ALIAS_MAP: Record<string, FavoritesTabId> = {
  all: 'all',
  الكل: 'all',
  cars: 'cars',
  سيارات: 'cars',
  services: 'services',
  خدمات: 'services',
  parts: 'parts',
  'قطع غيار': 'parts',
  buses: 'buses',
  حافلات: 'buses',
  equipment: 'equipment',
  معدات: 'equipment',
}

/**
 * Normalizes a route `?tab=` param (canonical ID or legacy Arabic label) into a safe FavoritesTabId.
 */
export function normalizeFavoritesTabParam(rawTab?: string | string[] | null): FavoritesTabId {
  const candidate = Array.isArray(rawTab) ? rawTab[0] : rawTab
  if (typeof candidate !== 'string') return 'all'
  const trimmed = candidate.trim()
  if (!trimmed) return 'all'
  return TAB_ALIAS_MAP[trimmed] ?? 'all'
}

/**
 * Builds a canonical `/profile/favorites` route using normalized tab IDs.
 */
export function buildFavoritesRoute(tab?: string | null): string {
  const normalized = normalizeFavoritesTabParam(tab)
  if (normalized === 'all') return '/profile/favorites'
  return `/profile/favorites?tab=${encodeURIComponent(normalized)}`
}

/**
 * Matches a favorited card's category against the active Favorites tab filter.
 * Operators appear in both 'all' and 'equipment' tabs without adding a separate tab.
 */
export function matchesFavoritesCategoryFilter(
  category: string | undefined,
  activeTab: FavoritesTabId
): boolean {
  if (category === 'jobs' || category === 'transport') return false
  if (activeTab === 'all') return true
  if (activeTab === 'equipment') {
    return category === 'equipment' || category === 'operators'
  }
  return category === activeTab
}
