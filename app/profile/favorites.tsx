import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
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
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { BlurView } from 'expo-blur'
import { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

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
  const { scrollHandler } = useScrollAwareNav()
  const params = useLocalSearchParams()
  const [activeTab, setActiveTab] = useState((params.tab as string) || 'all')
  const { data, isLoading } = useFavorites()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navBarHeight = insets.top + 52
  // We no longer need contentTopOffset to push content down for fixed headers,
  // since the filter is now IN the list. So contentTopOffset is just navBarHeight.
  const contentTopOffset = navBarHeight + 10
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
      {/* FlatList spans the full screen height (like Profile's ScrollView) so its scrolled
          content actually passes behind the fixed GlassNavBar — that's what lets the blur
          reflect real card colors instead of just showing the flat page background. */}
      {isLoading ? (
        <View style={[s.list, { paddingTop: contentTopOffset }]}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <Animated.FlatList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          data={filteredData}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, { paddingTop: contentTopOffset, paddingBottom: insets.bottom || 20 }]}
          ListHeaderComponent={
            <View style={s.segmentedWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.segmentedContainer}>
                {CATEGORY_FILTERS.map(f => {
                  const isActive = activeTab === f.id
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[s.segmentTab, isActive && s.segmentTabActive]}
                      onPress={() => setActiveTab(f.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.segmentTabText, isActive && s.segmentTabTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          }
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
      <GlassNavBar
        title="المفضلة"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
        actions={[
          { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل' },
          { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
        ]}
      />
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  segmentedWrapper: {
    marginHorizontal: Spacing.space5,
    marginBottom: 6,
    marginTop: Spacing.space2,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  segmentTabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#64748b',
  },
  segmentTabTextActive: {
    color: Colors.primary,
  },
  list: { paddingHorizontal: Spacing.space4, gap: Spacing.space4 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.pill, gap: 8 },
  emptyBtnTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.white },
})
