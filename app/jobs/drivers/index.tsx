import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
  ScrollView, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { AppHeader } from '../../../src/components/ui/AppHeader'
import { DriverCard } from '../../../src/components/cards/DriverCard'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { Radius } from '../../../src/constants/radius'
import { useDrivers } from '../../../src/hooks/useDrivers'
import { DriverProfile } from '../../../src/types/jobs.types'
import { OMAN_GOVERNORATES, LICENSE_TYPE_LABELS } from '../../../src/constants/jobs'

const LICENSE_KEYS = Object.keys(LICENSE_TYPE_LABELS)

export default function DriversDirectoryScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading, isError, refetch } = useDrivers()
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [govFilter, setGovFilter] = useState('')
  const [licFilter, setLicFilter] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const drivers: DriverProfile[] = useMemo(() => {
    const items = (data as any)?.items ?? (Array.isArray(data) ? data : [])
    return items.filter((d: DriverProfile) => {
      if (search) {
        const name = d.user?.displayName ?? d.user?.username ?? ''
        if (!name.toLowerCase().includes(search.toLowerCase()) &&
            !d.governorate?.includes(search)) return false
      }
      if (govFilter && d.governorate !== govFilter) return false
      if (licFilter && !d.licenseTypes?.includes(licFilter as any)) return false
      if (verifiedOnly && !d.isVerified) return false
      return true
    })
  }, [data, search, govFilter, licFilter, verifiedOnly])

  const activeFiltersCount = [govFilter, licFilter, verifiedOnly].filter(Boolean).length

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const clearFilters = () => {
    setGovFilter('')
    setLicFilter('')
    setVerifiedOnly(false)
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <AppHeader title="دليل السائقين" showBack variant="jobs" />

      {/* Search + Filter Bar */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو المحافظة..."
            placeholderTextColor={Colors.textMuted}
            textAlign="right"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, showFilters && s.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters ? Colors.primary : Colors.text2}
          />
          {activeFiltersCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={s.filterPanel}>
          {/* Verified toggle */}
          <TouchableOpacity
            style={[s.toggleRow, verifiedOnly && s.toggleRowActive]}
            onPress={() => setVerifiedOnly(!verifiedOnly)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={verifiedOnly ? 'shield-checkmark' : 'shield-outline'}
              size={18}
              color={verifiedOnly ? Colors.primary : Colors.textMuted}
            />
            <Text style={[s.toggleText, verifiedOnly && s.toggleTextActive]}>
              الموثقون فقط
            </Text>
          </TouchableOpacity>

          {/* Governorate filter */}
          <Text style={s.filterSectionTitle}>المحافظة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            <TouchableOpacity
              style={[s.chip, govFilter === '' && s.chipActive]}
              onPress={() => setGovFilter('')}
            >
              <Text style={[s.chipText, govFilter === '' && s.chipTextActive]}>الكل</Text>
            </TouchableOpacity>
            {OMAN_GOVERNORATES.map(gov => (
              <TouchableOpacity
                key={gov}
                style={[s.chip, govFilter === gov && s.chipActive]}
                onPress={() => setGovFilter(gov === govFilter ? '' : gov)}
              >
                <Text style={[s.chipText, govFilter === gov && s.chipTextActive]}>{gov}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* License filter */}
          <Text style={s.filterSectionTitle}>نوع الرخصة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            <TouchableOpacity
              style={[s.chip, licFilter === '' && s.chipActive]}
              onPress={() => setLicFilter('')}
            >
              <Text style={[s.chipText, licFilter === '' && s.chipTextActive]}>الكل</Text>
            </TouchableOpacity>
            {LICENSE_KEYS.map(lk => (
              <TouchableOpacity
                key={lk}
                style={[s.chip, licFilter === lk && s.chipActive]}
                onPress={() => setLicFilter(lk === licFilter ? '' : lk)}
              >
                <Text style={[s.chipText, licFilter === lk && s.chipTextActive]}>
                  {LICENSE_TYPE_LABELS[lk]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeFiltersCount > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearFilters}>
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={s.clearBtnText}>مسح الفلاتر</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results count */}
      <View style={s.resultsMeta}>
        <Text style={s.resultsCount}>
          {isLoading ? '...' : `${drivers.length} سائق`}
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={s.errorState}>
          <Ionicons name="wifi-outline" size={48} color={Colors.textMuted} />
          <Text style={s.errorText}>خطأ في التحميل. تحقق من الاتصال.</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : drivers.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="people-outline" size={56} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>لا يوجد سائقون</Text>
          <Text style={s.emptyDesc}>جرّب تغيير الفلاتر أو البحث بكلمة أخرى</Text>
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={s.retryBtn}>
              <Text style={s.retryText}>مسح الفلاتر</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <DriverCard
              driver={item}
              onPress={() => router.push(`/jobs/drivers/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  searchRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: Spacing.space4, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.space3, height: 44,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, height: '100%',
  },
  filterBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 10, color: '#fff',
  },
  filterPanel: {
    backgroundColor: Colors.white, padding: Spacing.space4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space3, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, alignSelf: 'flex-end',
    marginBottom: Spacing.space3,
  },
  toggleRowActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  toggleText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text2,
  },
  toggleTextActive: { color: Colors.primary },
  filterSectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text, textAlign: 'right',
    marginBottom: Spacing.space2, marginTop: Spacing.space1,
  },
  chipsRow: {
    flexDirection: 'row', gap: Spacing.space2, paddingVertical: Spacing.space1,
    marginBottom: Spacing.space3,
  },
  chip: {
    paddingVertical: 6, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text2 },
  chipTextActive: { color: Colors.primary },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    alignSelf: 'center',
    paddingVertical: 6, paddingHorizontal: Spacing.space3,
  },
  clearBtnText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.error,
  },
  resultsMeta: {
    paddingHorizontal: Spacing.space4, paddingVertical: Spacing.space2,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text2, textAlign: 'right',
  },
  list: { padding: Spacing.space4, gap: Spacing.space3, paddingBottom: 100 },
  errorState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.space6,
  },
  errorText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15,
    color: Colors.text2, marginTop: Spacing.space3, textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.space3, paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space5,
    backgroundColor: Colors.primary + '15', borderRadius: Radius.md,
  },
  retryText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.primary,
  },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.space6,
  },
  emptyTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18,
    color: Colors.text, marginTop: Spacing.space3, textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, marginTop: Spacing.space2, textAlign: 'center', lineHeight: 22,
  },
})
