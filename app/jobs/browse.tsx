import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { JobCard } from '../../src/components/cards/JobCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { JobsFilterBottomSheet, JobFilterState } from '../../src/components/filters/JobsFilterBottomSheet'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Ionicons } from '@expo/vector-icons'
import { useJobsRaw } from '../../src/hooks/useJobs'
import { SORT_OPTIONS } from '../../src/constants/jobs'
import { router } from 'expo-router'
import { useState, useMemo, useEffect } from 'react'

const JOB_TYPES = [{ id: '', label: 'الكل' }, { id: 'HIRING', label: 'طلب سائق' }, { id: 'OFFERING', label: 'عرض خدمة' }]
const EMPLOYMENT_TYPES = [{ id: 'FULL_TIME', label: 'دوام كامل' }, { id: 'PART_TIME', label: 'دوام جزئي' }, { id: 'CONTRACT', label: 'عقد' }, { id: 'TEMPORARY', label: 'مؤقت' }]
const EXPERIENCES = [{ id: '', label: 'الكل' }, { id: '1', label: 'سنة+' }, { id: '3', label: '3 سنوات+' }, { id: '5', label: '5 سنوات+' }]
const LICENSE_TYPES = [{ id: 'LIGHT', label: 'خفيفة' }, { id: 'HEAVY', label: 'ثقيلة' }, { id: 'TRANSPORT', label: 'نقل' }, { id: 'BUS', label: 'حافلات' }, { id: 'MOTORCYCLE', label: 'دراجة' }]

export default function JobsBrowseScreen() {
  const { data, isLoading, isError, refetch } = useJobsRaw()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  const [filters, setFilters] = useState<JobFilterState>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const displayData = useMemo(() => {
    let filtered = data ?? []
    
    // Filters
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase()
      filtered = filtered.filter(d => 
        d.title?.toLowerCase().includes(s) || 
        d.governorate?.toLowerCase().includes(s) || 
        d.city?.toLowerCase().includes(s)
      )
    }
    if (filters.jobType) filtered = filtered.filter(d => d.jobType === filters.jobType)
    if (filters.employmentType) filtered = filtered.filter(d => d.employmentType === filters.employmentType)
    if (filters.minSalary) filtered = filtered.filter(d => d.salary != null && d.salary >= parseFloat(filters.minSalary!))
    if (filters.maxSalary) filtered = filtered.filter(d => d.salary != null && d.salary <= parseFloat(filters.maxSalary!))
    if (filters.location) filtered = filtered.filter(d => d.governorate === filters.location)
    if (filters.city) filtered = filtered.filter(d => d.city === filters.city)
    if (filters.experience) filtered = filtered.filter(d => d.experienceYears != null && d.experienceYears >= parseInt(filters.experience!, 10))
    if (filters.licenseType) filtered = filtered.filter(d => d.licenseTypes?.includes(filters.licenseType as any))

    // Sorting
    filtered = [...filtered]
    const currentSort = filters.sort || 'createdAt_desc'
    if (currentSort === 'createdAt_desc') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (currentSort === 'createdAt_asc') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (currentSort === 'salary_desc') {
      filtered.sort((a, b) => (b.salary || 0) - (a.salary || 0))
    } else if (currentSort === 'viewCount_desc') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return filtered
  }, [data, debouncedSearch, filters])

  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <View style={s.root}>
      <AppHeader
        showBack
        centerSlot={
          <View style={s.compactSearch}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={s.compactInput}
              placeholder="ابحث بالعنوان أو الموقع..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ) : null}
          </View>
        }
        rightSlot={
          <TouchableOpacity style={s.iconBtn} onPress={() => setFilterOpen(!filterOpen)}>
            <Ionicons name="options-outline" size={20} color={Colors.white} />
            {activeFilters > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeTxt}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Main Job Type Tabs */}
      <View style={s.tabsContainer}>
        {JOB_TYPES.map((item) => {
          const isActive = filters.jobType === item.id || (!filters.jobType && item.id === '');
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.tab, isActive && s.tabActive]}
              onPress={() => setFilters(prev => ({ ...prev, jobType: item.id }))}
            >
              <Text style={[s.tabTxt, isActive && s.tabTxtActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter Panel */}
      <JobsFilterBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        initialFilters={filters}
        onApplyFilters={setFilters}
      />

      {/* Results count */}
      {!isLoading && data && (
        <View style={s.countWrap}>
          <Text style={s.countText}>
            إظهار {displayData.length} من {data.length} نتيجة
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={s.loadWrap}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} style={{ marginBottom: Spacing.space4 }} />)}
        </View>
      ) : isError ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={s.errorTxt}>حدث خطأ أثناء التحميل</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, index) => (item as any).id ?? (item as any)._id ?? `job-${index}`}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false) }}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="briefcase-outline" size={56} color={Colors.border} />
              <Text style={s.emptyTitle}>لا توجد وظائف</Text>
              <Text style={s.emptySubtitle}>جرّب تغيير الفلاتر للعثور على نتائج</Text>
            </View>
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/jobs/${(item as any).id ?? (item as any)._id}` as any)}
            />
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  loadWrap: { padding: Spacing.space5 },
  list: { padding: Spacing.space5, paddingTop: 0 },

  // Compact Header Search
  compactSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.15)', height: 40, borderRadius: 20,
    paddingHorizontal: Spacing.space3, marginHorizontal: Spacing.space3
  },
  compactInput: {
    flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.white, writingDirection: 'rtl'
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'
  },
  filterBadge: {
    position: 'absolute', top: -2, end: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center'
  },
  filterBadgeTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 9, color: Colors.white
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 4,
    marginHorizontal: Spacing.space5,
    marginVertical: Spacing.space3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.text2,
  },
  tabTxtActive: {
    color: Colors.primary,
  },

  // Filter panel
  filterPanel: {
    marginHorizontal: Spacing.space5, marginBottom: Spacing.space3,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.space4, gap: Spacing.space3,
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.space1,
  },
  filterTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 15, color: Colors.text, writingDirection: 'rtl',
  },
  filterSectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.text2, writingDirection: 'rtl',
    marginTop: Spacing.space1,
  },
  filterRow: { flexDirection: 'row', gap: Spacing.space3, alignItems: 'flex-start' },
  filterInput: {
    flex: 1, height: 40, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.space3,
    fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text,
    backgroundColor: Colors.surface, writingDirection: 'rtl',
  },
  expChips: { flexDirection: 'row', gap: Spacing.space2, flexWrap: 'wrap' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill, backgroundColor: Colors.error + '10',
  },
  clearBtnTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 11, color: Colors.error },

  // Results
  countWrap: { paddingHorizontal: Spacing.space5, marginBottom: Spacing.space3, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  countText: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary, backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', writingDirection: 'rtl' },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.space6, gap: Spacing.space3 },
  errorTxt:     { fontFamily: 'Almarai_700Bold',  color: Colors.error, fontSize: 15, textAlign: 'center', writingDirection: 'rtl' },
  retryBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space5 },
  retryTxt:     { fontFamily: 'Almarai_700Bold',  color: Colors.white, fontSize: 14, textAlign: 'center', writingDirection: 'rtl' },
  emptyTitle:   { fontFamily: 'Almarai_700Bold',  fontSize: 17, color: Colors.text, textAlign: 'center', writingDirection: 'rtl' },
  emptySubtitle:{ fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2, textAlign: 'center', writingDirection: 'rtl' },
})
