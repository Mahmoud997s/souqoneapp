import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { UnifiedCard } from '../../src/components/cards/UnifiedCard'
import { CarCard } from '../../src/components/cars/CarCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useFavorites } from '../../src/hooks/useListings'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '../../src/api/favorites'

const CATEGORY_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'cars', label: 'سيارات' },
  { id: 'jobs', label: 'وظائف' },
  { id: 'services', label: 'خدمات' },
  { id: 'parts', label: 'قطع غيار' },
  { id: 'buses', label: 'حافلات' },
  { id: 'equipment', label: 'معدات' },
]

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const [activeTab, setActiveTab] = useState((params.tab as string) || 'all')
  const { data, isLoading } = useFavorites()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const handleFavorite = async (item: any) => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    try {
      const entityMap: Record<string, string> = {
        'cars': 'LISTING',
        'jobs': 'JOB',
        'services': 'CAR_SERVICE',
        'parts': 'SPARE_PART',
        'buses': 'BUS_LISTING',
        'equipment': 'EQUIPMENT_LISTING',
      }
      const eType = entityMap[item.category || 'cars'] || 'LISTING'
      await favoritesApi.add(eType, item.id) // acts as toggle
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (e) {
      console.log('Error toggling favorite', e)
    }
  }

  const filteredData = data?.filter(item => {
    if (activeTab === 'all') return true
    return item.category === activeTab
  }) ?? []

  return (
    <View style={s.root}>
      <AppHeader title="المفضلة" showBack />
      
      <View style={{ paddingTop: Spacing.space3 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {CATEGORY_FILTERS.map(f => (
            <TouchableOpacity 
              key={f.id} 
              style={[s.tab, activeTab === f.id && s.tabActive]}
              onPress={() => setActiveTab(f.id)}
              activeOpacity={0.7}
            >
            <Text style={[s.tabTxt, activeTab === f.id && s.tabTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {isLoading ? (
        <View style={s.list}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom || 20 }]}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="heart-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد مفضلة</Text>
              <Text style={s.emptySub}>لم تقم بإضافة أي إعلانات إلى قائمتك المفضلة حتى الآن.</Text>
              
              <TouchableOpacity 
                style={s.emptyBtn} 
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/search' as any)}
              >
                <Ionicons name="search" size={18} color={Colors.white} />
                <Text style={s.emptyBtnTxt}>تصفح الإعلانات</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            if (item.category === 'cars') {
              return (
                <CarCard
                  item={item as any}
                  fullWidth
                  showChips
                  onPress={() => router.push(`/listings/${item.id}` as any)}
                />
              )
            }
            return (
              <UnifiedCard 
                item={item} 
                onPress={() => router.push(`/${item.category}/${item.id}` as any)} 
                onFavorite={() => handleFavorite(item)}
              />
            )
          }}
        />
      )}
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  tabsRow: {
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space3,
    gap: Spacing.space2,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text2 },
  tabTxtActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.space4, gap: Spacing.space4 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text2, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.pill, gap: 8 },
  emptyBtnTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.white },
})
