import React from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../../components/ui/AppHeader'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'

interface SearchHeaderBarProps {
  query: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onClear: () => void
  activeFiltersCount: number
  onOpenFilters: () => void
}

export const SearchHeaderBar = React.memo(function SearchHeaderBar({
  query,
  onChangeText,
  onSubmit,
  onClear,
  activeFiltersCount,
  onOpenFilters,
}: SearchHeaderBarProps) {
  return (
    <AppHeader
      showBack={false}
      theme="dark"
      leftSlot={<View style={{ width: 0 }} />}
      centerSlot={
        <View style={s.searchBarContainer}>
          <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.75)" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث عن سيارات، قطع، وظائف..."
            placeholderTextColor="rgba(255, 255, 255, 0.65)"
            value={query}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            textAlign="right"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={onClear} hitSlop={10} style={s.clearBtn}>
              <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.85)" />
            </TouchableOpacity>
          )}
        </View>
      }
      rightSlot={
        <TouchableOpacity
          style={s.filterBtn}
          onPress={onOpenFilters}
          activeOpacity={0.7}
          accessibilityLabel="فلاتر البحث"
        >
          <Ionicons name="options-outline" size={20} color={Colors.white} />
          {activeFiltersCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      }
    />
  )
})

const s = StyleSheet.create({
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: Spacing.space3,
    marginHorizontal: Spacing.space2,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.white,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    writingDirection: 'rtl',
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: Colors.white,
    textAlign: 'center',
  },
})
