import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useParts } from '../../src/hooks/useParts'
import { PartCard } from '../../src/components/parts/PartCard'
import { formatLocation } from '../../src/utils/mappers'

const CATEGORIES = [
  { id: 'ENGINE', label: 'المحرك' },
  { id: 'BODY', label: 'الهيكل' },
  { id: 'ELECTRICAL', label: 'الكهرباء' },
  { id: 'SUSPENSION', label: 'التعليق' },
  { id: 'BRAKES', label: 'الفرامل' },
  { id: 'INTERIOR', label: 'الداخلية' },
  { id: 'TIRES', label: 'الإطارات' },
]

const CONDITIONS = [
  { id: 'NEW', label: 'جديد' },
  { id: 'LIKE_NEW', label: 'شبه جديد' },
  { id: 'USED', label: 'مستعمل' },
  { id: 'GOOD', label: 'جيد' },
  { id: 'FAIR', label: 'مقبول' },
  { id: 'REBUILT', label: 'معاد بناؤه' },
  { id: 'REFURBISHED', label: 'مجدد' },
]

export default function PartsBrowseScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()

  const [searchQuery, setSearchQuery] = useState(params.q as string || '')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCat, setSelectedCat] = useState(params.category as string || '')
  const [selectedCond, setSelectedCond] = useState(params.condition as string || '')
  const [isOriginal, setIsOriginal] = useState(params.isOriginal === 'true')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const activeFiltersCount = [selectedCat, selectedCond, isOriginal, minPrice, maxPrice].filter(Boolean).length

  // Build query params
  const queryParams = useMemo(() => {
    const q: any = {}
    if (searchQuery) q.q = searchQuery
    if (selectedCat) q.partCategory = selectedCat
    if (selectedCond) q.condition = selectedCond
    if (isOriginal) q.isOriginal = 'true'
    if (minPrice) q.priceFrom = minPrice
    if (maxPrice) q.priceTo = maxPrice
    return q
  }, [searchQuery, selectedCat, selectedCond, isOriginal, minPrice, maxPrice])

  const { data: parts = [], isLoading, refetch, isRefetching } = useParts(queryParams)

  const clearFilters = () => {
    setSelectedCat('')
    setSelectedCond('')
    setIsOriginal(false)
    setMinPrice('')
    setMaxPrice('')
    setSearchQuery('')
    setShowFilters(false)
  }

  const applyFilters = () => {
    setShowFilters(false)
    refetch()
  }

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilters(false)}>
      <View style={[s.modalRoot, { paddingBottom: insets.bottom }]}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>تصفية النتائج</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          <Text style={s.filterLabel}>قسم القطعة</Text>
          <View style={s.chipsRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, selectedCat === c.id && s.chipActive]}
                onPress={() => setSelectedCat(selectedCat === c.id ? '' : c.id)}
              >
                <Text style={[s.chipTxt, selectedCat === c.id && s.chipTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Condition Filter */}
          <Text style={s.filterLabel}>حالة القطعة</Text>
          <View style={s.chipsRow}>
            {CONDITIONS.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, selectedCond === c.id && s.chipActive]}
                onPress={() => setSelectedCond(selectedCond === c.id ? '' : c.id)}
              >
                <Text style={[s.chipTxt, selectedCond === c.id && s.chipTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Type */}
          <Text style={s.filterLabel}>نوع القطعة</Text>
          <TouchableOpacity
            style={s.checkboxRow}
            activeOpacity={0.7}
            onPress={() => setIsOriginal(!isOriginal)}
          >
            <View style={[s.checkbox, isOriginal && s.checkboxChecked]}>
              {isOriginal && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.checkboxLabel}>قطعة أصلية فقط</Text>
          </TouchableOpacity>

          {/* Price Range */}
          <Text style={s.filterLabel}>السعر (ر.ع)</Text>
          <View style={s.priceInputs}>
            <TextInput
              style={s.priceInput}
              placeholder="من"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={{ marginHorizontal: 8 }}>-</Text>
            <TextInput
              style={s.priceInput}
              placeholder="إلى"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </ScrollView>

        <View style={s.modalFooter}>
          <TouchableOpacity style={s.clearBtn} onPress={clearFilters}>
            <Text style={s.clearBtnTxt}>مسح الفلاتر</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.applyBtn} onPress={applyFilters}>
            <Text style={s.applyBtnTxt}>تطبيق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={s.searchWrap}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={{ marginLeft: 12 }} />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث عن قطعة (محرك، مقص، فحمات...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => refetch()}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={s.filterBtn} onPress={() => setShowFilters(true)}>
          <Ionicons name="options" size={24} color={Colors.primary} />
          {activeFiltersCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filters Scroll */}
      <View style={{ borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: '#fff' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickFilters}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.quickChip, selectedCat === c.id && s.quickChipActive]}
              onPress={() => setSelectedCat(selectedCat === c.id ? '' : c.id)}
            >
              <Text style={[s.quickChipTxt, selectedCat === c.id && s.quickChipTxtActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading && !isRefetching ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="construct-outline" size={64} color={Colors.borderStrong} />
              <Text style={s.emptyTxt}>لا توجد قطع مطابقة لبحثك</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={clearFilters}>
                <Text style={s.emptyBtnTxt}>مسح الفلاتر</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <PartCard 
                item={item} 
                onPress={() => router.push(`/parts/${item.id}` as any)} 
                fullWidth 
                showChips
              />
            </View>
          )}
        />
      )}

      {renderFilterModal()}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3, gap: Spacing.space3, backgroundColor: '#fff',
  },
  backBtn: { padding: Spacing.space1 },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6',
    borderRadius: Radius.lg, height: 44,
  },
  searchInput: {
    flex: 1, fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text, textAlign: 'right', paddingHorizontal: 8,
  },
  filterBtn: { position: 'relative', padding: Spacing.space1 },
  badge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: '#ea580c',
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { color: '#fff', fontSize: 10, fontFamily: 'Almarai_700Bold' },

  quickFilters: { paddingHorizontal: Spacing.space4, paddingVertical: Spacing.space3, gap: Spacing.space2 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  quickChipActive: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
  quickChipTxt: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.text2 },
  quickChipTxtActive: { fontFamily: 'Almarai_700Bold', color: '#ea580c' },

  listContent: { padding: Spacing.space4, paddingBottom: 100 },
  cardWrapper: { marginBottom: Spacing.space4 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: Spacing.space3 },
  emptyTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: Colors.text2 },
  emptyBtn: { marginTop: 8, backgroundColor: '#ea580c', paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },
  emptyBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#fff' },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.space4, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.text },
  modalBody: { flex: 1, padding: Spacing.space4 },
  filterLabel: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text, marginTop: Spacing.space5, marginBottom: Spacing.space3, textAlign: 'left' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.lg, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  chipTxt: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.text2 },
  chipTxtActive: { color: '#fff', fontFamily: 'Almarai_700Bold' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space3, paddingVertical: Spacing.space2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  checkboxLabel: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.text },

  priceInputs: { flexDirection: 'row', alignItems: 'center' },
  priceInput: { flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#f9fafb', textAlign: 'center', fontFamily: 'Almarai_700Bold' },

  modalFooter: { flexDirection: 'row', padding: Spacing.space4, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.space3 },
  clearBtn: { flex: 1, height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  clearBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text },
  applyBtn: { flex: 2, height: 48, borderRadius: Radius.lg, backgroundColor: '#ea580c', alignItems: 'center', justifyContent: 'center' },
  applyBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: '#fff' },
})
