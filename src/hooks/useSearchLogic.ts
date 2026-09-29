import { useState, useMemo, useCallback, useEffect } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, router } from 'expo-router'
import { searchApi, EntityType, SortBy, SearchParams } from '../api/search'
import { useDebounce } from './useDebounce'
import { useSearchHistory } from './useSearchHistory'

export type CategoryFilterType = 'all' | 'cars' | 'parts' | 'buses' | 'equipment' | 'jobs' | 'services'

export function useSearchLogic() {
  const params = useLocalSearchParams()
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory()

  // Search Query
  const [query, setQuery] = useState<string>((params.q as string) || '')
  const debouncedQuery = useDebounce(query, 350)

  // Autocomplete fast debounce
  const debouncedAutocompleteQuery = useDebounce(query, 200)

  // Category Entity Filter
  const initialCategory = ((params.category || params.entityType) as CategoryFilterType) || 'all'
  const [category, setCategory] = useState<CategoryFilterType>(initialCategory)

  // Sorting
  const [sortBy, setSortBy] = useState<SortBy>('createdAt:desc')

  // Numeric & Condition Filters from URL params or local state
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined
  const condition = params.condition as string | undefined

  // Calculate active filters count (excluding search text)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (category !== 'all') count += 1
    if (minPrice !== undefined) count += 1
    if (maxPrice !== undefined) count += 1
    if (condition && condition !== 'ALL') count += 1
    return count
  }, [category, minPrice, maxPrice, condition])

  // Whether user has entered any search or filter criteria
  const hasActiveCriteria = useMemo(() => {
    return Boolean(
      query.trim() ||
      category !== 'all' ||
      minPrice !== undefined ||
      maxPrice !== undefined ||
      (condition && condition !== 'ALL')
    )
  }, [query, category, minPrice, maxPrice, condition])

  // Autocomplete Query
  const shouldFetchAutocomplete = Boolean(query.trim().length >= 2 && query !== debouncedQuery)
  const { data: autocompleteSuggestions = [] } = useQuery<string[]>({
    queryKey: ['search-autocomplete', debouncedAutocompleteQuery],
    queryFn: async () => {
      if (!debouncedAutocompleteQuery || debouncedAutocompleteQuery.trim().length < 2) return []
      try {
        const res = await searchApi.autocomplete(debouncedAutocompleteQuery.trim(), 6)
        if (Array.isArray(res.data)) return res.data
        if (Array.isArray(res.data?.items)) return res.data.items
        if (Array.isArray(res.data?.data)) return res.data.data
        return []
      } catch {
        return []
      }
    },
    enabled: Boolean(debouncedAutocompleteQuery && debouncedAutocompleteQuery.trim().length >= 2),
    staleTime: 60 * 1000,
  })

  // Map category to API entityType
  const resolvedEntityType: EntityType | undefined = useMemo(() => {
    if (category === 'all') return undefined
    if (category === 'cars') return 'listings'
    return category as EntityType
  }, [category])

  // Main Infinite Search Query
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search-results', debouncedQuery, resolvedEntityType, minPrice, maxPrice, condition, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams: SearchParams = {
        page: pageParam,
        limit: 20,
        sortBy,
      }

      if (debouncedQuery.trim()) {
        searchParams.q = debouncedQuery.trim()
      }
      if (resolvedEntityType) {
        searchParams.entityType = resolvedEntityType
      }
      if (minPrice !== undefined) {
        searchParams.minPrice = minPrice
      }
      if (maxPrice !== undefined) {
        searchParams.maxPrice = maxPrice
      }

      const res = await searchApi.search(searchParams)
      const raw = res.data

      let items: any[] = []
      let total = 0
      let totalPages = 1

      if (Array.isArray(raw)) {
        items = raw
        total = raw.length
      } else if (raw && typeof raw === 'object') {
        items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : []
        total = typeof raw.total === 'number' ? raw.total : items.length
        totalPages = typeof raw.totalPages === 'number' ? raw.totalPages : Math.ceil(total / 20) || 1
      }

      return {
        items,
        page: pageParam,
        total,
        totalPages,
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: hasActiveCriteria,
    staleTime: 30 * 1000,
  })

  // Flattened results list
  const results = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.items)
  }, [data])

  const totalResultsCount = useMemo(() => {
    if (!data?.pages?.[0]) return 0
    return data.pages[0].total || results.length
  }, [data, results.length])

  // Handle Search Submission (Save to History)
  const submitSearch = useCallback((termToSubmit?: string) => {
    const finalTerm = (termToSubmit ?? query).trim()
    if (finalTerm) {
      addSearch(finalTerm)
      setQuery(finalTerm)
    }
  }, [query, addSearch])

  // Clear Handlers
  const clearQuery = useCallback(() => {
    setQuery('')
  }, [])

  const clearAllFilters = useCallback(() => {
    setQuery('')
    setCategory('all')
    router.replace({
      pathname: '/(tabs)/search',
      params: {},
    })
  }, [])

  const removeSingleFilter = useCallback((filterKey: 'minPrice' | 'maxPrice' | 'condition') => {
    const newParams = { ...params }
    delete newParams[filterKey]
    router.replace({
      pathname: '/(tabs)/search',
      params: newParams,
    })
  }, [params])

  return {
    query,
    setQuery,
    debouncedQuery,
    category,
    setCategory,
    sortBy,
    setSortBy,
    minPrice,
    maxPrice,
    condition,
    activeFiltersCount,
    hasActiveCriteria,
    autocompleteSuggestions,
    results,
    totalResultsCount,
    isLoading: hasActiveCriteria && isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchHistory: history,
    addSearch,
    removeSearch,
    clearHistory,
    submitSearch,
    clearQuery,
    clearAllFilters,
    removeSingleFilter,
  }
}
