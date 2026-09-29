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
import { useSearchLogic } from '../../hooks/useSearchLogic'
import { SearchHeaderBar } from './components/SearchHeaderBar'
import { SearchCategoryTabs } from './components/SearchCategoryTabs'
import { SearchActiveFiltersBar } from './components/SearchActiveFiltersBar'
import { SearchInitialState } from './components/SearchInitialState'
import { SearchAutocompleteList } from './components/SearchAutocompleteList'
import { SearchCardDispatcher } from './components/SearchCardDispatcher'
import { SearchEmptyState } from './components/SearchEmptyState'
import { SortBy } from '../../api/search'

const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: 'createdAt:desc', label: 'الأحدث أولاً' },
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
    activeFiltersCount,
    hasActiveCriteria,
    autocompleteSuggestions,
    results,
    totalResultsCount,
    isLoading,
    isError,
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
        minPrice: minPrice !== undefined ? String(minPrice) : '',
        maxPrice: maxPrice !== undefined ? String(maxPrice) : '',
        condition: condition || 'ALL',
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
    if (isLoading) {
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

    // 3. Error State
    if (isError) {
      return (
        <View style={s.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={s.errorTitle}>حدث خطأ أثناء تحميل نتائج البحث</Text>
          <Text style={s.errorSubtitle}>يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={s.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )
    }

    // 4. Empty Results State
    if (results.length === 0) {
      return <SearchEmptyState onClearFilters={clearAllFilters} />
    }

    // 5. Results List
    return (
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
        onRemoveFilter={removeSingleFilter}
        onClearAll={clearAllFilters}
      />

      {/* ── Autocomplete Suggestions Dropdown ── */}
      {autocompleteSuggestions.length > 0 && query.trim().length >= 2 && (
        <SearchAutocompleteList
          suggestions={autocompleteSuggestions}
          onSelectSuggestion={handleSelectAutocomplete}
        />
      )}

      {/* ── Main Dynamic Content ── */}
      <View style={s.mainBody}>{renderContent()}</View>

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
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
    backgroundColor: '#ECFDF5',
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
