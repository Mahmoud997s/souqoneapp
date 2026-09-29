import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'

interface SearchAutocompleteListProps {
  suggestions: string[]
  onSelectSuggestion: (term: string) => void
}

export const SearchAutocompleteList = React.memo(function SearchAutocompleteList({
  suggestions,
  onSelectSuggestion,
}: SearchAutocompleteListProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <View style={s.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item, index) => `${item}-${index}`}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.row}
            onPress={() => onSelectSuggestion(item)}
            activeOpacity={0.65}
          >
            <View style={s.textRow}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={s.icon} />
              <Text style={s.text} numberOfLines={1}>
                {item}
              </Text>
            </View>
            <Ionicons name="arrow-back-outline" size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  )
})

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 99,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
  },
})
