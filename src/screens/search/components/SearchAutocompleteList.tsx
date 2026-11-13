import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { getListErrorProps } from '../../../utils/getListErrorProps'

interface SearchAutocompleteListProps {
  suggestions: string[]
  onSelectSuggestion: (term: string) => void
  isError?: boolean
  error?: unknown
  onRetry?: () => void | Promise<unknown>
  isRetrying?: boolean
}

export const SearchAutocompleteList = React.memo(function SearchAutocompleteList({
  suggestions,
  onSelectSuggestion,
  isError = false,
  error,
  onRetry,
  isRetrying = false,
}: SearchAutocompleteListProps) {
  if (!suggestions || suggestions.length === 0) {
    if (!isError) return null

    const errorProps = getListErrorProps(error, 'تعذر جلب اقتراحات البحث')
    return (
      <View style={s.container} testID="search-autocomplete-error">
        <View style={s.errorRow}>
          <Ionicons
            name={errorProps.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={errorProps.iconColor}
          />
          <View style={s.errorTextWrap}>
            <Text style={s.errorTitle}>{errorProps.title}</Text>
            <Text style={s.errorSubtitle} numberOfLines={2}>
              {errorProps.subtitle}
            </Text>
          </View>
          {onRetry ? (
            <TouchableOpacity
              testID="search-autocomplete-retry-btn"
              style={s.retryBtn}
              onPress={() => onRetry()}
              disabled={isRetrying}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={errorProps.actionLabel}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={s.retryBtnText}>{errorProps.actionLabel}</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item, index) => `${typeof item === 'string' ? item : (item as any)?.id || index}-${index}`}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const label = typeof item === 'string' ? item : (item as any)?.title || ''
          return (
            <TouchableOpacity
              style={s.row}
              onPress={() => onSelectSuggestion(label)}
              activeOpacity={0.65}
            >
              <View style={s.textRow}>
                <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={s.icon} />
                <Text style={s.text} numberOfLines={1}>
                  {label}
                </Text>
              </View>
              <Ionicons name="arrow-back-outline" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          )
        }}
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
  },
  errorTextWrap: {
    flex: 1,
    gap: 2,
  },
  errorTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  errorSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  retryBtn: {
    minHeight: 40,
    minWidth: 88,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.white,
  },
})
