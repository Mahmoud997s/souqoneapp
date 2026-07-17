import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Image
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { JobCard } from '../../src/components/cards/JobCard'
import { ProposalCard } from '../../src/components/cards/ProposalCard'
import VerificationBanner from '../../src/components/jobs/VerificationBanner'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useMyJobs, useMyApplications } from '../../src/hooks/useJobsDashboard'
import { useMyDriverProfile } from '../../src/hooks/useDriverProfile'
import { useMyEmployerProfile } from '../../src/hooks/useEmployerProfile'
import { useVerificationStatus } from '../../src/hooks/useVerification'
import { useJobProfileStore } from '../../src/store/jobProfileStore'

import { DASHBOARD_TABS } from '../../src/constants/jobs'

type TabId = 'overview' | 'listings' | 'applications'

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string | number; color?: string
}) {
  return (
    <View style={stat.card}>
      <View style={[stat.iconBox, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
        <Ionicons name={icon as any} size={22} color={color ?? Colors.primary} />
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

  const { data: driverProfile } = useMyDriverProfile()
  const { data: employerProfile } = useMyEmployerProfile()
  const { data: verification, refetch: refetchVerification } = useVerificationStatus()
  const { data: myJobs, isLoading: jobsLoading, refetch: refetchJobs } = useMyJobs()
  const { data: myApplications, isLoading: appsLoading, refetch: refetchApps } = useMyApplications()

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchJobs(), refetchApps(), refetchVerification()])
    setRefreshing(false)
  }

  const isDriver = activeRole === 'driver'
  const isEmployer = activeRole === 'employer'

  const userName = isDriver 
    ? (driverProfile?.user?.displayName ?? driverProfile?.user?.username ?? 'مستخدم')
    : (employerProfile?.companyName ?? employerProfile?.user?.displayName ?? employerProfile?.user?.username ?? 'مستخدم')

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
          />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <AppHeader title="لوحة التحكم" showBack variant="jobs" />

      {/* Premium Segmented Control */}
      <View style={s.segmentedControl}>
        {DASHBOARD_TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <TouchableOpacity
              key={tab.id}
              style={[s.segmentBtn, isActive && s.segmentBtnActive]}
              onPress={() => setActiveTab(tab.id as TabId)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={isActive ? Colors.primary : Colors.textMuted}
              />
              <Text style={[s.segmentText, isActive && s.segmentTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {(!verification || verification.status?.toUpperCase() !== 'APPROVED') && (
          <View style={{ marginBottom: Spacing.space4 }}>
            <VerificationBanner status={verification?.status} rejectionReason={verification?.rejectionReason} />
          </View>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Premium Header Card */}
            <View style={s.headerCard}>
              <View style={s.headerCardContent}>
                <View>
                  <Text style={s.greetingText}>مرحباً بك،</Text>
                  <Text style={s.userNameText}>{userName}</Text>
                </View>
                <View style={s.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={Colors.primary} />
                </View>
              </View>
            </View>

            {/* Quick Actions - Grid Style */}
            <Text style={s.sectionTitle}>الوصول السريع</Text>
            <View style={s.quickActionsGrid}>
              {isDriver && (
                <>
                  <TouchableOpacity style={s.gridActionBtn} onPress={() => router.push('/jobs')} activeOpacity={0.8}>
                    <View style={[s.gridActionIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="search" size={26} color="#3B82F6" />
                    </View>
                    <Text style={s.gridActionText}>الوظائف</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.gridActionBtn} onPress={() => router.push('/jobs/verification')} activeOpacity={0.8}>
                    <View style={[s.gridActionIcon, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="shield-checkmark" size={26} color="#EF4444" />
                    </View>
                    <Text style={s.gridActionText}>التوثيق</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.gridActionBtn} onPress={() => setActiveTab('applications')} activeOpacity={0.8}>
                    <View style={[s.gridActionIcon, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="document-text" size={26} color="#22C55E" />
                    </View>
                    <Text style={s.gridActionText}>طلباتي</Text>
                  </TouchableOpacity>
                </>
              )}
              {isEmployer && (
                <>
                  <TouchableOpacity style={s.gridActionBtn} onPress={() => router.push('/jobs/create')} activeOpacity={0.8}>
                    <View style={[s.gridActionIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="add-circle" size={26} color="#3B82F6" />
                    </View>
                    <Text style={s.gridActionText}>نشر وظيفة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.gridActionBtn} onPress={() => router.push('/jobs/drivers')} activeOpacity={0.8}>
                    <View style={[s.gridActionIcon, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="people" size={26} color="#EF4444" />
                    </View>
                    <Text style={s.gridActionText}>السائقين</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.gridActionBtn} onPress={() => setActiveTab('listings')} activeOpacity={0.8}>
                    <View style={[s.gridActionIcon, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="list" size={26} color="#22C55E" />
                    </View>
                    <Text style={s.gridActionText}>إعلاناتي</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Stats Row */}
            <Text style={s.sectionTitle}>إحصائيات حسابك</Text>
            <View style={s.statsRow}>
              {isDriver ? (
                <>
                  <StatCard
                    icon="briefcase"
                    label="الطلبات المُقدمة"
                    value={myApplications?.length ?? 0}
                  />
                  <StatCard
                    icon="star"
                    label="متوسط التقييم"
                    value={driverProfile?.averageRating ? `${driverProfile.averageRating.toFixed(1)}` : '0.0'}
                    color="#F59E0B"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon="megaphone"
                    label="إعلانات نشطة"
                    value={myJobs?.items?.filter((j: any) => j.status === 'ACTIVE').length ?? 0}
                    color="#22C55E"
                  />
                  <StatCard
                    icon="people"
                    label="المتقدمون الكلي"
                    value={myJobs?.items?.reduce((acc: number, j: any) => acc + (j.applicantsCount ?? 0), 0) ?? 0}
                    color="#3B82F6"
                  />
                </>
              )}
            </View>
          </>
        )}

        {/* ── LISTINGS TAB ── */}
        {activeTab === 'listings' && (
          <>
            <View style={s.tabHeader}>
              <Text style={s.sectionTitle}>إعلاناتي المنشورة</Text>
              <TouchableOpacity onPress={() => router.push('/jobs/create')} activeOpacity={0.8}>
                <View style={s.addBtn}>
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={s.addBtnText}>وظيفة جديدة</Text>
                </View>
              </TouchableOpacity>
            </View>
            {jobsLoading ? (
              <SkeletonCard />
            ) : (myJobs?.items?.length ?? 0) === 0 ? (
              <View style={s.emptyState}>
                <View style={s.emptyIconContainer}>
                  <Ionicons name="folder-open-outline" size={42} color={Colors.primary} />
                </View>
                <Text style={s.emptyStateText}>لم تقم بنشر أي وظيفة حتى الآن</Text>
                <AppButton
                  title="نشر أول وظيفة"
                  onPress={() => router.push('/jobs/create')}
                  variant="outline"
                  style={{ marginTop: Spacing.space5, paddingHorizontal: 30, borderRadius: 100 }}
                  textStyle={{ fontSize: 14 }}
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
        {activeTab === 'applications' && (
          <>
            <Text style={s.sectionTitle}>طلبات التوظيف الخاصة بي</Text>
            {appsLoading ? (
              <SkeletonCard />
            ) : (myApplications?.length ?? 0) === 0 ? (
              <View style={s.emptyState}>
                <View style={s.emptyIconContainer}>
                  <Ionicons name="document-text-outline" size={42} color={Colors.primary} />
                </View>
                <Text style={s.emptyStateText}>لم تتقدم لأي وظيفة بعد</Text>
                <AppButton
                  title="تصفح الوظائف المتاحة"
                  onPress={() => router.push('/jobs')}
                  variant="outline"
                  style={{ marginTop: Spacing.space5, paddingHorizontal: 30, borderRadius: 100 }}
                  textStyle={{ fontSize: 14 }}
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
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.space4, alignItems: 'flex-start', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  value: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 22,
    color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
  },
  label: {
    fontFamily: 'Almarai_400Regular', fontSize: 12,
    color: Colors.textMuted, textAlign: 'left', writingDirection: 'rtl', marginTop: 4,
  },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
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
    fontFamily: 'Almarai_800ExtraBold', fontSize: 20,
    color: Colors.text, textAlign: 'center', marginBottom: Spacing.space2,
  },
  emptyDesc: {
    fontFamily: 'Almarai_400Regular', fontSize: 14,
    color: Colors.textMuted, textAlign: 'center', lineHeight: 22,
    marginBottom: Spacing.space5,
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.pill,
    padding: 4,
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: Radius.pill, gap: Spacing.space2,
  },
  segmentBtnActive: { 
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  segmentText: {
    fontFamily: 'Almarai_700Bold', fontSize: 13,
    color: Colors.textMuted,
  },
  segmentTextActive: { color: Colors.primary },

  content: { padding: Spacing.space4, paddingBottom: 120 },

  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.space5,
    marginBottom: Spacing.space6,
    shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  headerCardContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greetingText: {
    fontFamily: 'Almarai_400Regular', fontSize: 14,
    color: 'rgba(255,255,255,0.8)', textAlign: 'left', writingDirection: 'rtl', marginBottom: 4,
  },
  userNameText: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 20,
    color: Colors.white, textAlign: 'left', writingDirection: 'rtl',
  },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 16,
    color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
    marginBottom: Spacing.space4,
  },

  quickActionsGrid: {
    flexDirection: 'row', gap: Spacing.space3,
    marginBottom: Spacing.space6,
  },
  gridActionBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.space4, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  gridActionIcon: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  gridActionText: {
    fontFamily: 'Almarai_700Bold', fontSize: 12,
    color: Colors.text, textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row', gap: Spacing.space3,
    marginBottom: Spacing.space6,
  },

  tabHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.space4,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    paddingVertical: 8, paddingHorizontal: Spacing.space4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  addBtnText: {
    fontFamily: 'Almarai_700Bold', fontSize: 13,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center', padding: Spacing.space6, marginTop: Spacing.space4,
    backgroundColor: Colors.white, borderRadius: Radius.xl,
  },
  emptyIconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.space4,
  },
  emptyStateText: {
    fontFamily: 'Almarai_700Bold', fontSize: 15,
    color: Colors.textMuted, textAlign: 'center', lineHeight: 24, paddingTop: 4,
  },
})
