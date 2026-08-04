import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface ListingBannerProps {
  listing: {
    id: string
    title: string
    price?: number
    currency?: string
    images?: { url: string }[]
    listingType?: 'SALE' | 'RENTAL' | 'WANTED'
    condition?: 'NEW' | 'USED' | 'LIKE_NEW'
    governorate?: string
    isPriceNegotiable?: boolean
    make?: string
    model?: string
    year?: number
  }
  onPress: () => void
  onClose?: () => void
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function fmtPrice(price?: number, currency?: string): string {
  if (!price) return 'تواصل للسعر'
  const sym = currency === 'OMR' || !currency ? 'ر.ع' : currency
  return `${Number(price).toLocaleString('en-US')} ${sym}`
}

const TYPE_CONFIG: Record<string, { label: string; bg: string }> = {
  SALE:   { label: 'للبيع',    bg: '#3b82f6' },
  RENTAL: { label: 'للإيجار', bg: '#d97706' },
  WANTED: { label: 'مطلوب',   bg: '#64748b' },
}

const COND_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  NEW:      { label: 'جديد',      bg: '#eff6ff', color: '#2563eb' },
  LIKE_NEW: { label: 'شبه جديد', bg: '#ecfdf5', color: '#059669' },
  USED:     { label: 'مستعمل',   bg: '#f1f5f9', color: '#475569' },
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export const ListingBanner: React.FC<ListingBannerProps> = ({
  listing,
  onPress,
  onClose,
}) => {
  const imgUrl = listing.images?.[0]?.url ?? null
  const price = fmtPrice(listing.price, listing.currency)
  const typeInfo = TYPE_CONFIG[listing.listingType ?? 'SALE'] ?? TYPE_CONFIG.SALE
  const condInfo = listing.condition ? COND_CONFIG[listing.condition] : null

  // Build secondary subtitle (e.g. "2022 • مسقط" or "جديد")
  const metaParts: string[] = []
  if (listing.year) metaParts.push(String(listing.year))
  if (listing.make && !listing.title?.includes(listing.make)) metaParts.push(listing.make)
  if (listing.governorate) metaParts.push(listing.governorate)
  if (condInfo) metaParts.push(condInfo.label)
  if (listing.isPriceNegotiable) metaParts.push('قابل للتفاوض')
  const metaText = metaParts.slice(0, 2).join(' • ')

  return (
    <View style={s.wrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
        style={s.card}
      >
        {/* ── 1. Thumbnail + Type Badge (Right in RTL) ── */}
        <View style={s.thumbWrapper}>
          {imgUrl ? (
            <Image
              source={{ uri: imgUrl }}
              style={s.thumbImg}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={s.thumbFallback}>
              <Ionicons name="car-sport-outline" size={24} color="#94a3b8" />
            </View>
          )}

          {/* Type Badge Overlay */}
          <View style={[s.typeBadge, { backgroundColor: typeInfo.bg }]}>
            <Text style={s.typeBadgeText}>{typeInfo.label}</Text>
          </View>
        </View>

        {/* ── 2. Content Info Column (Middle) ── */}
        <View style={s.content}>
          <Text style={s.title} numberOfLines={1}>
            {listing.title || 'إعلان بدون عنوان'}
          </Text>

          <View style={s.priceRow}>
            <Text style={s.priceText} numberOfLines={1}>
              {price}
            </Text>
          </View>

          {metaText ? (
            <Text style={s.metaText} numberOfLines={1}>
              {metaText}
            </Text>
          ) : null}
        </View>

        {/* ── 3. Actions Column (Left in RTL) ── */}
        <View style={s.actionsCol}>
          {onClose && (
            <TouchableOpacity
              style={s.closeBtn}
              onPress={(e) => {
                e.stopPropagation()
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onClose()
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="إغلاق كرت الإعلان"
            >
              <Ionicons name="close" size={13} color="#94a3b8" />
            </TouchableOpacity>
          )}

          <View style={s.ctaButton}>
            <Text style={s.ctaText}>عرض</Text>
            <Ionicons name="chevron-back" size={12} color="#ffffff" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ── Thumbnail ──
  thumbWrapper: {
    width: 62,
    height: 62,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 8.5,
    color: '#ffffff',
    includeFontPadding: false,
  },

  // ── Content ──
  content: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0f172a',
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priceText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  metaText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 15,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },

  // ── Actions ──
  actionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    paddingVertical: 1,
  },
  closeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 2,
  },
  ctaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: '#ffffff',
    includeFontPadding: false,
  },
})
