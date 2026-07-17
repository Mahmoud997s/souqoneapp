import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { GOVERNORATE_OPTIONS } from '../../constants/filters'

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث ومنزليات',
  CONSTRUCTION: 'مواد البناء',
  HEAVY: 'شحن ثقيل',
  BACKLOAD: 'عودة فارغة',
  EQUIPMENT: 'معدات وآليات',
}

const SERVICE_TYPE_ICONS: Record<string, any> = {
  GOODS: 'cube',
  FURNITURE: 'home',
  CONSTRUCTION: 'hammer',
  HEAVY: 'car',
  BACKLOAD: 'swap-horizontal',
  EQUIPMENT: 'construct',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  QUOTED: 'وصلت عروض',
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  EXPIRED: 'منتهي',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#16a34a',
  QUOTED: '#2563eb',
  ACCEPTED: '#d97706',
  IN_PROGRESS: '#7c3aed',
  COMPLETED: '#059669',
  CANCELLED: '#dc2626',
  EXPIRED: '#6b7280',
}

const GOV_LABELS: Record<string, string> = {
  OM_MUS: 'مسقط', OM_DHL: 'ظفار', OM_BAT: 'شمال الباطنة',
  OM_BSS: 'جنوب الباطنة', OM_DAK: 'الداخلية', OM_SHA: 'شمال الشرقية',
  OM_SHS: 'جنوب الشرقية', OM_ZAH: 'الظاهرة', OM_BUR: 'البريمي',
  OM_WUS: 'الوسطى', OM_MSN: 'مسندم',
}

function resolveGov(code: string): string {
  return GOV_LABELS[code] ?? code
}

function formatBudget(min: any, max: any): string {
  const minN = parseFloat(String(min ?? 0))
  const maxN = parseFloat(String(max ?? 0))
  if (minN > 0 && maxN > 0) return `${minN} - ${maxN} ر.ع.`
  if (minN > 0) return `من ${minN} ر.ع.`
  if (maxN > 0) return `حتى ${maxN} ر.ع.`
  return 'تواصل للسعر'
}

export interface TransportRequestItem {
  id: string
  serviceType: string
  status: string
  fromGovernorate: string
  fromCity?: string
  toGovernorate: string
  toCity?: string
  cargoDescription: string
  weightTons?: number | null
  budgetMin?: number | null
  budgetMax?: number | null
  currency?: string
  scheduledAt?: string | null
  isFlexible?: boolean
  _count?: { quotes: number }
  quotesCount?: number
  createdAt: string
  user?: any
}

interface Props {
  item: TransportRequestItem
  onPress?: () => void
  fullWidth?: boolean
  gridMode?: boolean
}

export function TransportRequestCard({ item, onPress, fullWidth = true, gridMode = false }: Props) {
  const [isFav, setIsFav] = useState(false)
  const isSellerVerified = item.user?.isVerified ?? false

  const serviceLabel = SERVICE_TYPE_LABELS[item.serviceType] ?? item.serviceType
  const serviceIcon  = SERVICE_TYPE_ICONS[item.serviceType] ?? 'cube'
  const statusLabel  = STATUS_LABELS[item.status] ?? item.status
  const statusColor  = STATUS_COLORS[item.status] ?? '#6b7280'
  
  const fromLabel = resolveGov(item.fromGovernorate) + (item.fromCity ? `، ${item.fromCity}` : '')
  const toLabel   = resolveGov(item.toGovernorate)   + (item.toCity   ? `، ${item.toCity}`   : '')
  const budget    = formatBudget(item.budgetMin, item.budgetMax)
  const title = `نقل ${serviceLabel} من ${resolveGov(item.fromGovernorate)}`

  return (
    <View style={[s.carCard, fullWidth && { width: '100%' }, gridMode && { width: '100%', flex: 1 }]}>
      <View style={s.imageContainer}>
        {/* Visual Placeholder resembling CarCard's Image Container */}
        <Pressable onPress={onPress} style={[s.carImagePlaceholder, fullWidth && { height: 180, aspectRatio: undefined }]}>
          <Ionicons name={serviceIcon} size={48} color={Colors.borderStrong} />
          <Text style={s.placeholderTxt}>{serviceLabel}</Text>
        </Pressable>
        
        {/* Favorite Button */}
        <TouchableOpacity style={s.favBtn} onPress={() => setIsFav(!isFav)} activeOpacity={0.8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#ef4444" : Colors.white} />
        </TouchableOpacity>

        {/* Badges Overlay */}
        <View style={s.badgesContainer}>
          <View style={[s.badge, { backgroundColor: statusColor }]}>
            <Text style={s.badgeTxt}>{statusLabel}</Text>
          </View>
          {item.weightTons ? (
            <View style={[s.badge, { backgroundColor: '#64748b' }]}>
              <Ionicons name="barbell" size={10} color={Colors.white} style={{ marginRight: 2 }} />
              <Text style={s.badgeTxt}>{item.weightTons} طن</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable onPress={onPress} style={s.carDetails}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[s.carTitle, { flex: 1 }]} numberOfLines={1}>{title}</Text>
          {isSellerVerified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
              <Text style={s.verifiedTxt}>عميل موثق</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={s.carPrice}>{budget}</Text>
          {item.isFlexible && (
            <Text style={s.negotiableTxt}>مرن للسعر</Text>
          )}
        </View>

        <View style={s.locationRow}>
          <Ionicons name="swap-horizontal-outline" size={12} color={Colors.textMuted} />
          <Text style={s.locationTxt} numberOfLines={1}>{fromLabel} <Text style={{color: Colors.primary}}>إلى</Text> {toLabel}</Text>
        </View>

        {/* Route Details similar to chips/meta in CarCard */}
        <View style={s.carMetaRow}>
          <Ionicons name={item.scheduledAt ? 'calendar-outline' : 'time-outline'} size={12} color={Colors.textMuted} />
          <Text style={s.carMetaTxt}>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString('ar-OM') : 'موعد مرن'}</Text>
          <Text style={s.carMetaDot}>•</Text>
          <Ionicons name="cube-outline" size={12} color={Colors.textMuted} />
          <Text style={s.carMetaTxt} numberOfLines={1}>{item.cargoDescription || 'شحنة غير مبينة'}</Text>
        </View>

      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  carCard: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
    borderWidth: 1, borderColor: Colors.border,
  },
  imageContainer: {
    position: 'relative',
  },
  carImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTxt: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, 
    fontSize: 14, color: Colors.textMuted, marginTop: 8,
  },
  favBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute', top: 8, left: 8, right: 44,
    flexDirection: 'row', gap: 4, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 2, paddingBottom: 2,
    fontSize: 10, color: Colors.white,
  },
  carDetails: {
    padding: Spacing.space3,
  },
  carTitle: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 4, paddingBottom: 4,
    fontSize: 14, color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E7F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 2, paddingBottom: 2,
    fontSize: 9, color: '#1877F2',
  },
  carPrice: {
    fontFamily: 'Almarai_800ExtraBold',  paddingTop: 4, paddingBottom: 4,
    fontSize: 14, color: Colors.primary, textAlign: 'left',
  },
  negotiableTxt: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4,
    fontSize: 10, color: '#10b981', backgroundColor: '#d1fae5', paddingHorizontal: 6, borderRadius: Radius.sm, overflow: 'hidden'
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted, writingDirection: 'rtl',
  },
  carMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.space2,
  },
  carMetaTxt: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted, maxWidth: '50%',
  },
  carMetaDot: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted, marginHorizontal: 2,
  },
})
