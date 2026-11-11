import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { SkeletonCard } from '../../components/ui/SkeletonCard'
import { StaleDataBanner } from '../../components/listing-detail/StaleDataBanner'
import { useSearchLogic } from '../../hooks/useSearchLogic'
import { getListErrorProps } from '../../utils/getListErrorProps'
import { SearchHeaderBar } from './components/SearchHeaderBar'
import { SearchCategoryTabs } from './components/SearchCategoryTabs'
import { SearchActiveFiltersBar } from './components/SearchActiveFiltersBar'
import { SearchInitialState } from './components/SearchInitialState'
import { SearchAutocompleteList } from './components/SearchAutocompleteList'
import { SearchCardDispatcher } from './components/SearchCardDispatcher'
import { SearchEmptyState } from './components/SearchEmptyState'
import { SortBy } from '../../api/search'

const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'price:asc', label: 'الأقل سعراً' },
  { id: 'price:desc', label: 'الأعلى سعراً' },
]

export function SearchScreen() {
  const {
    query,
    setQuery,
    category,
    setCategory,
    sortBy,
    setSortBy,
    minPrice,
    maxPrice,
    condition,
    governorateId,
    activeFiltersCount,
    hasActiveCriteria,
    autocompleteSuggestions,
    isAutocompleteError,
    autocompleteError,
    refetchAutocomplete,
    isRefetchingAutocomplete,
    results,
    totalResultsCount,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchHistory,
    removeSearch,
    clearHistory,
    submitSearch,
    clearQuery,
    clearAllFilters,
    removeSingleFilter,
  } = useSearchLogic()

  const [sortModalVisible, setSortModalVisible] = useState(false)
  const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'الأحدث أولاً'

  const handleOpenFilters = () => {
    router.push({
      pathname: '/(modals)/filters',
      params: {
        category,
        q: query,
        minPrice: minPrice !== undefined ? String(minPrice) : '',
        maxPrice: maxPrice !== undefined ? String(maxPrice) : '',
        condition: condition || 'ALL',
        governorateId: governorateId !== undefined ? String(governorateId) : '',
      },
    } as any)
  }

  const handleSelectAutocomplete = (term: string) => {
    setQuery(term)
    submitSearch(term)
  }

  const renderResultsHeader = () => {
    return (
      <View style={s.resultsHeader}>
        <Text style={s.resultsCountText}>
          تم العثور على {totalResultsCount} نتيجة
        </Text>
        <TouchableOpacity
          style={s.sortBtn}
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={14} color={Colors.primary} />
          <Text style={s.sortBtnText}>{currentSortLabel}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderContent = () => {
    // 1. Initial Discovery State (No query or filters)
    if (!hasActiveCriteria) {
      return (
        <SearchInitialState
          searchHistory={searchHistory}
          onSelectTerm={(term) => {
            setQuery(term)
            submitSearch(term)
          }}
          onRemoveHistoryItem={removeSearch}
          onClearHistory={clearHistory}
          onSelectCategory={(cat) => setCategory(cat)}
        />
      )
    }

    // 2. Loading State
    if (isLoading && results.length === 0) {
      return (
        <View style={s.loadingContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.skeletonWrapper}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      )
    }

    // 3. Error State (no cached results)
    if (isError && results.length === 0) {
      const errorProps = getListErrorProps(error, 'حدث خطأ أثناء تحميل نتائج البحث')
      return (
        <View style={s.errorContainer} testID="search-results-error">
          <Ionicons
            name={errorProps.icon as keyof typeof Ionicons.glyphMap}
            size={40}
            color={errorProps.iconColor}
          />
          <Text style={s.errorTitle}>{errorProps.title}</Text>
          <Text style={s.errorSubtitle}>{errorProps.subtitle}</Text>
          <TouchableOpacity
            testID="search-results-retry-btn"
            style={s.retryBtn}
            onPress={() => refetch()}
            disabled={isRefetching}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={errorProps.actionLabel}
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={s.retryBtnText}>{errorProps.actionLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      )
    }

    // 4. Empty Results State
    if (results.length === 0) {
      return <SearchEmptyState onClearFilters={clearAllFilters} />
    }

    // 5. Results List (preserves stale results + StaleDataBanner on refetch error)
    return (
      <>
        {isError ? (
          <View style={s.staleWrap} testID="search-results-stale">
            <StaleDataBanner onRetry={() => refetch()} isRefetching={isRefetching} />
          </View>
        ) : null}
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id || item._id || index}`}
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <SearchCardDispatcher item={item} />
            </View>
          )}
          ListHeaderComponent={renderResultsHeader}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.5}
          windowSize={5}
          maxToRenderPerBatch={6}
          removeClippedSubviews={true}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={s.footerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      </>
    )
  }

  return (
    <View style={s.root}>
      {/* ── Search Bar Header ── */}
      <SearchHeaderBar
        query={query}
        onChangeText={setQuery}
        onSubmit={() => submitSearch()}
        onClear={clearQuery}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={handleOpenFilters}
      />

      {/* ── Category Entity Tabs ── */}
      <SearchCategoryTabs
        selectedCategory={category}
        onSelectCategory={setCategory}
      />

      {/* ── Active Filters Badges Bar ── */}
      <SearchActiveFiltersBar
        minPrice={minPrice}
        maxPrice={maxPrice}
        condition={condition}
        governorateId={governorateId}
        onRemoveFilter={removeSingleFilter}
        onClearAll={clearAllFilters}
      />

      {/* ── Main Dynamic Content ── */}
      <View style={s.mainBody}>
        {renderContent()}

        {/* ── Autocomplete Suggestions Dropdown (Floats over content) ── */}
        {query.trim().length >= 2 && (autocompleteSuggestions.length > 0 || isAutocompleteError) && (
          <View style={s.autocompleteOverlay}>
            <SearchAutocompleteList
              suggestions={autocompleteSuggestions}
              onSelectSuggestion={handleSelectAutocomplete}
              isError={isAutocompleteError}
              error={autocompleteError}
              onRetry={refetchAutocomplete}
              isRetrying={isRefetchingAutocomplete}
            />
          </View>
        )}
      </View>

      {/* ── Sort Selection Modal ── */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setSortModalVisible(false)}>
          <View style={s.sortModalContent}>
            <Text style={s.sortModalTitle}>ترتيب نتائج البحث</Text>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortBy === opt.id
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.sortOptionRow, isSelected && s.sortOptionSelected]}
                  onPress={() => {
                    setSortBy(opt.id)
                    setSortModalVisible(false)
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.sortOptionText, isSelected && s.sortOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainBody: {
    flex: 1,
    position: 'relative',
  },
  autocompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 6,
  },
  resultsCountText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6F7F9',
    borderWidth: 1,
    borderColor: '#B3E7EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  sortBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: 110,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: Spacing.space4,
  },
  loadingContainer: {
    padding: Spacing.space4,
    gap: Spacing.space4,
  },
  skeletonWrapper: {
    width: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space6,
    marginTop: 60,
    gap: 10,
  },
  errorTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  retryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.white,
  },
  staleWrap: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 20,
    gap: 12,
  },
  sortModalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortOptionSelected: {
    backgroundColor: '#E6F7F9',
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  sortOptionTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
})
