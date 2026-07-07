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

const ROLES = [
  { key: 'shipper', label: 'كمُرسِل' },
  { key: 'carrier', label: 'كناقل' },
]

const STATUS_LABELS: Record<string, string> = { ACCEPTED: 'تم القبول', IN_PROGRESS: 'جارٍ التنفيذ', COMPLETED: 'مكتمل', CANCELLED: 'ملغى' }
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACCEPTED: { bg: '#fef3c7', text: '#d97706' },
  IN_PROGRESS: { bg: '#f3e8ff', text: '#7c3aed' },
  COMPLETED: { bg: '#dcfce7', text: '#16a34a' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [role, setRole] = useState<'shipper' | 'carrier'>('shipper')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings', role],
    queryFn: async () => {
      const res = await transportApi.myBookings({ role })
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      return Array.isArray(raw) ? raw : []
    },
    enabled: !!user,
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => transportApi.markInProgress(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-bookings'] }) },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => transportApi.completeBooking(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-bookings'] }) },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => transportApi.cancelBooking(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-bookings'] }) },
  })

  const handleStart = (id: string) => {
    Alert.alert('بدء النقل', 'هل بدأت رحلة النقل؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم، بدأت', onPress: () => startMutation.mutate(id) },
    ])
  }

  const handleComplete = (id: string) => {
    Alert.alert('إتمام النقل', 'هل تم التسليم بنجاح؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم، تم التسليم', onPress: () => completeMutation.mutate(id) },
    ])
  }

  const handleCancel = (id: string) => {
    Alert.alert('إلغاء الحجز', 'هل أنت متأكد من إلغاء هذا الحجز؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم، إلغاء', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
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
      <AppHeader title="حجوزاتي" showBack />

      {/* Role toggle */}
      <View style={s.roleBar}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[s.roleTab, role === r.key && s.roleTabActive]}
            onPress={() => setRole(r.key as 'shipper' | 'carrier')}
          >
            <Text style={[s.roleText, role === r.key && s.roleTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={data ?? []}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="clipboard-outline" size={56} color={Colors.border} />
            <Text style={s.emptyTitle}>لا توجد حجوزات</Text>
            <Text style={s.emptySubtitle}>{role === 'carrier' ? 'لم تقبل أي عروض بعد' : 'لم يتم قبول أي عرض على طلباتك بعد'}</Text>
          </View>
        }
        renderItem={({ item: b }) => {
          const statusColor = STATUS_COLORS[b.status] ?? STATUS_COLORS.ACCEPTED
          const isCarrier = role === 'carrier'
          return (
            <View style={s.bookingCard}>
              <View style={s.bookingTop}>
                <View>
                  <Text style={s.bookingPrice}>{b.quote?.price ?? '—'} ر.ع.</Text>
                  <Text style={s.bookingDate}>{new Date(b.createdAt).toLocaleDateString('ar-OM')}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[s.statusText, { color: statusColor.text }]}>{STATUS_LABELS[b.status] ?? b.status}</Text>
                </View>
              </View>

              {/* Route snippet */}
              {b.request && (
                <TouchableOpacity style={s.routeSnippet} onPress={() => router.push(`/transport/${b.requestId}` as any)}>
                  <View style={s.routeFrom}>
                    <Ionicons name="location" size={12} color="#16a34a" />
                    <Text style={s.routeText}>{b.request.fromGovernorate}</Text>
                  </View>
                  <Ionicons name="arrow-back" size={12} color={Colors.textMuted} />
                  <View style={s.routeFrom}>
                    <Ionicons name="location" size={12} color="#d97706" />
                    <Text style={s.routeText}>{b.request.toGovernorate}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Actions */}
              <View style={s.actions}>
                {b.status === 'ACCEPTED' && isCarrier && (
                  <TouchableOpacity style={s.startBtn} onPress={() => handleStart(b.id)}>
                    <Ionicons name="play-circle-outline" size={16} color="#fff" />
                    <Text style={s.startBtnText}>بدء النقل</Text>
                  </TouchableOpacity>
                )}
                {b.status === 'IN_PROGRESS' && isCarrier && (
                  <TouchableOpacity style={s.completeBtn} onPress={() => handleComplete(b.id)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={s.completeBtnText}>تم التسليم</Text>
                  </TouchableOpacity>
                )}
                {(b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS') && (
                  <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(b.id)}>
                    <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
                    <Text style={s.cancelText}>إلغاء</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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

  roleBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  roleTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md, backgroundColor: '#f3f4f6' },
  roleTabActive: { backgroundColor: Colors.primary },
  roleText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text2 },
  roleTextActive: { color: '#fff' },

  list: { paddingVertical: 12, paddingHorizontal: 16, gap: 12 },

  bookingCard: {
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, gap: 12,
    ...Platform.select({ ios: { shadowColor: '#0B2447', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingPrice: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.primary },
  bookingDate: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11 },

  routeSnippet: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', padding: 10, borderRadius: Radius.sm },
  routeFrom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text },

  actions: { flexDirection: 'row', gap: 8 },
  startBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: Radius.sm, backgroundColor: '#7c3aed' },
  startBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: '#fff' },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: Radius.sm, backgroundColor: '#16a34a' },
  completeBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: '#fff' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 40, borderRadius: Radius.sm, backgroundColor: '#fee2e2' },
  cancelText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.error },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.textMuted },

  loginBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  loginBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#fff' },
})
