import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { useGlassSupport } from '../../src/components/navigation/glassSupport'
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { FilterGlassTokens } from '../../src/constants/filterGlassTokens'
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../src/constants/listVirtualization'
import { SearchCardDispatcher } from '../../src/screens/search/components/SearchCardDispatcher'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useFavorites } from '../../src/hooks/useListings'
import { usePullToRefresh } from '../../src/hooks/usePullToRefresh'
import { getListErrorProps } from '../../src/utils/getListErrorProps'
import {
  FAVORITES_CATEGORY_FILTERS,
  FavoritesTabId,
  normalizeFavoritesTabParam,
  matchesFavoritesCategoryFilter,
} from '../../src/utils/favoritesCategoryTabs'
import { useLocalSearchParams, router } from 'expo-router'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated'

export { FAVORITES_CATEGORY_FILTERS }
export const CATEGORY_FILTERS = FAVORITES_CATEGORY_FILTERS

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets()
  const glassSupport = useGlassSupport()
  const { scrollHandler } = useScrollAwareNav()
  const params = useLocalSearchParams<{ tab?: string | string[] }>()
  const normalizedParamTab = useMemo(() => normalizeFavoritesTabParam(params.tab), [params.tab])
  const [activeTab, setActiveTab] = useState<FavoritesTabId>(normalizedParamTab)

  useEffect(() => {
    setActiveTab(normalizedParamTab)
  }, [normalizedParamTab])
  const { data, isLoading, isError, error, refetch } = useFavorites()
  const { refreshing, onRefresh } = usePullToRefresh(refetch)
  const navBarHeight = insets.top + 52
  // We no longer need contentTopOffset to push content down for fixed headers,
  // since the filter is now IN the list. So contentTopOffset is just navBarHeight.
  const contentTopOffset = navBarHeight + 10

  const filteredData = useMemo(
    () => data?.filter(item => matchesFavoritesCategoryFilter(item.category, activeTab)) ?? [],
    [data, activeTab]
  )

  const keyExtractor = useCallback((i: (typeof filteredData)[number]) => i.id, [])
  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredData)[number] }) => (
      <SearchCardDispatcher item={item} glassSupport={glassSupport} />
    ),
    [glassSupport]
  )

  const hasData = Boolean(data && data.length > 0)
  const isInitialLoading = isLoading && !data
  const isInitialError = isError && !hasData
  const errorProps = isInitialError ? getListErrorProps(error, 'تعذر تحميل المفضلة') : null

  return (
    <View style={s.root}>
      {/* FlatList spans the full screen height (like Profile's ScrollView) so its scrolled
          content actually passes behind the fixed GlassNavBar — that's what lets the blur
          reflect real card colors instead of just showing the flat page background. */}
      {isInitialLoading ? (
        <View style={[s.list, { paddingTop: contentTopOffset }]} testID="favorites-skeleton">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : isInitialError && errorProps ? (
        <ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[
            s.list,
            s.centerScroll,
            { paddingTop: contentTopOffset, paddingBottom: insets.bottom || 20 },
          ]}
          refreshControl={
            <RefreshControl
              testID="favorites-error-refresh-control"
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <EmptyState
            testID="favorites-error-state"
            icon={errorProps.icon}
            iconType="ionicons"
            iconColor={errorProps.iconColor}
            title={errorProps.title}
            subtitle={errorProps.subtitle}
            actionLabel={errorProps.actionLabel}
            onAction={onRefresh}
          />
        </ScrollView>
      ) : (
        <Animated.FlatList
          testID="favorites-flat-list"
          {...BROWSE_LIST_VIRTUALIZATION_PROPS}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          data={filteredData}
          keyExtractor={keyExtractor}
          contentContainerStyle={[s.list, { paddingTop: contentTopOffset, paddingBottom: insets.bottom || 20 }]}
          refreshControl={
            <RefreshControl
              testID="favorites-refresh-control"
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={s.segmentedWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.segmentedContainer}>
                {CATEGORY_FILTERS.map(f => {
                  const isActive = activeTab === f.id
                  return (
                    <TouchableOpacity
                      key={f.id}
                      testID={`favorites-tab-${f.id}`}
                      style={[s.segmentTab, isActive && s.segmentTabActive]}
                      onPress={() => setActiveTab(f.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        testID={`favorites-tab-label-${f.id}`}
                        style={[s.segmentTabText, isActive && s.segmentTabTextActive]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyState} testID="favorites-empty-state">
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
          renderItem={renderItem}
        />
      )}
      <GlassNavBar
        appearance="home"
        title="المفضلة"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
        support={glassSupport}
        actions={[
          { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل' },
          { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
        ]}
      />
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateTintBg },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedWrapper: {
    marginHorizontal: Spacing.space5,
    marginBottom: 6,
    marginTop: Spacing.space2,
    backgroundColor: FilterGlassTokens.tab.trackBg,
    borderColor: FilterGlassTokens.tab.trackBorderColor,
    borderWidth: FilterGlassTokens.tab.trackBorderWidth,
    borderRadius: FilterGlassTokens.tab.trackRadius,
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
    backgroundColor: FilterGlassTokens.tab.inactiveBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  segmentTabActive: {
    backgroundColor: FilterGlassTokens.tab.activeBg,
    ...(FilterGlassTokens.tab.activeShadow ?? {}),
  },
  segmentTabText: {
    fontFamily: FilterGlassTokens.tab.inactiveFontFamily,
    fontSize: FilterGlassTokens.tab.fontSize,
    lineHeight: FilterGlassTokens.tab.lineHeight,
    color: FilterGlassTokens.tab.inactiveTextColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  segmentTabTextActive: {
    fontFamily: FilterGlassTokens.tab.activeFontFamily,
    color: FilterGlassTokens.tab.activeTextColor,
  },
  list: { paddingHorizontal: Spacing.space4, gap: Spacing.space4 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.skySoft10, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.pill, gap: 8 },
  emptyBtnTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.white },
})
