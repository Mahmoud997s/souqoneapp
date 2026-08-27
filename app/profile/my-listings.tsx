import React, { useState, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { MyListingsVisualFilters } from '../../src/components/profile/MyListingsVisualFilters'
import { MyListingsAllView } from '../../src/components/profile/my-listings/MyListingsAllView'
import { MyListingsCategoryView } from '../../src/components/profile/my-listings/MyListingsCategoryView'
import { Colors } from '../../src/constants/colors'
import { useMyListingsScreen } from '../../src/hooks/useMyListingsScreen'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { BlurView } from 'expo-blur'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)
const FILTER_BAR_HEIGHT_ESTIMATE = 108

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets()
  const screen = useMyListingsScreen()
  const [filterBarHeight, setFilterBarHeight] = useState(FILTER_BAR_HEIGHT_ESTIMATE)
  const filterBarHeightSV = useSharedValue(FILTER_BAR_HEIGHT_ESTIMATE)
  const measuredOnce = useRef(false)
  const { scrollHandler } = useScrollAwareNav()
  const { navHidden } = useNavVisibility()

  const navBarHeight = insets.top + 52
  const topInset = navBarHeight + filterBarHeight

  const handleFilterBarLayout = (e: LayoutChangeEvent) => {
    // Measure once and freeze — re-measuring while the bar is mid-animation
    // (Yoga can report a compressed size as the animated parent shrinks) was
    // corrupting the target height and causing the stutter on scroll-up.
    if (measuredOnce.current) return
    const h = e.nativeEvent.layout.height
    // With 1 row of filters, total height is ~88px. Ensure we don't freeze too early.
    if (h > 75) {
      measuredOnce.current = true
      setFilterBarHeight(h)
      filterBarHeightSV.value = h
    }
  }

  // Collapses the filter bar out of view when scrolling down, matching the
  // hide/show behavior CollapsibleSubHeader gives Browse/Favorites. Reads the
  // shared value directly (not React state) so the worklet never gets
  // recreated mid-gesture.
  const filterBarAnimatedStyle = useAnimatedStyle(() => {
    const h = interpolate(navHidden.value, [0, 0.1, 1], [filterBarHeightSV.value, 0, 0], Extrapolation.CLAMP)
    const opacity = interpolate(navHidden.value, [0, 0.1, 1], [1, 0, 0], Extrapolation.CLAMP)
    return { height: h, opacity, overflow: 'hidden' }
  })

  // No shared background style needed since we separated the NavBar and Filters

  return (
    <View style={s.root}>
      {/* Scrollable content spans the full screen height (like Profile's ScrollView) so its
          scrolled cards actually pass behind the fixed GlassNavBar — that's what lets the blur
          reflect real colors instead of just showing the flat page background. */}
      {screen.activeCategory === 'all' ? (
        <MyListingsAllView
          groupedSections={screen.groupedSections}
          isLoading={screen.isLoading}
          isRefreshing={screen.isRefreshing}
          onRefresh={screen.handleRefresh}
          onSelectCategory={screen.handleSelectCategory}
          onView={screen.handleView}
          onEdit={screen.handleEdit}
          onDelete={screen.handleDelete}
          onStatusChange={screen.handleStatusChange}
          isEditSupported={screen.isEditSupported}
          bottomInset={insets.bottom}
          topInset={navBarHeight}
          onScroll={scrollHandler}
          header={
            <MyListingsVisualFilters
              activeCategory={screen.activeCategory}
              activeSubFilter={screen.activeSubFilter}
              onSelectCategory={screen.handleSelectCategory}
              onSelectSubFilter={screen.setActiveSubFilter}
            />
          }
        />
      ) : (
        <MyListingsCategoryView
          data={screen.filteredData}
          isLoading={screen.isLoading}
          isRefreshing={screen.isRefreshing}
          isFetchingNextPage={screen.isFetchingNextPage}
          hasNextPage={screen.hasNextPage}
          fetchNextPage={screen.fetchNextPage}
          onRefresh={screen.handleRefresh}
          onView={screen.handleView}
          onEdit={screen.handleEdit}
          onDelete={screen.handleDelete}
          onStatusChange={screen.handleStatusChange}
          isEditSupported={screen.isEditSupported}
          bottomInset={insets.bottom}
          topInset={navBarHeight}
          onScroll={scrollHandler}
          header={
            <MyListingsVisualFilters
              activeCategory={screen.activeCategory}
              activeSubFilter={screen.activeSubFilter}
              onSelectCategory={screen.handleSelectCategory}
              onSelectSubFilter={screen.setActiveSubFilter}
            />
          }
        />
      )}

      {/* Background Blur removed to separate NavBar from Filters */}

      {/* The filter bar is now passed down to be rendered as the ListHeaderComponent
          inside the respective scroll views so it scrolls up naturally with the content. */}

      {/* Fixed Profile Style Navigation Bar */}
      <GlassNavBar
        title="إعلاناتي"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
        actions={[
          { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل' },
          { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
        ]}
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.8}
        onPress={() => router.push('/post' as any)}
      >
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sharedBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  whiteWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  filterBarMeasure: {
    flexShrink: 0,
  },
  fab: {
    position: 'absolute',
    left: 20, // Bottom-left in RTL
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
})
