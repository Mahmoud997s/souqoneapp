import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { transportApi } from '../../../src/api/transport';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Colors } from '../../../src/constants/colors';
import { Radius } from '../../../src/constants/radius';
import { formatLocation, resolveLocationGov } from '../../../src/utils/mappers';
import { getServiceLabel, getVehicleTypeLabel } from '../../../src/constants/transport';
import { VerificationBadge } from '../../../src/components/jobs/VerificationBadge';
import { getInitials, getAvatarColor } from '../../../src/utils/format';
import { useAuthStore } from '../../../src/store/authStore';

export default function CarrierProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['carrier-profile', id],
    queryFn: async () => {
      const res = await transportApi.getCarrier(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const handleCall = () => {
    if (profile?.contactPhone) Linking.openURL(`tel:${profile.contactPhone}`);
  };

  const handleWhatsApp = () => {
    if (profile?.whatsapp) {
      const msg = "مرحباً، لقد رأيت ملفك كناقل في منصة سوق ون وأرغب بالتواصل معك.";
      Linking.openURL(`whatsapp://send?phone=${profile.whatsapp}&text=${encodeURIComponent(msg)}`);
    }
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <Text style={s.loadingText}>جاري تحميل بيانات الناقل...</Text>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorText}>تعذر العثور على بيانات الناقل</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.back()}>
          <Text style={s.btnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMyProfile = !!user?.id && (
    String(profile.userId) === String(user.id) || 
    String(profile.user?.id) === String(user.id) ||
    String((profile as unknown as any).user_id) === String(user.id)
  );

  return (
    <View style={s.root}>
      <AppHeader title="ملف الناقل" showBack />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Profile Info */}
        <View style={s.card}>
          <View style={s.avatarWrap}>
            {(profile.user?.avatarUrl || profile.user?.avatar) ? (
              <Image source={{ uri: profile.user.avatarUrl || profile.user.avatar }} style={s.avatarImage} />
            ) : (
              <View style={[s.avatarFallback, { backgroundColor: getAvatarColor(profile.userId) }]}>
                <Text style={s.avatarInitials}>{getInitials(profile.companyName || profile.user?.displayName || 'ناقل')}</Text>
              </View>
            )}
          </View>
          
          <View style={s.nameRow}>
            <Text style={s.name}>{profile.companyName || profile.user?.displayName || 'ناقل في سوق ون'}</Text>
            {(profile.isVerified || profile.user?.isVerified) && <VerificationBadge size={18} />}
          </View>
          
          <View style={s.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={s.rating}>{profile.averageRating ?? 'جديد'}</Text>
            <Text style={s.trips}>({profile.totalTrips ?? 0} رحلة)</Text>
            {profile.createdAt && (
              <Text style={s.memberSince}> • عضو منذ {new Date(profile.createdAt).getFullYear()}</Text>
            )}
          </View>

          <View style={s.tagsRow}>
            <View style={s.tag}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={s.tagText}>{formatLocation(profile as any) || 'موقع غير محدد'}</Text>
            </View>
            <View style={[s.tag, profile.isAvailable ? s.tagAvailable : s.tagBusy]}>
              <View style={[s.dot, profile.isAvailable ? { backgroundColor: '#10b981' } : { backgroundColor: '#ef4444' }]} />
              <Text style={[s.tagText, profile.isAvailable ? { color: '#047857' } : { color: '#b91c1c' }]}>
                {profile.isAvailable ? 'متاح للعمل' : 'مشغول'}
              </Text>
            </View>
          </View>

          {profile.bio && (
            <Text style={s.bio}>{profile.bio}</Text>
          )}
        </View>

        {/* Vehicle Types */}
        <Text style={s.sectionTitle}>المركبات المتوفرة</Text>
        <View style={s.card}>
          <View style={s.chipsWrap}>
            {profile.vehicleTypes?.map((vt: string) => (
              <View key={vt} style={s.chip}>
                <Ionicons name="car-outline" size={16} color={Colors.primary} />
                <Text style={s.chipText}>{getVehicleTypeLabel(vt)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Service Types */}
        <Text style={s.sectionTitle}>الخدمات المقدمة</Text>
        <View style={s.card}>
          <View style={s.chipsWrap}>
            {profile.serviceTypes?.map((st: string) => (
              <View key={st} style={s.chip}>
                <Ionicons name="cube-outline" size={16} color={Colors.primary} />
                <Text style={s.chipText}>{getServiceLabel(st)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Service Areas */}
        {profile.serviceAreas && profile.serviceAreas.length > 0 && (
          <>
            <Text style={s.sectionTitle}>مناطق الخدمة (التغطية)</Text>
            <View style={s.card}>
              <View style={s.chipsWrap}>
                {profile.serviceAreas.map((area: string) => (
                  <View key={area} style={s.chip}>
                    <Ionicons name="map-outline" size={16} color={Colors.primary} />
                    <Text style={s.chipText}>{resolveLocationGov(area)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}



      </ScrollView>

      {/* Action Footer */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isMyProfile ? (
          <TouchableOpacity 
            style={[s.actionBtn, s.editBtn, { width: '100%' }]} 
            onPress={() => router.push('/transport/carrier-dashboard')}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={s.actionBtnTxt}>تعديل ملفي كناقل</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[s.actionBtn, { backgroundColor: Colors.primary, flex: 1 }]} 
              onPress={() => router.push(`/transport/new?carrierId=${profile.id}` as any)}
            >
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={s.actionBtnTxtSmall}>طلب سعر</Text>
            </TouchableOpacity>

            {profile.contactPhone && (
              <TouchableOpacity style={[s.actionBtn, s.callBtn, { flex: 1 }]} onPress={handleCall}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={s.actionBtnTxtSmall}>اتصال</Text>
              </TouchableOpacity>
            )}

            {profile.whatsapp && (
              <TouchableOpacity style={[s.actionBtn, s.waBtn, { flex: 1 }]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={s.actionBtnTxtSmall}>واتساب</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingText: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#64748b' },
  errorText: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: '#0f172a' },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  btnText: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#fff' },

  content: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  avatarWrap: {
            width: 72, height: 72,
            borderRadius: 36,
            backgroundColor: '#f1f5f9',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            overflow: 'hidden',
          },
          avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
          avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
          avatarInitials: { fontFamily: 'Almarai_800ExtraBold', fontSize: 24, color: '#fff', paddingTop: 6 },
          nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
          name: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: '#0f172a' },
          ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
          rating: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#0f172a' },
          trips: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#64748b' },
          memberSince: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#94a3b8' },

  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f8fafc', borderRadius: 100, borderWidth: 1, borderColor: '#e2e8f0' },
  tagAvailable: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  tagBusy: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#475569' },

  bio: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14, color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    width: '100%',
  },

  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#0f172a', marginBottom: 12, textAlign: 'left', width: '100%' },
  
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', justifyContent: 'flex-start' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc', borderRadius: Radius.md, borderWidth: 1, borderColor: '#e2e8f0' },
  chipText: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#334155' },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.lg,
    gap: 6,
  },
  callBtn: { backgroundColor: '#0f172a' },
  waBtn: { backgroundColor: '#25D366' },
  editBtn: { backgroundColor: '#2f4b8bff' },
  actionBtnTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#fff' },
  actionBtnTxtSmall: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#fff' },

});
