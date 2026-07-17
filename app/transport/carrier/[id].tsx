import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { transportApi } from '../../../src/api/transport'
import { AppHeader } from '../../../src/components/ui/AppHeader'

// ─── Constants ───────────────────────────────────────────────────────────────

const VEHICLE_LABELS: Record<string, string> = {
  PICKUP: 'بيك أب', VAN: 'فان', TRUCK_SMALL: 'شاحنة صغيرة', TRUCK_LARGE: 'شاحنة كبيرة',
  TRAILER: 'تريلر', EXCAVATOR: 'حفّار', TIPPER: 'قلّاب', CRANE: 'رافعة', OTHER: 'أخرى',
}
const SERVICE_LABELS: Record<string, string> = {
  GOODS: 'بضائع عامة', FURNITURE: 'أثاث ومنزليات', CONSTRUCTION: 'مواد البناء',
  HEAVY: 'شحن ثقيل', BACKLOAD: 'عودة فارغة', EQUIPMENT: 'معدات وآليات',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CarrierProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const { data: carrier, isLoading, isError } = useQuery({
    queryKey: ['carrier-profile', id],
    queryFn: async () => (await transportApi.getCarrier(id)).data,
    enabled: !!id,
  })

  if (isLoading) return <View style={[s.root, s.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>
  if (isError || !carrier) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل الملف الشخصي</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>رجوع</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const c = carrier as any
  const userName = c.user?.displayName ?? c.companyName ?? 'ناقل'

  return (
    <View style={s.root}>
      {/* Header */}
      <AppHeader title="ملف الناقل" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={s.profileCard}>
          <View style={s.avatarLarge}>
            <Text style={s.avatarText}>{userName.charAt(0)}</Text>
          </View>
          <Text style={s.name}>{userName}</Text>
          {c.companyName && c.user?.displayName && <Text style={s.company}>{c.companyName}</Text>}
          {c.bio && <Text style={s.bio}>{c.bio}</Text>}

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{c.completedTrips ?? 0}</Text>
              <Text style={s.statLabel}>رحلة مكتملة</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <View style={s.ratingRow}>
                <Ionicons name="star" size={14} color="#d97706" />
                <Text style={s.statValue}>{(c.averageRating ?? 0).toFixed(1)}</Text>
              </View>
              <Text style={s.statLabel}>التقييم</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <View style={[s.availDot, { backgroundColor: c.isAvailable ? '#16a34a' : '#dc2626' }]} />
              <Text style={s.statLabel}>{c.isAvailable ? 'متاح' : 'غير متاح'}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle types */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>المركبات</Text>
          <View style={s.chipsWrap}>
            {(c.vehicleTypes ?? []).map((v: string) => (
              <View key={v} style={s.chip}>
                <Text style={s.chipText}>{VEHICLE_LABELS[v] ?? v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Service types */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>الخدمات</Text>
          <View style={s.chipsWrap}>
            {(c.serviceTypes ?? []).map((st: string) => (
              <View key={st} style={s.chip}>
                <Text style={s.chipText}>{SERVICE_LABELS[st] ?? st}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location */}
        {(c.governorate || c.city) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>الموقع</Text>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={s.locationText}>{[c.governorate, c.city].filter(Boolean).join('، ')}</Text>
            </View>
          </View>
        )}

        {/* Contact */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>التواصل</Text>
          <View style={s.contactBtns}>
            {c.contactPhone && (
              <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`tel:${c.contactPhone}`)}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
                <Text style={s.contactBtnText}>اتصال</Text>
              </TouchableOpacity>
            )}
            {c.whatsapp && (
              <TouchableOpacity style={[s.contactBtn, { backgroundColor: '#dcfce7' }]} onPress={() => Linking.openURL(`whatsapp://send?phone=${c.whatsapp.replace('+', '')}`)}>
                <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
                <Text style={[s.contactBtnText, { color: '#16a34a' }]}>واتساب</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, marginTop: 12, fontSize: 16 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.md },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff' },

  profileCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: Radius.lg, padding: 24, alignItems: 'center', gap: 8,
    ...Platform.select({ ios: { shadowColor: '#0B2447', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 3 } }),
  },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 28, color: Colors.primary },
  name: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, marginTop: 8 },
  company: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2 },
  bio: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2, textAlign: 'center', lineHeight: 22, marginTop: 4 },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', width: '100%' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text },
  statLabel: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: '#f3f4f6' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDot: { width: 12, height: 12, borderRadius: 6 },

  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 14, color: Colors.text, marginBottom: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: '#f0f5ff', borderWidth: 1, borderColor: '#e0e7ff' },
  chipText: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text },

  contactBtns: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: Radius.md, backgroundColor: '#EFF6FF' },
  contactBtnText: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.primary },
})
