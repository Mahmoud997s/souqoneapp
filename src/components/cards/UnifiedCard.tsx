import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView, Platform, Linking } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { chatApi } from '../../api/chat'
import { useAuthStore } from '../../store/authStore'
import { LinearGradient } from 'expo-linear-gradient'
import { dialogService } from '../../store/dialogStore'
import { CardSystem } from '../../constants/cardSystem'

export interface UnifiedCardItem {
  id: string
  title: string
  price?: number
  priceText?: string
  priceLabel?: string
  currency?: string
  governorate?: string
  images: string[]
  category?: string
  listingType?: string
  condition?: string
  details?: { icon: string; value: string }[]
  description?: string
  raw?: any
  isPremium?: boolean
  isElite?: boolean
  isFavorite?: boolean
  isVerified?: boolean
  phoneNumber?: string
  whatsappNumber?: string
  href?: string
}

interface Props {
  item: UnifiedCardItem
  onPress?: () => void
  onFavorite?: () => void
  /** Horizontal compact layout — 100×100 thumbnail, content beside it */
  compact?: boolean
  /** Override image height for vertical cards (default: aspectRatio 4/3) */
  imageHeight?: number
}

const CATEGORY_ICONS: Record<string, any> = {
  cars: 'car-outline', buses: 'bus-outline',
  equipment: 'construct-outline', parts: 'settings-outline',
  services: 'build-outline', jobs: 'briefcase-outline',
  transport: 'cube-outline',
}

const TYPE_LABELS: Record<string, string> = {
  SALE: 'للبيع', RENTAL: 'للإيجار', WANTED: 'مطلوب',
  BUS_SALE: 'للبيع', BUS_RENT: 'للإيجار',
  EQUIPMENT_SALE: 'للبيع', EQUIPMENT_RENT: 'للإيجار', EQUIPMENT_WANTED: 'مطلوب',
  OPERATOR: 'مشغل معدات',
  PART: 'قطعة', SERVICE: 'خدمة',
  GOODS: 'بضائع', FURNITURE: 'أثاث', CONSTRUCTION: 'مواد بناء', HEAVY: 'شحن ثقيل', BACKLOAD: 'عودة فارغة',
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'جديد', LIKE_NEW: 'شبه جديد', USED: 'مستعمل',
  GOOD: 'جيد', FAIR: 'مقبول', POOR: 'ضعيف',
  REFURBISHED: 'مجدد',
}

function PriceText({ item }: { item: UnifiedCardItem }) {
  if (item.priceText) {
    return <Text style={styles.price}>{item.priceText}</Text>
  }
  if (item.price && item.price > 0) {
    return (
      <Text style={styles.price}>
        {item.price.toLocaleString('en-US')}
        {(item.currency === 'OMR' || item.currency === '?.?.' || !item.currency) ? ' ر.ع.' : ` ${item.currency}`}
        {item.priceLabel ? ` / ${item.priceLabel}` : ''}
      </Text>
    )
  }
  return <Text style={styles.priceContact}>تواصل للسعر</Text>
}

export function UnifiedCard({ item, onPress, onFavorite, compact = false, imageHeight }: Props) {
  const { user } = useAuthStore()
  const [isFav, setIsFav] = useState(item.isFavorite ?? false)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)

  const displayImages = item.images.slice(0, 5)
  const currentImg = displayImages[0]
  const isPremium = item.isPremium || item.isElite
  const condLabel = CONDITION_LABELS[item.condition?.toUpperCase() ?? '']
  const typeLabel = item.listingType ? TYPE_LABELS[item.listingType.toUpperCase()] : undefined

  const handlePress = () => {
    if (onPress) { onPress(); return }
    if (item.href) { router.push(item.href as any); return }
    const cat = item.category || 'listings'
    if (cat === 'operators') {
      router.push(`/equipment/operators/${item.id}` as any)
      return
    }
    const routeBase = cat === 'cars' || cat === 'real_estate' ? 'listings' : cat
    router.push(`/${routeBase}/${item.id}` as any)
  }

  const heartToggle = () => { setIsFav(!isFav); onFavorite?.() }

  // ── COMPACT (horizontal) ──────────────────────────────────────────────────
  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}
      >
        {/* Image — first child = RIGHT side in RTL */}
        <View style={styles.compactImg}>
          {currentImg ? (
            <Image source={{ uri: currentImg }} style={styles.img} contentFit="cover" />
          ) : (
            <View style={styles.imgFallback}>
              <Ionicons name={CATEGORY_ICONS[item.category ?? 'cars']} size={22} color={Colors.textMuted} />
            </View>
          )}
          <TouchableOpacity style={styles.compactHeart} onPress={heartToggle} hitSlop={8}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={14} color={isFav ? Colors.error : Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Content — second child = LEFT side in RTL */}
        <View style={styles.compactContent}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
              <Text style={[styles.compactTitle, { flex: 1 }]} numberOfLines={1}>{item.title}</Text>
              {item.isVerified && (
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
                  <Text style={styles.verifiedText}>عميل موثق</Text>
                </View>
              )}
            </View>
            {typeLabel ? (
              <View style={styles.compactTypePill}>
                <Text style={styles.compactTypeText}>{typeLabel}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.compactBottom}>
            <PriceText item={item} />
            {item.governorate ? (
              <View style={styles.compactLoc}>
                <Ionicons name="location-outline" size={12} color={Colors.text2} />
                <Text style={styles.compactLocText}>{item.governorate}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    )
  }

  // ── VERTICAL (default) ───────────────────────────────────────────────────
  const imgStyle = imageHeight
    ? [styles.imgWrapperFixed, { height: imageHeight }]
    : styles.imgWrapperRatio

  return (
    <View style={styles.card}>
      {/* IMAGE */}
      <View 
        style={imgStyle}
        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      >
        {displayImages.length > 0 ? (
          cardWidth > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
              >
                {displayImages.map((img, i) => (
                  <Pressable key={i} onPress={handlePress} style={{ width: cardWidth, height: '100%' }}>
                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              {displayImages.length > 1 && (
                <View style={styles.dotsWrapper}>
                  {displayImages.map((_, i) => (
                    <View key={i} style={[styles.dot, activeImgIdx === i && styles.activeDot]} />
                  ))}
                </View>
              )}
            </>
          ) : null
        ) : (
          <View style={styles.imgFallback}>
            <Ionicons name={CATEGORY_ICONS[item.category ?? 'cars']} size={28} color={Colors.textMuted} />
          </View>
        )}

        {isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color={Colors.white} />
            <Text style={styles.premiumText}>مميز</Text>
          </View>
        )}

        {typeLabel ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.heartBtn} onPress={heartToggle} hitSlop={8}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? Colors.error : Colors.white} />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <Pressable 
        onPress={handlePress} 
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>{item.title}</Text>
          {item.isVerified && (
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
              <Text style={styles.verifiedText}>عميل موثق</Text>
            </View>
          )}
        </View>

        {((item.details && item.details.length > 0) || condLabel) ? (
          <View style={styles.detailsRow}>
            {condLabel ? (
              <View style={[styles.detailPill, { backgroundColor: Colors.primary + '15' }]}>
                <Text style={[styles.detailText, { color: Colors.primary, fontFamily: 'Almarai_700Bold' }]}>{condLabel}</Text>
              </View>
            ) : null}
            {item.details?.slice(0, 3).map((d, idx) => (
              <View key={idx} style={styles.detailPill}>
                <Ionicons name={d.icon as any} size={12} color={Colors.text2} />
                <Text style={styles.detailText}>{d.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.priceLocationRow}>
          {item.governorate ? (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.locText}>{item.governorate}</Text>
            </View>
          ) : <View />}
          <PriceText item={item} />
        </View>

        {/* ── CARD ACTIONS ── */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity 
            style={styles.actionBtnCall}
            onPress={() => {
              const phone = item.phoneNumber || item.raw?.seller?.phone || item.raw?.user?.phone || item.raw?.phone
              if (phone) {
                Linking.openURL(`tel:${phone}`)
              } else {
                dialogService.alert('تنبيه', 'رقم الهاتف غير متوفر')
              }
            }}
          >
            <Ionicons name="call-outline" size={16} color={Colors.primary} />
            <Text style={styles.actionBtnCallText}>اتصال</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={async () => {
              if (!user) {
                router.push('/(auth)/login' as any)
                return
              }
              try {
                const sellerId = item.raw?.seller?.id || item.raw?.user?.id || item.raw?.userId
                const cat = item.category || 'LISTING'
                const entityType = cat.toUpperCase()
                
                const res = await chatApi.createRoom({
                  entityType: entityType === 'CARS' ? 'LISTING' : entityType,
                  entityId: item.id,
                  receiverId: sellerId,
                })
                if (res.data?.id) {
                  router.push(`/chat/${res.data.id}` as any)
                }
              } catch (e) {
                dialogService.alert('خطأ', 'تعذر فتح المحادثة')
              }
            }}
          >
            <LinearGradient colors={[Colors.primary, '#003B9E']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.actionBtnChat}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.white} />
              <Text style={styles.actionBtnChatText}>محادثة</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.97, transform: [{ scale: 0.99 }] },

  // ── Vertical card ──
  card: {
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    ...CardSystem.styles.border,
    overflow: 'hidden',
    ...CardSystem.styles.softShadow,
  },
  imgWrapperRatio: {
    aspectRatio: 5 / 3,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    borderTopLeftRadius: CardSystem.radius.outer,
    borderTopRightRadius: CardSystem.radius.outer,
  },
  imgWrapperFixed: {
    width: '100%',
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    borderTopLeftRadius: CardSystem.radius.outer,
    borderTopRightRadius: CardSystem.radius.outer,
  },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  premiumBadge: {
    position: 'absolute', top: Spacing.space2, left: Spacing.space2,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.accent, paddingHorizontal: 7, paddingVertical: 2.5,
    borderRadius: CardSystem.radius.badge,
    ...CardSystem.styles.badgeShadow,
  },
  premiumText: { ...CardSystem.typography.badgeText, color: Colors.white },
  typeBadge: {
    position: 'absolute', bottom: Spacing.space2, left: Spacing.space2,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 2.5,
    borderRadius: CardSystem.radius.badge,
    ...CardSystem.styles.badgeShadow,
  },
  typeText: { ...CardSystem.typography.badgeText, color: Colors.white },
  heartBtn: {
    position: 'absolute', top: Spacing.space2, right: Spacing.space2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: CardSystem.padding.dense, gap: CardSystem.gap.primary },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  title: { ...CardSystem.typography.title, color: Colors.text, writingDirection: 'rtl' },
  priceLocationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 16, fontFamily: 'Almarai_800ExtraBold', color: Colors.primary, writingDirection: 'rtl' },
  priceContact: { fontSize: 13, fontFamily: 'Almarai_700Bold', color: Colors.text2, writingDirection: 'rtl' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { ...CardSystem.typography.subtitle, color: Colors.textMuted, writingDirection: 'rtl' },
  divider: { height: 1, backgroundColor: Colors.surface, marginVertical: 4 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: CardSystem.gap.secondary },
  detailPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 7, paddingVertical: 3.5,
    borderRadius: CardSystem.radius.inner,
  },
  detailText: { ...CardSystem.typography.pillText, color: Colors.text2 },

  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.surface },
  actionBtnCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 100, borderWidth: 1, borderColor: Colors.primary, backgroundColor: '#eff6ff' },
  actionBtnCallText: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.primary },
  actionBtnChat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 100 },
  actionBtnChatText: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.white },

  // ── Compact (horizontal) card ──
  compactCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    gap: CardSystem.gap.primary,
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
  compactImg: {
    width: 90, height: 90,
    borderRadius: CardSystem.radius.inner,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: Colors.surface,
  },
  compactHeart: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactTitle: {
    ...CardSystem.typography.title, color: Colors.text,
    writingDirection: 'rtl',
  },
  compactTypePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface, paddingHorizontal: 7, paddingVertical: 2.5,
    borderRadius: CardSystem.radius.badge, marginTop: 4,
  },
  compactTypeText: { ...CardSystem.typography.badgeText, color: Colors.text2 },
  compactBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLoc: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surface, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 100,
  },
  compactLocText: { ...CardSystem.typography.subtitle, color: Colors.textMuted },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1, borderColor: Colors.primary + '30',
    gap: 3,
  },
  verifiedText: {
    ...CardSystem.typography.badgeText, color: Colors.primary,
  },
  dotsWrapper: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  activeDot: { backgroundColor: Colors.white, width: 16 },
})
