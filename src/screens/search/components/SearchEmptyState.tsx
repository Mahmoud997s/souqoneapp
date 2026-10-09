import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'

interface SearchEmptyStateProps {
  onClearFilters: () => void
}

export const SearchEmptyState = React.memo(function SearchEmptyState({
  onClearFilters,
}: SearchEmptyStateProps) {
  return (
    <View style={s.container}>
      <View style={s.iconCircle}>
        <Ionicons name="search" size={32} color={Colors.primary} />
      </View>
      <Text style={s.title}>لا توجد نتائج مطابقة لبحثك</Text>
      <Text style={s.subtitle}>
        جرّب البحث بكلمات أخرى، أو تقليل الفلاتر المطبقة للعثور على ما تريد.
      </Text>
      <TouchableOpacity
        style={s.btn}
        onPress={onClearFilters}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
        <Text style={s.btnText}>إعادة ضبط البحث والفلاتر</Text>
      </TouchableOpacity>
    </View>
  )
})

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space6,
    paddingVertical: 50,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F7F9',
    borderWidth: 1,
    borderColor: '#B3E7EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text2,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  btnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.white,
  },
})
