import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { transportApi } from '../../src/api/transport'
import { TransportRequestCard } from '../../src/components/cards/TransportRequestCard'
import { useAuthStore } from '../../src/store/authStore'
import { AppHeader } from '../../src/components/ui/AppHeader'

// ─── Status tabs ─────────────────────────────────────────────────────────────

const TABS = [
  { key: '', label: 'الكل' },
  { key: 'OPEN', label: 'مفتوح' },
  { key: 'QUOTED', label: 'وصلت عروض' },
  { key: 'ACCEPTED', label: 'مقبول' },
  { key: 'IN_PROGRESS', label: 'جارٍ' },
  { key: 'COMPLETED', label: 'مكتمل' },
  { key: 'CANCELLED', label: 'ملغى' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function MyTransportRequests() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-transport-requests', activeTab],
    queryFn: async () => {
      const params: Record<string, unknown> = { userId: user?.id }
      if (activeTab) params.status = activeTab
      const res = await transportApi.getAll(params)
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data
      return Array.isArray(raw) ? raw : []
    },
    enabled: !!user,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => transportApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transport-requests'] })
    },
  })

  const handleCancel = (id: string) => {
    Alert.alert('إلغاء الطلب', 'هل أنت متأكد من إلغاء طلب النقل هذا؟', [
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
      <AppHeader 
        title="طلباتي" 
        showBack 
        rightSlot={
          <TouchableOpacity style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/transport/new' as any)}>
            <Ionicons name="add-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>
        }
      />

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
            <Ionicons name="document-outline" size={56} color={Colors.border} />
            <Text style={s.emptyTitle}>لا توجد طلبات</Text>
            <Text style={s.emptySubtitle}>أنشئ طلب نقل جديد للبدء</Text>
            <TouchableOpacity style={s.newBtn} onPress={() => router.push('/transport/new' as any)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.newBtnText}>طلب نقل جديد</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.cardWrap}>
            <TransportRequestCard
              item={item}
              onPress={() => router.push(`/transport/${item.id}` as any)}
            />
            {(item.status === 'OPEN' || item.status === 'QUOTED') && (
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => handleCancel(item.id)}
              >
                <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                <Text style={s.cancelText}>إلغاء الطلب</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Tabs
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  tabText: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text2 },
  tabTextActive: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary },

  // List
  list: { paddingVertical: 12 },
  cardWrap: { marginHorizontal: 16, marginBottom: 12, gap: 8 },

  // Cancel
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: '#fee2e2' },
  cancelText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.error },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text },
  emptySubtitle: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.textMuted },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md },
  newBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: '#fff' },

  // Login
  loginBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  loginBtnText: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#fff' },
})
