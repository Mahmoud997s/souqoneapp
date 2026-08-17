import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { MyListingsNavBar } from '../../src/components/profile/MyListingsNavBar'
import { MyListingsVisualFilters } from '../../src/components/profile/MyListingsVisualFilters'
import { MyListingsAllView } from '../../src/components/profile/my-listings/MyListingsAllView'
import { MyListingsCategoryView } from '../../src/components/profile/my-listings/MyListingsCategoryView'
import { Colors } from '../../src/constants/colors'
import { useMyListingsScreen } from '../../src/hooks/useMyListingsScreen'

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets()
  const screen = useMyListingsScreen()

  return (
    <View style={s.root}>
      {/* Fixed Profile Style Navigation Bar */}
      <MyListingsNavBar
        paddingTop={insets.top + 10}
        onBackPress={() => router.back()}
      />

      {/* Main Container below Fixed Header */}
      <View style={[s.contentContainer, { paddingTop: insets.top + 64 }]}>
        {/* Visual Category Tabs & 2-Row Subfilters Grid */}
        <MyListingsVisualFilters
          activeCategory={screen.activeCategory}
          activeSubFilter={screen.activeSubFilter}
          onSelectCategory={screen.handleSelectCategory}
          onSelectSubFilter={screen.setActiveSubFilter}
        />

        {/* Dynamic View: Horizontal Sliders for "All", Vertical List for specific Category */}
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
            isEditSupported={screen.isEditSupported}
            bottomInset={insets.bottom}
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
            isEditSupported={screen.isEditSupported}
            bottomInset={insets.bottom}
          />
        )}
      </View>

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
  contentContainer: {
    flex: 1,
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
