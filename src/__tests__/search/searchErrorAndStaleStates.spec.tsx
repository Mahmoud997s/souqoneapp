import React from 'react'
import { render, fireEvent, waitFor, act, renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useSearchLogic } from '../../hooks/useSearchLogic'
import { SearchAutocompleteList } from '../../screens/search/components/SearchAutocompleteList'
import { SearchScreen } from '../../screens/search/SearchScreen'
import { searchApi } from '../../api/search'

jest.setTimeout(30000)

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), setParams: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}))

jest.mock('../../api/search', () => ({
  searchApi: {
    search: jest.fn(),
    autocomplete: jest.fn(),
  },
}))

jest.mock('../../hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    history: [],
    addSearch: jest.fn(),
    removeSearch: jest.fn(),
    clearHistory: jest.fn(),
  }),
}))

jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: (val: any) => val,
}))

jest.mock('../../screens/search/components/SearchHeaderBar', () => ({
  SearchHeaderBar: ({ query, onChangeText }: any) => {
    const { TextInput } = require('react-native')
    return (
      <TextInput
        testID="mock-search-input"
        value={query}
        onChangeText={onChangeText}
      />
    )
  },
}))

jest.mock('../../screens/search/components/SearchCategoryTabs', () => ({
  SearchCategoryTabs: () => null,
}))

jest.mock('../../screens/search/components/SearchActiveFiltersBar', () => ({
  SearchActiveFiltersBar: () => null,
}))

jest.mock('../../screens/search/components/SearchInitialState', () => ({
  SearchInitialState: () => {
    const { View } = require('react-native')
    return <View testID="search-initial-state" />
  },
}))

jest.mock('../../screens/search/components/SearchEmptyState', () => ({
  SearchEmptyState: () => {
    const { View } = require('react-native')
    return <View testID="search-empty-state" />
  },
}))

jest.mock('../../screens/search/components/SearchCardDispatcher', () => ({
  SearchCardDispatcher: ({ item }: any) => {
    const { Text } = require('react-native')
    return <Text testID={`search-result-card-${item.id}`}>{item.title}</Text>
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Search Error, Autocomplete & Stale Data States (R6)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useSearchLogic error propagation & parseListEnvelope', () => {
    it('does NOT swallow autocomplete errors and supports refetchAutocomplete', async () => {
      const networkErr = new AxiosError('Network Error', 'ERR_NETWORK')
      ;(searchApi.autocomplete as jest.Mock)
        .mockRejectedValueOnce(networkErr)
        .mockResolvedValueOnce({ data: ['تويوتا كامري', { title: 'تويوتا كورولا' }] })
      ;(searchApi.search as jest.Mock).mockResolvedValue({ data: { items: [], meta: { total: 0, totalPages: 1 } } })

      const { result } = await renderHook(() => useSearchLogic(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.setQuery('تويو')
      })

      await waitFor(() => {
        expect(result.current.isAutocompleteError).toBe(true)
      })
      expect(result.current.autocompleteError).toBe(networkErr)
      expect(result.current.autocompleteSuggestions).toEqual([])

      await act(async () => {
        await result.current.refetchAutocomplete()
      })

      await waitFor(() => {
        expect(result.current.isAutocompleteError).toBe(false)
      })
      expect(result.current.autocompleteSuggestions).toEqual(['تويوتا كامري', 'تويوتا كورولا'])
    })

    it('parses { items, meta }, legacy { data }, plain array, and rejects malformed objects via parseListEnvelope', async () => {
      ;(searchApi.autocomplete as jest.Mock).mockResolvedValue({ data: [] })
      ;(searchApi.search as jest.Mock).mockResolvedValueOnce({
        data: {
          items: [{ id: 's-1', title: 'كامري 2024' }],
          meta: { total: 42, page: 1, limit: 20, totalPages: 3 },
        },
      })

      const { result } = await renderHook(() => useSearchLogic(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.setQuery('كامري')
      })

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1)
      })
      expect(result.current.totalResultsCount).toBe(42)

      // Legacy { data: [...] }
      ;(searchApi.search as jest.Mock).mockResolvedValueOnce({
        data: { data: [{ id: 's-2', title: 'لكزس 2022' }], total: 15, totalPages: 1 },
      })
      await act(async () => {
        result.current.setQuery('لكزس')
      })
      await waitFor(() => {
        expect(result.current.results).toHaveLength(1)
        expect(result.current.results[0].id).toBe('s-2')
      })
      expect(result.current.totalResultsCount).toBe(15)

      // Plain array [...]
      ;(searchApi.search as jest.Mock).mockResolvedValueOnce({
        data: [{ id: 's-3', title: 'نيسان باترول' }],
      })
      await act(async () => {
        result.current.setQuery('نيسان')
      })
      await waitFor(() => {
        expect(result.current.results).toHaveLength(1)
        expect(result.current.results[0].id).toBe('s-3')
      })

      // Malformed envelope {} must trigger ListContractError -> isError = true
      ;(searchApi.search as jest.Mock).mockResolvedValueOnce({
        data: { unexpectedField: true },
      })
      await act(async () => {
        result.current.setQuery('مرسيدس')
      })
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('SearchAutocompleteList error UI', () => {
    it('renders structured error message with Retry button when isError and suggestions empty', async () => {
      const onRetry = jest.fn()
      const timeoutErr = new AxiosError('timeout', 'ECONNABORTED')

      const { getByTestId, getByText } = await render(
        <SearchAutocompleteList
          suggestions={[]}
          onSelectSuggestion={jest.fn()}
          isError={true}
          error={timeoutErr}
          onRetry={onRetry}
        />
      )

      expect(getByTestId('search-autocomplete-error')).toBeTruthy()
      expect(getByText('انتهت مهلة الاتصال')).toBeTruthy()

      fireEvent.press(getByTestId('search-autocomplete-retry-btn'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('returns null when suggestions are empty and isError is false', async () => {
      const { queryByTestId } = await render(
        <SearchAutocompleteList
          suggestions={[]}
          onSelectSuggestion={jest.fn()}
          isError={false}
        />
      )

      expect(queryByTestId('search-autocomplete-error')).toBeNull()
    })
  })

  describe('SearchScreen integration (full error, autocomplete error, and stale results banner)', () => {
    it('shows getListErrorProps error card when search fails with no cached results and retries on press', async () => {
      const offlineErr = new AxiosError('Network Error', 'ERR_NETWORK')
      ;(searchApi.autocomplete as jest.Mock).mockResolvedValue({ data: [] })
      ;(searchApi.search as jest.Mock)
        .mockRejectedValueOnce(offlineErr)
        .mockResolvedValueOnce({
          data: {
            items: [{ id: 'car-ok-1', title: 'برادو 2021 نظيف' }],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        })

      const Wrapper = createWrapper()
      const { getByTestId, getByText } = await render(
        <Wrapper>
          <SearchScreen />
        </Wrapper>
      )

      fireEvent.changeText(getByTestId('mock-search-input'), 'برادو')

      await waitFor(() => {
        expect(getByTestId('search-results-error')).toBeTruthy()
      })
      expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()

      fireEvent.press(getByTestId('search-results-retry-btn'))

      await waitFor(() => {
        expect(getByTestId('search-result-card-car-ok-1')).toBeTruthy()
      })
    })

    it('shows autocomplete error overlay when query >= 2 and autocomplete fails', async () => {
      const serverErr = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 500,
      } as any)
      ;(searchApi.autocomplete as jest.Mock)
        .mockRejectedValueOnce(serverErr)
        .mockResolvedValueOnce({ data: ['لاندكروزر 2024'] })
      ;(searchApi.search as jest.Mock).mockResolvedValue({
        data: { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } },
      })

      const Wrapper = createWrapper()
      const { getByTestId, getByText } = await render(
        <Wrapper>
          <SearchScreen />
        </Wrapper>
      )

      fireEvent.changeText(getByTestId('mock-search-input'), 'لان')

      await waitFor(() => {
        expect(getByTestId('search-autocomplete-error')).toBeTruthy()
      })
      expect(getByText('خطأ في الخادم')).toBeTruthy()

      fireEvent.press(getByTestId('search-autocomplete-retry-btn'))

      await waitFor(() => {
        expect(getByText('لاندكروزر 2024')).toBeTruthy()
      })
    })

    it('keeps stale search results visible with StaleDataBanner when manual refetch fails', async () => {
      ;(searchApi.autocomplete as jest.Mock).mockResolvedValue({ data: [] })
      ;(searchApi.search as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            items: [{ id: 'stale-1', title: 'شفروليه تاهو 2020' }],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        })
        .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))

      // Keep loaded results mounted while forcing refetch error
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 60_000,
          },
        },
      })

      const { getByTestId, getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <SearchScreen />
        </QueryClientProvider>
      )

      fireEvent.changeText(getByTestId('mock-search-input'), 'تاهو')

      await waitFor(() => {
        expect(getByTestId('search-result-card-stale-1')).toBeTruthy()
      })

      // Trigger refetch that rejects -> should preserve cached result AND render StaleDataBanner
      await act(async () => {
        await queryClient.refetchQueries({ queryKey: ['search-results'] })
      })

      await waitFor(() => {
        expect(getByTestId('search-results-stale')).toBeTruthy()
        expect(getByTestId('stale-data-banner')).toBeTruthy()
      })
      expect(getByText('شفروليه تاهو 2020')).toBeTruthy()
    })
  })
})
