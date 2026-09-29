import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { CategoryFilterType } from '../../../hooks/useSearchLogic'

const TRENDING_KEYWORDS = [
  'تويوتا لاندكروزر',
  'لكزس LX',
  'قطع غيار أصلية',
  'باص نيسان سيفيليان',
  'وظائف سائقين',
  'خدمات نقل بضائع',
  'معدات حفر وبناء',
  'عقود إيجار سنوية',
]

const QUICK_CATEGORIES: { id: CategoryFilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'cars', label: 'سيارات', icon: 'car-sport' },
  { id: 'parts', label: 'قطع غيار', icon: 'construct' },
  { id: 'buses', label: 'باصات ونقل', icon: 'bus' },
  { id: 'equipment', label: 'معدات ثقيلة', icon: 'hardware-chip' },
  { id: 'jobs', label: 'وظائف', icon: 'briefcase' },
  { id: 'services', label: 'خدمات', icon: 'hammer' },
]

interface SearchInitialStateProps {
  searchHistory: string[]
  onSelectTerm: (term: string) => void
  onRemoveHistoryItem: (term: string) => void
  onClearHistory: () => void
  onSelectCategory: (category: CategoryFilterType) => void
}

export const SearchInitialState = React.memo(function SearchInitialState({
  searchHistory,
  onSelectTerm,
  onRemoveHistoryItem,
  onClearHistory,
  onSelectCategory,
}: SearchInitialStateProps) {
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── 1. Recent Searches ── */}
      {searchHistory.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Ionicons name="time-outline" size={17} color={Colors.primary} />
              <Text style={s.sectionTitle}>عمليات البحث الأخيرة</Text>
            </View>
            <TouchableOpacity onPress={onClearHistory} hitSlop={8}>
              <Text style={s.clearBtnText}>مسح الكل</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chipsRow}>
            {searchHistory.map((item, index) => (
              <View key={`${item}-${index}`} style={s.historyChip}>
                <TouchableOpacity
                  style={s.historyChipBtn}
                  onPress={() => onSelectTerm(item)}
                  activeOpacity={0.7}
                >
                  <Text style={s.historyChipText} numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onRemoveHistoryItem(item)}
                  hitSlop={6}
                  style={s.chipRemoveBtn}
                >
                  <Ionicons name="close" size={13} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── 2. Trending Searches ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.sectionTitleRow}>
            <Ionicons name="flame" size={18} color="#EA580C" />
            <Text style={s.sectionTitle}>الأكثر بحثاً في السوق</Text>
          </View>
        </View>

        <View style={s.chipsRow}>
          {TRENDING_KEYWORDS.map((keyword, index) => (
            <TouchableOpacity
              key={`${keyword}-${index}`}
              style={s.trendingChip}
              onPress={() => onSelectTerm(keyword)}
              activeOpacity={0.7}
            >
              <Ionicons name="trending-up-outline" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={s.trendingChipText}>{keyword}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 3. Quick Category Navigation ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.sectionTitleRow}>
            <Ionicons name="grid-outline" size={17} color={Colors.primary} />
            <Text style={s.sectionTitle}>تصفح حسب القسم</Text>
          </View>
        </View>

        <View style={s.categoriesGrid}>
          {QUICK_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={s.categoryCard}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={s.categoryIconBox}>
                <Ionicons name={cat.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={s.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  )
})

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.space4,
    paddingBottom: 40,
    gap: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
  },
  clearBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.pill,
    paddingRight: 12,
    paddingLeft: 6,
    paddingVertical: 6,
  },
  historyChipBtn: {
    maxWidth: 180,
  },
  historyChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
  },
  chipRemoveBtn: {
    padding: 3,
    marginRight: 4,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trendingChipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '31.3%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'center',
  },
})
