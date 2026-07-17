import React, { useRef, useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { CarCard } from '../../src/components/cars/CarCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Ionicons } from '@expo/vector-icons'
import { useBuses } from '../../src/hooks/useBuses'
import { router, useLocalSearchParams } from 'expo-router'
import { BusFilterBottomSheet, BusFilters } from '../../src/components/filters/BusFilterBottomSheet'
import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES } from '../post/_constants/bus'

export default function BusesBrowseScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>()
  
  // Initialize filter state from route params (e.g., ?type=sale)
  const initialFilterState: BusFilters = {}
  if (type) {
    initialFilterState.busListingType = type.toUpperCase()
  }

  const [filters, setFilters] = useState<BusFilters>(initialFilterState)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  
  const { data, isLoading, isError, refetch } = useBuses(filters as any)

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  // Generate dynamic display chips based on active filters
  const displayChips = useMemo(() => {
    const chips: string[] = []
    if (filters.busListingType) {
      chips.push(BUS_LISTING_TYPES.find(x => x.id === filters.busListingType)?.label || filters.busListingType)
    }
    if (filters.busType) {
      chips.push(BUS_TYPES.find(x => x.id === filters.busType)?.label || filters.busType)
    }
    if (filters.make) {
      chips.push(BUS_MAKES.find(x => x.id === filters.make)?.label || filters.make)
    }
    if (filters.capacityMin) {
      chips.push(`+ ${filters.capacityMin} مقعد`)
    }
    return chips
  }, [filters])

  return (
    <View style={s.root}>
      <AppHeader title="تصفح الحافلات" showBack />

      {isLoading ? (
        <View style={s.grid}>
          {[1, 2, 3, 4].map(i => <View key={i} style={s.fullCard}><SkeletonCard /></View>)}
        </View>
      ) : isError ? (
        <View style={s.center}>
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل البيانات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
          ListHeaderComponent={
            <View style={s.headerWrap}>
              <View style={s.filterHeaderRow}>
                <TouchableOpacity style={s.filterMainBtn} onPress={() => setIsFilterVisible(true)}>
                  <Ionicons name="options" size={20} color={Colors.primary} />
                  <Text style={s.filterMainTxt}>تصفية</Text>
                  {activeFiltersCount > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>{activeFiltersCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.activeChipsScroll}>
                  {displayChips.length === 0 ? (
                    <Text style={s.noFiltersTxt}>لا توجد فلاتر نشطة</Text>
                  ) : (
                    displayChips.map((chip, i) => (
                      <View key={i} style={s.activeChip}>
                        <Text style={s.activeChipTxt}>{chip}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
              <Text style={s.resultsCount}>{(data ?? []).length} نتيجة</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="bus-outline" size={56} color={Colors.border} />
              <Text style={s.emptyTitle}>لا توجد حافلات مطابقة</Text>
              <Text style={s.emptySubtitle}>جرب تغيير خيارات التصفية للعثور على المزيد</Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity style={s.clearBtn} onPress={() => setFilters({})}>
                  <Text style={s.clearBtnTxt}>مسح الفلاتر</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.fullCard}>
              <CarCard item={item as any} fullWidth onPress={() => router.push(`/buses/${item.id}` as any)} />
            </View>
          )}
        />
      )}

      <BusFilterBottomSheet 
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.lg },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.white },
  grid: { padding: Spacing.space4, gap: Spacing.space4 },
  list: { paddingBottom: Spacing.space6 },
  fullCard: { paddingHorizontal: Spacing.space5, paddingBottom: Spacing.space3 },
  headerWrap: { paddingBottom: Spacing.space3, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 },
  
  filterHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.space5, paddingVertical: 12 },
  filterMainBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill },
  filterMainTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.primary },
  badge: { backgroundColor: Colors.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#fff', fontSize: 10, fontFamily: 'Almarai_700Bold',  },
  
  activeChipsScroll: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  activeChip: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border },
  activeChipTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.text },
  noFiltersTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted },
  
  resultsCount: { fontFamily: 'Almarai_700Bold',  paddingTop: 4, fontSize: 18, color: Colors.text, paddingHorizontal: Spacing.space5, paddingBottom: 12, textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.space3 },
  emptyTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  clearBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.border },
  clearBtnTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.text }
})
