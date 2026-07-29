import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../src/api/transport';
import { useAuthStore } from '../../src/store/authStore';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { TransportRequestCard } from '../../src/components/transport/TransportRequestCard';
import { EditCarrierProfileModal } from '../../src/components/transport/EditCarrierProfileModal';
import { Colors } from '../../src/constants/colors';
import { Radius } from '../../src/constants/radius';

export default function CarrierDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  // Fetch Carrier Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-carrier-profile'],
    queryFn: async () => {
      const res = await transportApi.getMyCarrierProfile();
      return res.data;
    },
  });

  // Fetch Recommended Requests
  const { data: recommendations, isLoading: recommendationsLoading, refetch } = useQuery({
    queryKey: ['recommended-requests'],
    queryFn: async () => {
      // In a real app, this would send carrier's vehicle types or locations
      const res = await transportApi.getAll({ limit: 5, status: 'OPEN' });
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });

  // Toggle Availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) => transportApi.setAvailability(isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-carrier-profile'] });
    },
  });

  const isLoading = profileLoading || recommendationsLoading;

  if (!profile && !profileLoading) {
    return (
      <View style={s.center}>
        <Ionicons name="bus-outline" size={64} color={Colors.textMuted} />
        <Text style={s.title}>لست مسجلاً كناقل</Text>
        <Text style={s.subtitle}>يجب عليك التسجيل كناقل أولاً للوصول إلى لوحة التحكم.</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.push('/transport/carrier-register' as any)}>
          <Text style={s.btnText}>سجل الآن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAvailable = profile?.isAvailable ?? false;

  return (
    <View style={s.root}>
      <AppHeader title="لوحة تحكم الناقل" showBack />
      
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
      >
        {/* Top Status Card */}
        <View style={s.statusCard}>
          <View style={s.statusHeader}>
            <View style={s.statusInfo}>
              <Text style={s.statusTitle}>حالة التوفر</Text>
              <Text style={s.statusSub}>
                {isAvailable ? 'أنت متاح لاستقبال الطلبات الجديدة' : 'أنت غير متاح حالياً'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={(val) => toggleAvailabilityMutation.mutate(val)}
              trackColor={{ false: '#cbd5e1', true: Colors.primary + '80' }}
              thumbColor={isAvailable ? Colors.primary : '#f8fafc'}
              disabled={toggleAvailabilityMutation.isPending}
            />
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={s.statsGrid}>
          <View style={s.statBox}>
            <View style={[s.statIconWrap, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#16a34a" />
            </View>
            <Text style={s.statValue}>{profile?.averageRating ?? '0.0'}</Text>
            <Text style={s.statLabel}>التقييم العام</Text>
          </View>
          <View style={s.statBox}>
            <View style={[s.statIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="cube" size={24} color="#0284c7" />
            </View>
            <Text style={s.statValue}>{profile?.totalTrips ?? 0}</Text>
            <Text style={s.statLabel}>الرحلات المكتملة</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/transport' as any)}>
            <Ionicons name="search" size={20} color={Colors.primary} />
            <Text style={s.actionBtnTxt}>تصفح السوق</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={s.actionBtnTxt}>تعديل البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended Opportunities */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>فرص مقترحة لك</Text>
          <TouchableOpacity onPress={() => router.push('/transport' as any)}>
            <Text style={s.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        </View>

        {recommendations?.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="sad-outline" size={40} color="#94a3b8" />
            <Text style={s.emptyText}>لا توجد فرص مطابقة حالياً.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {recommendations?.map((item: any) => (
              <TransportRequestCard
                key={item.id}
                request={item}
                onPress={() => router.push(`/transport/${item.id}` as any)}
              />
            ))}
          </View>
        )}

      </ScrollView>

      {profile && (
        <EditCarrierProfileModal
          visible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          profile={profile}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: '#0f172a' },
  subtitle: { fontFamily: 'Almarai_400Regular', fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md, marginTop: 12 },
  btnText: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#fff' },
  
  content: { padding: 16 },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: { flex: 1, alignItems: 'flex-start' },
  statusTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#0f172a', marginBottom: 4, textAlign: 'left', writingDirection: 'rtl' },
  statusSub: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: '#64748b', textAlign: 'left', writingDirection: 'rtl' },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontFamily: 'Almarai_800ExtraBold', fontSize: 24, color: '#0f172a', marginBottom: 4 },
  statLabel: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#64748b' },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: '#0f172a' },
  seeAll: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyText: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#64748b' },

  list: { gap: 12 },
});
