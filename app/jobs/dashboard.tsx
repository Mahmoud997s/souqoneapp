import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { JobCard } from '../../src/components/cards/JobCard'
import { ProposalCard } from '../../src/components/cards/ProposalCard'
import VerificationBanner from '../../src/components/jobs/VerificationBanner'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useMyJobs, useMyApplications } from '../../src/hooks/useJobsDashboard'
import { useMyDriverProfile } from '../../src/hooks/useDriverProfile'
import { useMyEmployerProfile } from '../../src/hooks/useEmployerProfile'
import { useVerificationStatus } from '../../src/hooks/useVerification'
import { useJobProfileStore } from '../../src/store/jobProfileStore'

type TabId = 'overview' | 'listings' | 'applications'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'الرئيسية', icon: 'home-outline' },
  { id: 'listings', label: 'إعلاناتي', icon: 'briefcase-outline' },
  { id: 'applications', label: 'طلباتي', icon: 'document-text-outline' },
]

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string | number; color?: string
}) {
  return (
    <View style={stat.card}>
      <View style={[stat.iconBox, { backgroundColor: (color ?? Colors.primary) + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color ?? Colors.primary} />
      </View>
      <Text style={stat.value}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const { activeRole } = useJobProfileStore()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: driverProfile } = useMyDriverProfile()
  const { data: employerProfile } = useMyEmployerProfile()
  const { data: verification } = useVerificationStatus()
  const { data: myJobs, isLoading: jobsLoading, refetch: refetchJobs } = useMyJobs()
  const { data: myApplications, isLoading: appsLoading, refetch: refetchApps } = useMyApplications()

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchJobs(), refetchApps()])
    setRefreshing(false)
  }

  const isDriver = activeRole === 'driver'
  const isEmployer = activeRole === 'employer'

  // ── If no profile: Onboarding CTA ──
  if (!driverProfile && !employerProfile) {
    return (
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="لوحة التحكم" showBack variant="jobs" />
        <View style={s.centered}>
          <View style={s.emptyIllustration}>
            <Ionicons name="briefcase-outline" size={64} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>أنشئ بروفايلك الآن</Text>
          <Text style={s.emptyDesc}>
            سجّل كسائق أو صاحب عمل للاستفادة من جميع مزايا قسم الوظائف
          </Text>
          <AppButton
            title="إنشاء بروفايل"
            onPress={() => router.push('/jobs/onboarding')}
            style={s.mainBtn}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <AppHeader title="لوحة التحكم" showBack variant="jobs" />

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? Colors.primary : Colors.textMuted}
            />
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {isDriver && !verification?.status && (
          <VerificationBanner />
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Greeting */}
            <Text style={s.greeting}>
              مرحباً 👋 {isDriver 
              ? (driverProfile?.user?.displayName ?? driverProfile?.user?.username)
              : (employerProfile?.companyName ?? employerProfile?.user?.displayName ?? employerProfile?.user?.username)}
            </Text>

            {/* Stats Row */}
            <View style={s.statsRow}>
              {isDriver ? (
                <>
                  <StatCard
                    icon="document-text-outline"
                    label="طلباتي"
                    value={myApplications?.length ?? 0}
                  />
                  <StatCard
                    icon="star-outline"
                    label="تقييمي"
                    value={driverProfile?.averageRating ? `${driverProfile.averageRating.toFixed(1)}★` : 'لا يوجد'}
                    color="#f59e0b"
                  />
                  <StatCard
                    icon="shield-checkmark-outline"
                    label="التوثيق"
                    value={verification?.status === 'APPROVED' ? 'موثق ✅' : 'غير موثق'}
                    color={verification?.status === 'APPROVED' ? '#16a34a' : Colors.error}
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon="briefcase-outline"
                    label="إعلاناتي"
                    value={myJobs?.items?.length ?? 0}
                  />
                  <StatCard
                    icon="people-outline"
                    label="المتقدمون"
                    value={myJobs?.items?.reduce((acc: number, j: any) => acc + (j.applicantsCount ?? 0), 0) ?? 0}
                  />
                  <StatCard
                    icon="checkmark-circle-outline"
                    label="النشطة"
                    value={myJobs?.items?.filter((j: any) => j.status === 'ACTIVE').length ?? 0}
                    color="#16a34a"
                  />
                </>
              )}
            </View>

            {/* Quick Actions */}
            <Text style={s.sectionTitle}>إجراءات سريعة</Text>
            <View style={s.quickActions}>
              {isDriver && (
                <>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/jobs')} activeOpacity={0.8}>
                    <Ionicons name="search-outline" size={22} color={Colors.primary} />
                    <Text style={s.actionText}>تصفح الوظائف</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/jobs/verification')} activeOpacity={0.8}>
                    <Ionicons name="shield-outline" size={22} color={Colors.primary} />
                    <Text style={s.actionText}>توثيق الحساب</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => setActiveTab('applications')} activeOpacity={0.8}>
                    <Ionicons name="time-outline" size={22} color={Colors.primary} />
                    <Text style={s.actionText}>طلباتي</Text>
                  </TouchableOpacity>
                </>
              )}
              {isEmployer && (
                <>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/jobs/create')} activeOpacity={0.8}>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                    <Text style={s.actionText}>نشر وظيفة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/jobs/drivers')} activeOpacity={0.8}>
                    <Ionicons name="people-outline" size={22} color={Colors.primary} />
                    <Text style={s.actionText}>دليل السائقين</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => setActiveTab('listings')} activeOpacity={0.8}>
                    <Ionicons name="list-outline" size={22} color={Colors.primary} />
                    <Text style={s.actionText}>إعلاناتي</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {/* ── LISTINGS TAB ── */}
        {activeTab === 'listings' && isEmployer && (
          <>
            <View style={s.tabHeader}>
              <Text style={s.sectionTitle}>إعلاناتي المنشورة</Text>
              <TouchableOpacity onPress={() => router.push('/jobs/create')} activeOpacity={0.8}>
                <View style={s.addBtn}>
                  <Ionicons name="add" size={18} color={Colors.primary} />
                  <Text style={s.addBtnText}>نشر وظيفة</Text>
                </View>
              </TouchableOpacity>
            </View>
            {jobsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (myJobs?.items?.length ?? 0) === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
                <Text style={s.emptyStateText}>لم تنشر أي وظيفة بعد</Text>
                <AppButton
                  title="نشر أول وظيفة"
                  onPress={() => router.push('/jobs/create')}
                  style={{ marginTop: Spacing.space4 }}
                />
              </View>
            ) : myJobs?.items?.map((job: any) => (
              <JobCard
                key={job.id ?? job._id}
                job={job}
                onPress={() => router.push(`/jobs/${job.id ?? job._id}`)}
              />
            ))}
          </>
        )}

        {/* ── APPLICATIONS TAB ── */}
        {activeTab === 'applications' && isDriver && (
          <>
            <Text style={s.sectionTitle}>طلبات التوظيف المُقدَّمة</Text>
            {appsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (myApplications?.length ?? 0) === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
                <Text style={s.emptyStateText}>لم تتقدم لأي وظيفة بعد</Text>
                <AppButton
                  title="تصفح الوظائف"
                  onPress={() => router.push('/jobs')}
                  style={{ marginTop: Spacing.space4 }}
                />
              </View>
            ) : myApplications?.map((app: any) => (
              <ProposalCard
                key={app.id ?? app._id}
                application={app}
                isJobOwner={false}
                isOwnProposal={true}
                isAuthenticated={true}
              />
            ))}
          </>
        )}

      </ScrollView>
    </View>
  )
}

const stat = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.space3, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18,
    color: Colors.text, textAlign: 'center',
  },
  label: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11,
    color: Colors.text2, textAlign: 'center', marginTop: 2,
  },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.space6,
  },
  emptyIllustration: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space4,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 20,
    color: Colors.text, textAlign: 'center', marginBottom: Spacing.space2,
  },
  emptyDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, textAlign: 'center', lineHeight: 22,
    marginBottom: Spacing.space4,
  },
  mainBtn: {},

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.space3, gap: Spacing.space1,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.textMuted,
  },
  tabTextActive: { color: Colors.primary },

  content: { padding: Spacing.space4, paddingBottom: 100 },
  greeting: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 20,
    color: Colors.text, textAlign: 'right',
    marginBottom: Spacing.space4,
  },
  statsRow: {
    flexDirection: 'row', gap: 10,
    marginBottom: Spacing.space5,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16,
    color: Colors.text, textAlign: 'right',
    marginBottom: Spacing.space3,
  },
  quickActions: {
    flexDirection: 'row', gap: 10,
    marginBottom: Spacing.space5,
  },
  actionBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.space3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, gap: 6,
  },
  actionText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11,
    color: Colors.text, textAlign: 'center',
  },
  tabHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.space3,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    paddingVertical: 6, paddingHorizontal: Spacing.space3,
    backgroundColor: Colors.primary + '15',
    borderRadius: Radius.pill,
  },
  addBtnText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center', padding: Spacing.space6, marginTop: Spacing.space5,
  },
  emptyStateText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15,
    color: Colors.textMuted, marginTop: Spacing.space3, textAlign: 'center',
  },
})
