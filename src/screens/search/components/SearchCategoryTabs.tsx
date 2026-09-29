import React from 'react'
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { CategoryFilterType } from '../../../hooks/useSearchLogic'

interface CategoryTabItem {
  id: CategoryFilterType
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

const CATEGORIES: CategoryTabItem[] = [
  { id: 'all', label: 'الكل', icon: 'grid-outline' },
  { id: 'cars', label: 'سيارات', icon: 'car-sport-outline' },
  { id: 'parts', label: 'قطع غيار', icon: 'construct-outline' },
  { id: 'buses', label: 'باصات', icon: 'bus-outline' },
  { id: 'equipment', label: 'معدات', icon: 'hardware-chip-outline' },
  { id: 'jobs', label: 'وظائف', icon: 'briefcase-outline' },
  { id: 'services', label: 'خدمات', icon: 'hammer-outline' },
]

interface SearchCategoryTabsProps {
  selectedCategory: CategoryFilterType
  onSelectCategory: (category: CategoryFilterType) => void
}

export const SearchCategoryTabs = React.memo(function SearchCategoryTabs({
  selectedCategory,
  onSelectCategory,
}: SearchCategoryTabsProps) {
  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.container}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <TouchableOpacity
              key={cat.id}
              style={[s.tab, isActive && s.tabActive]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={15}
                color={isActive ? Colors.white : Colors.text2}
                style={s.tabIcon}
              />
              <Text style={[s.tabText, isActive && s.tabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
})

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
  },
  container: {
    paddingHorizontal: Spacing.space4,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text2,
  },
  tabTextActive: {
    color: Colors.white,
  },
})
