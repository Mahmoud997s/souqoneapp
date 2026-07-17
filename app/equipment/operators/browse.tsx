import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { AppHeader } from '../../../src/components/ui/AppHeader'
import { OperatorCard } from '../../../src/components/cards/OperatorCard'
import { useOperatorsInfinite } from '../../../src/hooks/useEquipment'
import { SkeletonCard } from '../../../src/components/ui/SkeletonCard'
import { EquipmentFilterBottomSheet } from '../../../src/components/filters/EquipmentFilterBottomSheet'

const MOCK_OPERATORS = [
  {
    id: 'op1',
    title: 'مشغل بلدوزر وجرافة',
    price: 30, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'الباطنة شمال',
    isVerified: true,
    raw: { operatorType: 'مشغل', experienceYears: 15, equipmentTypes: ['بلدوزر', 'جرافة'] }
  },
  {
    id: 'op2',
    title: 'فني صيانة مولدات كهربائية',
    price: 20, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'الداخلية',
    raw: { operatorType: 'صيانة', experienceYears: 6, equipmentTypes: ['مولدات', 'كهرباء صناعية'] }
  },
  {
    id: 'op3',
    title: 'فني صيانة معدات هيدروليك',
    price: 8, priceLabel: 'ساعة', currency: 'ر.ع.',
    governorate: 'مسقط',
    raw: { operatorType: 'فني', experienceYears: 12, equipmentTypes: ['هيدروليك', 'محركات ديزل'] }
  },
  {
    id: 'op4',
    title: 'مشغل رافعة برجية معتمد',
    price: 35, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'ظفار',
    raw: { operatorType: 'مشغل', experienceYears: 8, equipmentTypes: ['رافعات برجية', 'رافعات متحركة'] }
  },
]

export default function BrowseOperatorsScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [filters, setFilters] = useState<any>({})

  const queryParams = useMemo(() => {
    return {
      ...params,
      ...filters,
      search: searchQuery || undefined
    }
  }, [params, filters, searchQuery])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useOperatorsInfinite(queryParams)

  let items = data?.pages.flatMap(p => p.items) || []
  if (items.length === 0 && !searchQuery) {
    items = MOCK_OPERATORS as any
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== '') count++
    })
    return count
  }, [filters])

  const handleClearAll = () => {
    setSearchQuery('')
    setFilters({})
  }

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.fullCard}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      )
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapError}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          </View>
          <Text style={styles.emptyTitle}>حدث خطأ!</Text>
          <Text style={styles.emptySub}>تعذر جلب البيانات، يرجى المحاولة لاحقاً.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="people-outline" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>لا يوجد مشغلين مطابقين</Text>
        <Text style={styles.emptySub}>لم نعثر على أي مشغلين يتطابقون مع بحثك الحالي.</Text>
        {(searchQuery.length > 0 || activeFiltersCount > 0) && (
          <TouchableOpacity style={styles.clearAllBtnInline} onPress={handleClearAll}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.clearAllBtnInlineTxt}>مسح الفلاتر</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        showBack
        centerSlot={
          <View style={styles.compactSearch}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={styles.compactInput}
              placeholder="ابحث عن مشغل..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        }
        rightSlot={
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color={Colors.white} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeTxt}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <OperatorCard item={item as any} onPress={() => router.push(`/equipment/operators/${item.id}` as any)} />
          </View>
        )}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isLoading && items.length > 0} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          !isLoading && !isError && items.length > 0 ? (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {`${items.length} مشغل متوفر`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 16 }} /> : null
        }
      />

      {/* Filter Bottom Sheet */}
      <EquipmentFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={(f) => setFilters(f)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'
  },
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent || '#e67e22', alignItems: 'center', justifyContent: 'center'
  },
  filterBadgeTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 10,
    color: Colors.white,
  },
  compactSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.15)', height: 40, borderRadius: 20,
    paddingHorizontal: Spacing.space3, marginHorizontal: Spacing.space3
  },
  compactInput: {
    flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.white, textAlign: 'right'
  },
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  cardWrapper: {
    // Empty
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16, color: '#0f172a',
  },
  skeletonGrid: {
    gap: 16,
  },
  fullCard: { width: '100%' },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconWrapError: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 20, color: '#0f172a',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearAllBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12,
  },
  clearAllBtnInlineTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
})
