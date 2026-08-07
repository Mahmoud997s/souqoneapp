import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Pressable,
  Platform,
  Share,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api/favorites'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { GOVERNORATE_OPTIONS } from '../../constants/filters'
import { formatLocation } from '../../utils/mappers'
import { formatDate } from '../../utils/format'
import { PART_CATEGORIES, POPULAR_PART_MAKES } from '../../constants/parts'

export interface PartCardProps {
  item: any
  onPress: () => void
  fullWidth?: boolean
  gridMode?: boolean
  showChips?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
}

const CATEGORY_MAP: Record<string, string> = {
  ENGINE: 'محرك وملحقاته',
  BODY: 'الهيكل والبودي',
  ELECTRICAL: 'كهرباء وإلكترونيات',
  SUSPENSION: 'مساعدات ونظام تعليق',
  BRAKES: 'فرامل ومكابح',
  INTERIOR: 'مقصورة وداخلية',
  TIRES: 'إطارات وجنوط',
  BATTERIES: 'بطاريات',
  OILS: 'زيوت وفلاتر',
  ACCESSORIES: 'إكسسوارات وزينة',
  OTHER: 'أخرى',
}

const CONDITION_MAP: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  USED: 'مستعمل',
  REFURBISHED: 'مجدد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
}

export const PartCard: React.FC<PartCardProps> = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  showChips = false,
  maxChips = 4,
  actionMenu,
}) => {
  const router = useRouter()
  const rawData = item.raw || item

  // Images
  const displayImages = (rawData.images || item.images || [])
    .map((img: any) => (typeof img === 'string' ? img : img?.url || img?.path))
    .filter(Boolean) as string[]

  // Seller verification
  const isSellerVerified =
    item.isVerified ??
    rawData.isVerified ??
    rawData.user?.isVerified ??
    rawData.seller?.isVerified ??
    false

  // Title
  const partTitle =
    item.title ||
    rawData.title ||
    rawData.partName ||
    (rawData.brand ? `قطعة ${rawData.brand}` : 'قطعة غيار')

  // Price formatting
  const rawPrice = rawData.price ?? item.price
  const priceNum = parseFloat(String(rawPrice ?? '0'))
  const currency = rawData.currency === 'USD' || item.currency === 'USD' ? '$' : 'ر.ع'
  let priceLabel = 'تواصل للسعر'
  if (priceNum > 0) {
    priceLabel = `${priceNum.toLocaleString('en-US')} ${currency}`
  } else if (item.priceText) {
    priceLabel = item.priceText
  }

  const isPriceNegotiable = Boolean(rawData.isPriceNegotiable ?? item.isPriceNegotiable)

  // Category
  const rawCategory = rawData.partCategory || rawData.category || item.partCategory
  const categoryLabel = CATEGORY_MAP[rawCategory] || rawCategory || ''

  // Condition
  const rawCondition = String(rawData.condition || item.condition || '').toUpperCase()
  const conditionLabel = CONDITION_MAP[rawCondition] || rawCondition

  // Originality
  const isOriginal = rawData.isOriginal ?? item.isOriginal

  // Part Number
  const partNumber = rawData.partNumber || item.partNumber

  // Compatibility (Makes, Models, Years)
  const makes: string[] = Array.isArray(rawData.compatibleMakes)
    ? rawData.compatibleMakes
    : rawData.brand
    ? [rawData.brand]
    : []
  const makeLabels = makes
    .map((m) => {
      if (m === 'all') return 'متوافق مع الجميع'
      const found = POPULAR_PART_MAKES.find((pm) => pm.id === m)
      return found ? found.label : m
    })
    .filter(Boolean)

  const compatibleModels =
    typeof rawData.compatibleModels === 'string'
      ? rawData.compatibleModels
      : Array.isArray(rawData.compatibleModels)
      ? rawData.compatibleModels.join('، ')
      : ''

  const yearFrom = rawData.yearFrom || item.yearFrom
  const yearTo = rawData.yearTo || item.yearTo
  let yearRange = ''
  if (yearFrom && yearTo) {
    yearRange = `${yearFrom} - ${yearTo}`
  } else if (yearFrom) {
    yearRange = `من ${yearFrom}`
  } else if (yearTo) {
    yearRange = `حتى ${yearTo}`
  }

  // Location & Date
  const location = formatLocation(rawData)
  const createdAt = rawData.createdAt || item.createdAt

  // State
  const { isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()
  const [isFav, setIsFav] = useState(false)
  const [cardWidth, setCardWidth] = useState(
    fullWidth ? Dimensions.get('window').width - 32 : Dimensions.get('window').width * 0.6
  )
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any)
      return
    }

    setIsFav(!isFav)
    try {
      await favoritesApi.add('SPARE_PART', rawData.id || item.id)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (err: any) {
      console.log('Error toggling favorite:', err?.response?.data || err.message || err)
      setIsFav(isFav)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `شاهد هذه القطعة المعروضة على سوق ون: ${partTitle}\nالسعر: ${priceLabel}\nhttps://souqone.app/parts/${
          rawData.id || item.id
        }`,
      })
    } catch (error) {
      console.log('Error sharing part listing:', error)
    }
  }

  return (
    <View
      style={[
        s.card,
        fullWidth && { width: '100%' },
        gridMode && { width: '100%', flex: 1 },
      ]}
    >
      {/* ── Image & Carousel ── */}
      <View
        style={s.imageContainer}
        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      >
        {displayImages.length > 0 ? (
          cardWidth > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={[
                  s.swiperScrollView,
                  fullWidth && { height: 180, aspectRatio: undefined },
                ]}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
              >
                {displayImages.map((img, i) => (
                  <Pressable
                    key={i}
                    onPress={onPress}
                    style={{ width: cardWidth, height: '100%' }}
                  >
                    <Image
                      source={{ uri: img }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {displayImages.length > 1 && (
                <View style={s.dotsWrapper}>
                  {displayImages.map((_, i) => (
                    <View
                      key={i}
                      style={[s.dot, activeImgIdx === i && s.activeDot]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : null
        ) : (
          <Pressable
            onPress={onPress}
            style={[
              s.imagePlaceholder,
              fullWidth && { height: 180, aspectRatio: undefined },
            ]}
          >
            <Ionicons name="construct-outline" size={40} color={Colors.borderStrong} />
          </Pressable>
        )}

        {/* Top Floating Actions (Share & Favorite) */}
        <View style={s.actionsContainer}>
          <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleFavorite} activeOpacity={0.8}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={16}
              color={isFav ? '#ef4444' : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Top Floating Badges Overlay */}
        <View style={s.badgesContainer}>
          {isOriginal === true && (
            <View style={[s.badge, { backgroundColor: '#ea580c' }]}>
              <Ionicons
                name="shield-checkmark"
                size={10}
                color={Colors.white}
                style={{ marginRight: 2 }}
              />
              <Text style={s.badgeTxt}>أصلي وكالة</Text>
            </View>
          )}
          {isOriginal === false && (
            <View style={[s.badge, { backgroundColor: '#475569' }]}>
              <Text style={s.badgeTxt}>تجاري / بديل</Text>
            </View>
          )}
          {rawCondition === 'NEW' && (
            <View style={[s.badge, { backgroundColor: '#10b981' }]}>
              <Text style={s.badgeTxt}>جديد</Text>
            </View>
          )}
          {rawCondition === 'LIKE_NEW' && (
            <View style={[s.badge, { backgroundColor: '#14b8a6' }]}>
              <Text style={s.badgeTxt}>شبه جديد</Text>
            </View>
          )}
          {rawCondition === 'USED' && (
            <View style={[s.badge, { backgroundColor: '#64748b' }]}>
              <Text style={s.badgeTxt}>مستعمل</Text>
            </View>
          )}
          {rawCondition === 'REFURBISHED' && (
            <View style={[s.badge, { backgroundColor: '#d97706' }]}>
              <Text style={s.badgeTxt}>مجدد</Text>
            </View>
          )}
          {(rawData.isPremium || item.isPremium) && (
            <View style={[s.badge, { backgroundColor: '#ef4444' }]}>
              <Ionicons
                name="star"
                size={10}
                color={Colors.white}
                style={{ marginRight: 2 }}
              />
              <Text style={s.badgeTxt}>مميز</Text>
            </View>
          )}
        </View>

        {/* Action Menu (passed from outside) */}
        {actionMenu && (
          <View style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 30, elevation: 6 }}>
            {actionMenu}
          </View>
        )}
      </View>

      {/* ── Card Body & Details ── */}
      <Pressable onPress={onPress} style={s.partDetails}>
        {/* Header Row: Title & Verified Badge */}
        <View style={s.headerRow}>
          <Text style={[s.partTitle, { flex: 1 }]} numberOfLines={2}>
            {partTitle}
          </Text>
          {isSellerVerified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
              <Text style={s.verifiedTxt}>موثق</Text>
            </View>
          )}
        </View>

        {/* Location & Time Row */}
        <View style={s.locationRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={[s.locationTxt, { marginStart: 4 }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
          {!!createdAt && (
            <>
              <Text style={{ fontSize: 10, color: '#cbd5e1' }}>•</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="time-outline" size={12} color={'#94a3b8'} />
                <Text style={[s.timeTxt, { marginStart: 4 }]}>{formatDate(createdAt)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.divider} />

        {/* Details List (Info Pills) */}
        <View style={s.detailsList}>
          {(() => {
            const pills = []

            // 1. Part Category
            if (categoryLabel) {
              pills.push(
                <View key="cat" style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="grid-outline" size={12} color="#64748b" />
                  <Text style={s.detailText}>{categoryLabel}</Text>
                </View>
              )
            }

            // 2. Part Number
            if (partNumber) {
              pills.push(
                <View key="partNo" style={[s.detailPill, s.pillBlue]}>
                  <Ionicons name="barcode-outline" size={12} color="#3b82f6" />
                  <Text style={[s.detailText, { color: '#3b82f6' }]}>{partNumber}</Text>
                </View>
              )
            }

            // 3. Compatible Makes
            if (makeLabels.length > 0) {
              pills.push(
                <View key="makes" style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="car-outline" size={12} color="#64748b" />
                  <Text style={s.detailText} numberOfLines={1}>
                    {makeLabels.slice(0, 2).join('، ')}
                  </Text>
                </View>
              )
            }

            // 4. Compatible Models
            if (compatibleModels) {
              pills.push(
                <View key="models" style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="car-sport-outline" size={12} color="#64748b" />
                  <Text style={s.detailText} numberOfLines={1}>
                    {compatibleModels}
                  </Text>
                </View>
              )
            }

            // 5. Year Range Fitment
            if (yearRange) {
              pills.push(
                <View key="year" style={[s.detailPill, s.pillBlue]}>
                  <Ionicons name="calendar-outline" size={12} color="#3b82f6" />
                  <Text style={[s.detailText, { color: '#3b82f6' }]}>{yearRange}</Text>
                </View>
              )
            }

            // 6. Condition Pill
            if (conditionLabel) {
              pills.push(
                <View key="cond" style={[s.detailPill, s.pillAmber]}>
                  <Ionicons name="information-circle-outline" size={12} color="#d97706" />
                  <Text style={[s.detailText, { color: '#d97706' }]}>{conditionLabel}</Text>
                </View>
              )
            }

            return pills.slice(0, maxChips)
          })()}
        </View>

        <View style={[s.divider, { marginTop: 4 }]} />

        {/* Footer Row (Price & Negotiable Status) */}
        <View style={s.footerRow}>
          <View
            style={[
              s.detailPill,
              isPriceNegotiable ? s.pillGreen : s.pillNeutral,
              { flex: 1 },
            ]}
          >
            <Ionicons
              name="wallet-outline"
              size={16}
              color={isPriceNegotiable ? '#059669' : '#64748b'}
            />
            <Text
              style={[
                s.priceValText,
                isPriceNegotiable && { color: '#059669' },
              ]}
            >
              {priceLabel}
            </Text>
          </View>

          {isPriceNegotiable && (
            <View style={[s.detailPill, s.pillGreen]}>
              <Text
                style={[
                  s.detailText,
                  { color: '#059669', fontFamily: 'Almarai_700Bold' },
                ]}
              >
                قابل للتفاوض
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  )
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
})

const s = StyleSheet.create({
  card: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    ...softShadow,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperScrollView: {
    width: '100%',
    height: 140,
  },
  dotsWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 16,
  },
  actionsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 80,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 9.5,
    color: Colors.white,
    letterSpacing: 0.2,
    lineHeight: 13.5,
    writingDirection: 'rtl',
  },
  partDetails: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  partTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: '#0f172a',
    textAlign: 'left',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 2,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 9.5,
    color: '#2563eb',
    lineHeight: 13.5,
    writingDirection: 'rtl',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
    marginTop: 3,
    marginBottom: 6,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
    writingDirection: 'rtl',
  },
  timeTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    color: '#94a3b8',
    lineHeight: 14.5,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc',
  },
  pillBlue: {
    backgroundColor: '#eff6ff',
  },
  pillAmber: {
    backgroundColor: '#fffbeb',
  },
  pillGreen: {
    backgroundColor: '#ecfdf5',
  },
  detailText: {
    fontSize: 10.5,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
    lineHeight: 14.5,
    writingDirection: 'rtl',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  priceValText: {
    fontSize: 12,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    lineHeight: 16,
    writingDirection: 'rtl',
  },
})
