import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { JobCard } from '../../src/components/cards/JobCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Ionicons } from '@expo/vector-icons'
import { useJobsRaw } from '../../src/hooks/useJobs'
import { router } from 'expo-router'
import { useState, useMemo } from 'react'

const JOB_TYPES  = [{ id: '', label: 'الكل' }, { id: 'FULL_TIME', label: 'دوام كامل' }, { id: 'PART_TIME', label: 'دوام جزئي' }, { id: 'CONTRACT', label: 'عقد' }]
const EXPERIENCES = [{ id: '', label: 'الكل' }, { id: '1', label: 'سنة+' }, { id: '3', label: '3 سنوات+' }, { id: '5', label: '5 سنوات+' }]

export default function JobsBrowseScreen() {
  const { data, isLoading, isError, refetch } = useJobsRaw()
  const [search,    setSearch]    = useState('')
  const [jobType,   setJobType]   = useState('')
  const [minSalary, setMinSalary] = useState('')
  const [maxSalary, setMaxSalary] = useState('')
  const [location,  setLocation]  = useState('')
  const [experience,setExperience]= useState('')
  const [filterOpen,setFilterOpen]= useState(false)
  const [refreshing,setRefreshing]= useState(false)

  const displayData = useMemo(() => {
    let filtered = data ?? []
    if (search) filtered = filtered.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()))
    if (jobType) filtered = filtered.filter(d => d.employmentType === jobType)
    if (minSalary) filtered = filtered.filter(d => d.salary != null && d.salary >= parseFloat(minSalary))
    if (maxSalary) filtered = filtered.filter(d => d.salary != null && d.salary <= parseFloat(maxSalary))
    if (location)  filtered = filtered.filter(d => d.governorate?.includes(location) || d.title?.includes(location))
    if (experience) filtered = filtered.filter(d => d.experienceYears != null && d.experienceYears >= parseInt(experience))
    return filtered
  }, [data, search, jobType, minSalary, maxSalary, location, experience])

  const activeFilters = [jobType, minSalary, maxSalary, location, experience].filter(Boolean).length

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

      {/* Job Type Quick Chips */}
      <FlatList
        horizontal
        data={JOB_TYPES}
        keyExtractor={i => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipsRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, jobType === item.id && s.chipActive]}
            onPress={() => setJobType(item.id)}
          >
            <Text style={[s.chipTxt, jobType === item.id && s.chipTxtActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Filter Panel */}
      {filterOpen && (
        <View style={s.filterPanel}>
          <View style={s.filterRow}>
            <TextInput style={s.filterInput} placeholder="الراتب من (ر.ع)" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={minSalary} onChangeText={setMinSalary} />
            <TextInput style={s.filterInput} placeholder="الراتب إلى (ر.ع)" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={maxSalary} onChangeText={setMaxSalary} />
          </View>
          <TextInput style={s.filterInputFull} placeholder="الموقع / المحافظة" placeholderTextColor={Colors.textMuted} value={location} onChangeText={setLocation} />
          <View style={s.expChips}>
            {EXPERIENCES.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[s.chip, experience === e.id && s.chipActive]}
                onPress={() => setExperience(e.id)}
              >
                <Text style={[s.chipTxt, experience === e.id && s.chipTxtActive]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeFilters > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={() => { setJobType(''); setMinSalary(''); setMaxSalary(''); setLocation(''); setExperience('') }}>
              <Text style={s.clearBtnTxt}>مسح الفلاتر</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results count */}
      {!isLoading && (
        <Text style={s.count}>{displayData.length} نتيجة</Text>
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
          keyExtractor={item => (item as any).id ?? (item as any)._id ?? String(Math.random())}
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
    flex: 1, fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.white, textAlign: 'right'
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'
  },
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center'
  },
  filterBadgeTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 9, color: Colors.white
  },

  // Chips
  chipsRow: { paddingHorizontal: Spacing.space5, gap: Spacing.space2, paddingBottom: Spacing.space3 },
  chip: {
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:    { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text2 },
  chipTxtActive: { color: Colors.white },

  // Filter panel
  filterPanel: {
    marginHorizontal: Spacing.space5, marginBottom: Spacing.space3,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.space4, gap: Spacing.space3,
  },
  filterRow: { flexDirection: 'row', gap: Spacing.space2 },
  filterInput: {
    flex: 1, height: 40, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.space3,
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text,
    backgroundColor: Colors.surface, textAlign: 'right', writingDirection: 'rtl',
  },
  filterInputFull: {
    height: 40, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.space3,
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text,
    backgroundColor: Colors.surface, textAlign: 'right', writingDirection: 'rtl',
  },
  expChips: { flexDirection: 'row', gap: Spacing.space2, flexWrap: 'wrap' },
  clearBtn: {
    alignSelf: 'flex-start', paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill, backgroundColor: Colors.error + '10',
  },
  clearBtnTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.error },

  // Results
  count: { paddingHorizontal: Spacing.space5, marginBottom: Spacing.space2, fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.space6, gap: Spacing.space3 },
  errorTxt:     { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: Colors.error, fontSize: 15, textAlign: 'center', writingDirection: 'rtl' },
  retryBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space5 },
  retryTxt:     { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: Colors.white, fontSize: 14, textAlign: 'center', writingDirection: 'rtl' },
  emptyTitle:   { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 17, color: Colors.text, textAlign: 'center', writingDirection: 'rtl' },
  emptySubtitle:{ fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text2, textAlign: 'center', writingDirection: 'rtl' },
})
