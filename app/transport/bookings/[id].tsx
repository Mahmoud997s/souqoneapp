import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../../src/api/transport';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Colors } from '../../../src/constants/colors';
import { Radius } from '../../../src/constants/radius';
import { useAuthStore } from '../../../src/store/authStore';
import { chatApi } from '../../../src/api/chat';
import { getBookingStatusLabel } from '../../../src/constants/transport';
import { dialogService } from '../../../src/store/dialogStore'

const STATUS_ORDER = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];


export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await transportApi.getBooking(id as string);
      return res.data;
    },
    enabled: !!id,
  });

  const startMutation = useMutation({
    mutationFn: () => transportApi.markInProgress(id as string),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); },
  });

  const completeMutation = useMutation({
    mutationFn: () => transportApi.completeBooking(id as string),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); },
  });

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingTxt}>جاري تحميل تفاصيل الحجز...</Text>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر العثور على الحجز</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isShipper = user?.id === booking.shipperId;
  const isCarrier = user?.id === booking.carrier?.userId;
  const otherParty = isShipper ? booking.carrier?.user : booking.shipper;
  const otherPartyName = isShipper ? (booking.carrier?.companyName || otherParty?.displayName || 'الناقل') : (otherParty?.displayName || 'العميل');

  const handleStart = () => {
    dialogService.confirm(
      'بدء الرحلة',
      'هل بدأت بالتحرك بالبضاعة؟',
      () => startMutation.mutate(),
      'نعم، انطلقت',
      'لا',
    );
  };

  const handleComplete = () => {
    dialogService.confirm(
      'إتمام الرحلة',
      'هل وصلت وتم تسليم البضاعة بنجاح؟',
      () => completeMutation.mutate(),
      'نعم، تم التسليم',
      'لا',
    );
  };

  const handleChat = async () => {
    if (!otherParty) return;
    try {
      const res = await chatApi.createRoom({
        entityType: 'TRANSPORT_BOOKING',
        entityId: booking.id,
        receiverId: otherParty.id,
      });
      if (res.data?.id) {
        router.push(`/chat/${res.data.id}` as any);
      }
    } catch (e: any) {
      dialogService.alert('خطأ', 'تعذر فتح المحادثة');
    }
  };

  const currentStatusIndex = STATUS_ORDER.indexOf(booking.status);

  return (
    <View style={s.root}>
      <AppHeader title="تفاصيل الحجز" showBack />
      
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Status Timeline */}
        <View style={s.card}>
          <Text style={s.cardTitle}>حالة الرحلة</Text>
          {booking.status === 'CANCELLED' ? (
            <View style={s.cancelledBox}>
              <Ionicons name="close-circle" size={32} color={Colors.error} />
              <Text style={s.cancelledTxt}>تم إلغاء هذا الحجز</Text>
              {booking.cancellationReason && (
                <Text style={s.cancelledReason}>السبب: {booking.cancellationReason}</Text>
              )}
            </View>
          ) : (
            <View style={s.timeline}>
              {STATUS_ORDER.map((status, index) => {
                const isActive = index <= currentStatusIndex && currentStatusIndex !== -1;
                const isCurrent = index === currentStatusIndex;
                return (
                  <View key={status} style={s.timelineStep}>
                    <View style={s.timelineIconWrap}>
                      <View style={[s.timelineDot, isActive && s.timelineDotActive, isCurrent && s.timelineDotCurrent]}>
                        {isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      {index < STATUS_ORDER.length - 1 && (
                        <View style={[s.timelineLine, isActive && index < currentStatusIndex && s.timelineLineActive]} />
                      )}
                    </View>
                    <View style={s.timelineContent}>
                      <Text style={[s.timelineTxt, isActive && s.timelineTxtActive]}>{getBookingStatusLabel(status)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Route Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>مسار الرحلة</Text>
          <View style={s.routeWrap}>
            <View style={s.routeItem}>
              <Ionicons name="location" size={24} color="#16a34a" />
              <View style={s.routeInfo}>
                <Text style={s.routeLabel}>من (الانطلاق)</Text>
                <Text style={s.routeGov}>{booking.request?.fromGovernorate}</Text>
              </View>
            </View>
            <View style={s.routeLine} />
            <View style={s.routeItem}>
              <Ionicons name="location" size={24} color="#d97706" />
              <View style={s.routeInfo}>
                <Text style={s.routeLabel}>إلى (الوجهة)</Text>
                <Text style={s.routeGov}>{booking.request?.toGovernorate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pricing & details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>التكلفة المتفق عليها</Text>
          <View style={s.priceBox}>
            <Ionicons name="cash-outline" size={32} color={Colors.primary} />
            <Text style={s.priceTxt}>{booking.quote?.price} ر.ع.</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>رقم الطلب</Text>
            <Text style={s.detailValue}>{booking.request?.id.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>تاريخ الحجز</Text>
            <Text style={s.detailValue}>{new Date(booking.createdAt).toLocaleDateString('ar-OM')}</Text>
          </View>
        </View>

        {/* Other Party Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{isShipper ? 'بيانات الناقل' : 'بيانات العميل'}</Text>
          <View style={s.partyRow}>
            <View style={s.partyAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={s.partyInfo}>
              <Text style={s.partyName}>{otherPartyName}</Text>
              {otherParty?.phone && <Text style={s.partyPhone}>{otherParty.phone}</Text>}
            </View>
          </View>
          <View style={s.partyActions}>
            <TouchableOpacity style={s.partyBtn} onPress={handleChat}>
              <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
              <Text style={s.partyBtnTxt}>مراسلة</Text>
            </TouchableOpacity>
            {otherParty?.phone && (
              <TouchableOpacity style={s.partyBtn} onPress={() => Linking.openURL(`tel:${otherParty.phone}`)}>
                <Ionicons name="call" size={20} color={Colors.primary} />
                <Text style={s.partyBtnTxt}>اتصال</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Carrier Actions */}
      {isCarrier && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {booking.status === 'ACCEPTED' && (
            <TouchableOpacity style={s.actionBtn} onPress={handleStart} disabled={startMutation.isPending}>
              <Ionicons name="play-circle-outline" size={20} color="#fff" />
              <Text style={s.actionBtnTxt}>{startMutation.isPending ? 'جاري التحديث...' : 'بدء الرحلة الآن'}</Text>
            </TouchableOpacity>
          )}
          {booking.status === 'IN_PROGRESS' && (
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#16a34a' }]} onPress={handleComplete} disabled={completeMutation.isPending}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.actionBtnTxt}>{completeMutation.isPending ? 'جاري التحديث...' : 'تم الوصول والتسليم'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Shipper Actions - Add Review if completed */}
      {isShipper && booking.status === 'COMPLETED' && (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push(`/reviews/${booking.carrier?.userId}?type=USER` as any)}>
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={s.actionBtnTxt}>تقييم الناقل</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#64748b' },
  errorTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: '#0f172a' },
  backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  backBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#fff' },

  content: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#0f172a', marginBottom: 16, writingDirection: 'rtl', textAlign: 'right' },

  timeline: { paddingRight: 8 },
  timelineStep: { flexDirection: 'row', minHeight: 60 },
  timelineIconWrap: { width: 30, alignItems: 'center' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineDotActive: { backgroundColor: Colors.primary },
  timelineDotCurrent: { borderWidth: 3, borderColor: '#bfdbfe' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#cbd5e1', position: 'absolute', top: 20, bottom: -10 },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineContent: { flex: 1, paddingRight: 16, paddingTop: 2 },
  timelineTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#64748b', textAlign: 'right' },
  timelineTxtActive: { color: '#0f172a' },

  cancelledBox: { alignItems: 'center', padding: 16, gap: 8, backgroundColor: '#fef2f2', borderRadius: Radius.md },
  cancelledTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.error },
  cancelledReason: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#b91c1c', textAlign: 'center' },

  routeWrap: { backgroundColor: '#f8fafc', padding: 16, borderRadius: Radius.md, gap: 12 },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeInfo: { flex: 1 },
  routeLabel: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: '#64748b', textAlign: 'left' },
  routeGov: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#0f172a', textAlign: 'left' },
  routeLine: { width: 2, height: 24, backgroundColor: '#e2e8f0', marginLeft: 11, marginVertical: -8 },

  priceBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0f9ff', padding: 16, borderRadius: Radius.md, marginBottom: 16, justifyContent: 'center' },
  priceTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 24, color: Colors.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailLabel: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#64748b' },
  detailValue: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#0f172a' },

  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  partyAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  partyInfo: { flex: 1 },
  partyName: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#0f172a', textAlign: 'left' },
  partyPhone: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'left' },
  partyActions: { flexDirection: 'row', gap: 12 },
  partyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  partyBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: Radius.md, backgroundColor: Colors.primary },
  actionBtnTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#fff' },
});
