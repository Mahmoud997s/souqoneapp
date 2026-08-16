import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from 'react-native'
import { BrowseHeader } from '../../src/components/ui/BrowseHeader'
import { ListingTabs } from '../../src/components/ui/ListingTabs'
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader'
import Animated from 'react-native-reanimated'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { JobCard } from '../../src/components/cards/JobCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { JobsFilterBottomSheet, JobFilterState } from '../../src/components/filters/JobsFilterBottomSheet'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Ionicons } from '@expo/vector-icons'
import { useInfiniteJobsRaw } from '../../src/hooks/useJobs'
import { SORT_OPTIONS } from '../../src/constants/jobs'
import { router } from 'expo-router'
import { useState, useMemo, useEffect } from 'react'

import { Modal, ActivityIndicator } from 'react-native'
import { QuickFilters } from '../../src/components/ui/QuickFilters'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { OMAN_LOCATIONS } from '../../src/constants/locations';

const GOVERNORATE_OPTIONS = OMAN_LOCATIONS.map(g => ({
  labelAr: g.labelAr,
  value: g.labelAr
}));
const JOB_TYPES = [{ id: '', label: 'الكل' }, { id: 'HIRING', label: 'طلب سائق' }, { id: 'OFFERING', label: 'عرض خدمة' }]
const EMPLOYMENT_TYPES = [{ id: 'FULL_TIME', label: 'دوام كامل' }, { id: 'PART_TIME', label: 'دوام جزئي' }, { id: 'CONTRACT', label: 'عقد' }, { id: 'FREELANCE', label: 'عمل حر' }]
const EXPERIENCES = [{ id: '0', label: 'بدون خبرة' }, { id: '1', label: 'سنة فأكثر' }, { id: '3', label: '3 سنوات فأكثر' }, { id: '5', label: '5 سنوات فأكثر' }]
const LICENSE_TYPES = [{ id: 'LIGHT', label: 'خفيفة' }, { id: 'HEAVY', label: 'ثقيلة' }, { id: 'TRANSPORT', label: 'نقل' }, { id: 'BUS', label: 'حافلات' }, { id: 'MOTORCYCLE', label: 'دراجة' }]

const DROPDOWN_FILTERS = [
  { id: 'salary', label: 'الراتب', icon: 'wallet-outline' },
  { id: 'city', label: 'المدينة', icon: 'location-outline' },
  { id: 'employmentType', label: 'الدوام', icon: 'time-outline' },
  { id: 'experience', label: 'الخبرة', icon: 'briefcase-outline' },
  { id: 'licenseType', label: 'الرخصة', icon: 'card-outline' },
];

const SALARY_RANGES = [
  { id: 's1', label: 'أقل من 300 ر.ع', min: 0, max: 300 },
  { id: 's2', label: '300 - 500 ر.ع', min: 300, max: 500 },
  { id: 's3', label: '500 - 800 ر.ع', min: 500, max: 800 },
  { id: 's4', label: '800 - 1,200 ر.ع', min: 800, max: 1200 },
  { id: 's5', label: 'أكثر من 1,200 ر.ع', min: 1200, max: 999999 },
];

export default function JobsBrowseScreen() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  const [filters, setFilters] = useState<JobFilterState>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Map filters to API params
  const apiParams = useMemo(() => {
    const params: any = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.jobType) params.jobType = filters.jobType;
    if (filters.employmentType) params.employmentType = filters.employmentType;
    if (filters.minSalary) params.minSalary = filters.minSalary;
    if (filters.maxSalary) params.maxSalary = filters.maxSalary;
    if (filters.location) params.governorate = filters.location;
    if (filters.city) params.governorate = filters.city; // backend uses governorate
    if (filters.licenseType) params.licenseType = filters.licenseType;
    
    if (filters.sort) {
       const [sortBy, sortOrder] = filters.sort.split('_');
       params.sortBy = sortBy;
       params.sortOrder = sortOrder;
    }
    return params;
  }, [debouncedSearch, filters]);

  const { 
    data, isLoading, isError, refetch, 
    fetchNextPage, hasNextPage, isFetchingNextPage 
  } = useInfiniteJobsRaw(apiParams);

  // Flatten the pages for FlatList and apply any remaining local filters (like experience)
  const displayData = useMemo(() => {
    if (!data?.pages) return [];
    let flattened = data.pages.flatMap((page: any) => page?.items || page?.data || []);
    
    if (filters.experience) {
      flattened = flattened.filter((d: any) => d.experienceYears != null && d.experienceYears >= parseInt(filters.experience!, 10));
    }
    return flattened;
  }, [data, filters.experience]);

  const quickFilterItems = DROPDOWN_FILTERS.map(qf => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'salary') {
      isActive = !!filters.maxSalary;
      if (isActive) displayLabel = SALARY_RANGES.find(p => p.max === Number(filters.maxSalary))?.label || qf.label;
    } else if (qf.id === 'city') {
      isActive = !!filters.city;
      if (isActive) displayLabel = filters.city as string;
    } else if (qf.id === 'employmentType') {
      isActive = !!filters.employmentType;
      if (isActive) displayLabel = EMPLOYMENT_TYPES.find(t => t.id === filters.employmentType)?.label || qf.label;
    } else if (qf.id === 'experience') {
      isActive = !!filters.experience;
      if (isActive) displayLabel = EXPERIENCES.find(t => t.id === filters.experience)?.label || qf.label;
    } else if (qf.id === 'licenseType') {
      isActive = !!filters.licenseType;
      if (isActive) displayLabel = LICENSE_TYPES.find(t => t.id === filters.licenseType)?.label || qf.label;
    }

    return {
      id: qf.id,
      label: displayLabel,
      icon: qf.icon as any,
      isActive
    };
  });

  const handleClearQuickFilter = (id: string) => {
    const newFilters = { ...filters };
    if (id === 'salary') { delete newFilters.minSalary; delete newFilters.maxSalary; }
    if (id === 'city') delete newFilters.city;
    if (id === 'employmentType') delete newFilters.employmentType;
    if (id === 'experience') delete newFilters.experience;
    if (id === 'licenseType') delete newFilters.licenseType;
    setFilters(newFilters);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { scrollHandler } = useScrollAwareNav()
  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <View style={s.root}>
      <BrowseHeader
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث في الوظائف..."
        activeFiltersCount={activeFilters}
        onFilterPress={() => setFilterOpen(!filterOpen)}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={JOB_TYPES}
          activeTabId={filters.jobType}
          onChangeTab={(id) => {
            if (id === filters.jobType) {
              const newFilters = { ...filters };
              delete newFilters.jobType;
              setFilters(newFilters);
            } else {
              setFilters({ ...filters, jobType: id as any });
            }
          }}
          onClearTab={() => {
            const newFilters = { ...filters };
            delete newFilters.jobType;
            setFilters(newFilters);
          }}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as string)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* Filter Panel */}
      <JobsFilterBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        initialFilters={filters}
        onApplyFilters={setFilters}
      />



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
        <Animated.FlatList
          data={displayData}
          keyExtractor={(item, index) => (item as any).id ?? (item as any)._id ?? `job-${index}`}
          contentContainerStyle={[s.list, { paddingTop: Spacing.space2 }]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false) }}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            <>
              {isFetchingNextPage && (
                <View style={{ padding: Spacing.space4, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )}
              {displayData && displayData.length > 0 && (
                <SupportHelpButton />
              )}
            </>
          )}
          ListHeaderComponent={
            <View style={{ paddingBottom: Spacing.space3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {activeFilters > 0 ? (
                <TouchableOpacity onPress={() => setFilters({})}>
                  <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.error }}>
                    مسح الفلاتر
                  </Text>
                </TouchableOpacity>
              ) : <View />}

              <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <Ionicons name="briefcase-outline" size={14} color="#64748b" />
                <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#64748b' }}>
                  {displayData.length} وظيفة متاحة
                </Text>
              </View>
            </View>
          }
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

      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setActiveDropdown(null)}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {activeDropdown === 'salary' ? 'الراتب' :
                 activeDropdown === 'city' ? 'اختر المدينة' :
                 activeDropdown === 'employmentType' ? 'طبيعة العمل' :
                 activeDropdown === 'experience' ? 'سنوات الخبرة' :
                 activeDropdown === 'licenseType' ? 'نوع الرخصة' : ''}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {activeDropdown === 'salary' && (
              <FlatList
                data={SALARY_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, minSalary: item.min.toString(), maxSalary: item.max.toString() });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.maxSalary === item.max.toString() && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.maxSalary === item.max.toString() && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'city' && (
              <FlatList
                data={GOVERNORATE_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, city: item.labelAr });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.city === item.labelAr && s.modalOptionTxtActive]}>
                      {item.labelAr}
                    </Text>
                    {filters.city === item.labelAr && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'employmentType' && (
              <FlatList
                data={EMPLOYMENT_TYPES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, employmentType: item.id as any });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.employmentType === item.id && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.employmentType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'experience' && (
              <FlatList
                data={EXPERIENCES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, experience: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.experience === item.id && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.experience === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'licenseType' && (
              <FlatList
                data={LICENSE_TYPES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, licenseType: item.id as any });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.licenseType === item.id && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.licenseType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  loadWrap: { padding: Spacing.space5 },
  list: { paddingHorizontal: Spacing.space4, paddingBottom: Spacing.space5, paddingTop: 0 },

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
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space3,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  tabTxt: {
    fontFamily: 'Almarai_700Bold', fontSize: 13,
    color: '#64748B',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, color: Colors.text,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  modalOptionTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: Colors.text2,
  },
  modalOptionTxtActive: {
    color: Colors.primary,
  },
})
