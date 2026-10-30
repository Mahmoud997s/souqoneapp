import React from 'react'
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { CategoryFilterType } from '../../../hooks/useSearchLogic'

interface CategoryTabItem {
  id: CategoryFilterType
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export const SEARCH_CATEGORY_TABS: CategoryTabItem[] = [
  { id: 'all', label: 'الكل', icon: 'grid-outline' },
  { id: 'cars', label: 'سيارات', icon: 'car-sport-outline' },
  { id: 'parts', label: 'قطع غيار', icon: 'construct-outline' },
  { id: 'buses', label: 'باصات', icon: 'bus-outline' },
  { id: 'equipment', label: 'معدات', icon: 'hardware-chip-outline' },
  { id: 'services', label: 'خدمات', icon: 'hammer-outline' },
]

export const CATEGORIES = SEARCH_CATEGORY_TABS

interface SearchCategoryTabsProps {
  selectedCategory: CategoryFilterType
  onSelectCategory: (category: CategoryFilterType) => void
}

/**
 * SearchCategoryTabs
 * Quick category tabs for SearchScreen matching the segmented tab styling
 * of MyListingsVisualFilters / VisualFiltersBase (D-163d).
 *
 * - Light grey segmented track (#f1f5f9 / surfaceAlt) with borderRadius 8 and padding 3.
 * - Tabs with borderRadius 6, paddingVertical 6, paddingHorizontal 12, gap 5.
 * - Active tab: crisp white #ffffff background with subtle shadow, primary color text & icon.
 * - Inactive tab: transparent background, textMuted typography.
 * - 100% behavioral parity: selectedCategory, onSelectCategory, item order preserved.
 */
export const SearchCategoryTabs = React.memo(function SearchCategoryTabs({
  selectedCategory,
  onSelectCategory,
}: SearchCategoryTabsProps) {
  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContainer}
      >
        <View style={s.segmentedTrack}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                testID={`category-tab-${cat.id}`}
                style={[s.tab, isActive ? s.tabActive : s.tabInactive]}
                onPress={() => onSelectCategory(cat.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isActive ? Colors.primary : Colors.textMuted}
                  style={s.tabIcon}
                />
                <Text
                  testID={`category-tab-text-${cat.id}`}
                  style={[s.tabText, isActive ? s.tabTextActive : s.tabTextInactive]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
})

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.space2,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.space4,
  },
  segmentedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabIcon: {
    marginEnd: 2,
  },
  tabText: {
    textAlign: 'center',
    writingDirection: 'rtl',
    fontSize: 11.5,
    lineHeight: 16,
  },
  tabTextInactive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.primary,
  },
})
