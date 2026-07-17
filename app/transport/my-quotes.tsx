import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { transportApi } from '../../src/api/transport'
import { useAuthStore } from '../../src/store/authStore'
import { AppHeader } from '../../src/components/ui/AppHeader'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { key: '', label: 'الكل' },
  { key: 'PENDING', label: 'بانتظار' },
  { key: 'ACCEPTED', label: 'مقبول' },
  { key: 'REJECTED', label: 'مرفوض' },
  { key: 'WITHDRAWN', label: 'مسحوب' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706' },
  ACCEPTED: { bg: '#dcfce7', text: '#16a34a' },
  REJECTED: { bg: '#fee2e2', text: '#dc2626' },
  WITHDRAWN: { bg: '#f3f4f6', text: '#6b7280' },
}

const STATUS_LABELS: Record<string, string> = { PENDING: 'بانتظار الرد', ACCEPTED: 'مقبول', REJECTED: 'مرفوض', WITHDRAWN: 'مسحوب' }

// ─── Component ───────────────────────────────────────────────────────────────

export default function MyQuotesScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-quotes', activeTab],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (activeTab) params.status = activeTab
      const res = await transportApi.myQuotes(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      return Array.isArray(raw) ? raw : []
    },
    enabled: !!user,
  })

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => transportApi.withdrawQuote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-quotes'] }),
  })

  const handleWithdraw = (id: string) => {
    Alert.alert('سحب العرض', 'هل أنت متأكد من سحب هذا العرض؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: () => withdrawMutation.mutate(id) },
    ])
  }

  if (!user) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>يجب تسجيل الدخول</Text>
        <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/(auth)/login' as any)}>
          <Text style={s.loginBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <AppHeader title="عروضي المقدمة" showBack />

      {/* Tabs */}
      <FlatList
        horizontal
        data={TABS}
        keyExtractor={t => t.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsScroll}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      <FlatList
        data={data ?? []}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="pricetag-outline" size={56} color={Colors.border} />
            <Text style={s.emptyTitle}>لا توجد عروض</Text>
            <Text style={s.emptySubtitle}>تصفح طلبات النقل وقدّم عروضك</Text>
            <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/transport' as any)}>
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={s.browseBtnText}>تصفح الطلبات</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: q }) => {
          const statusColor = STATUS_COLORS[q.status] ?? STATUS_COLORS.PENDING
          return (
            <TouchableOpacity
              style={s.quoteCard}
              activeOpacity={0.8}
              onPress={() => q.requestId && router.push(`/transport/${q.requestId}` as any)}
            >
              <View style={s.quoteTop}>
                <View style={s.quoteInfo}>
                  <Text style={s.quotePrice}>{q.price} ر.ع.</Text>
                  {q.estimatedHours && <Text style={s.quoteHours}>{q.estimatedHours} ساعة</Text>}
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[s.statusText, { color: statusColor.text }]}>{STATUS_LABELS[q.status] ?? q.status}</Text>
                </View>
              </View>

              {q.message && <Text style={s.quoteMsg} numberOfLines={2}>{q.message}</Text>}

              {/* Request snippet */}
              {q.request && (
                <View style={s.requestSnippet}>
                  <Ionicons name="document-text-outline" size={14} color={Colors.text2} />
                  <Text style={s.snippetText} numberOfLines={1}>
                    {q.request.fromGovernorate} → {q.request.toGovernorate}
                  </Text>
                </View>
              )}

              <View style={s.quoteBottom}>
                <Text style={s.quoteDate}>{new Date(q.createdAt).toLocaleDateString('ar-OM')}</Text>
                {q.status === 'PENDING' && (
                  <TouchableOpacity style={s.withdrawBtn} onPress={() => handleWithdraw(q.id)}>
                    <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
                    <Text style={s.withdrawText}>سحب</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },

  tabsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  tabText: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.text2 },
  tabTextActive: { fontFamily: 'Almarai_700Bold',  color: Colors.primary },

  list: { paddingVertical: 12, paddingHorizontal: 16, gap: 12 },

  quoteCard: {
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, gap: 10,
    ...Platform.select({ ios: { shadowColor: '#0B2447', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  quoteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  quotePrice: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.primary },
  quoteHours: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.text2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontFamily: 'Almarai_700Bold',  fontSize: 11 },
  quoteMsg: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2, writingDirection: 'rtl', lineHeight: 20 },
  requestSnippet: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm },
  snippetText: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.text, flex: 1 },
  quoteBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteDate: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, backgroundColor: '#fee2e2' },
  withdrawText: { fontFamily: 'Almarai_700Bold',  fontSize: 11, color: Colors.error },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted },
  browseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md },
  browseBtnText: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#fff' },

  loginBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  loginBtnText: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#fff' },
})
