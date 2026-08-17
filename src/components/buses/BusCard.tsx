import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Pressable, Platform, Share } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api/favorites'
import { Listing } from '../../types/listing.types'
import { GOVERNORATE_OPTIONS, OMAN_LOCATIONS } from '../../constants/locations'
import { formatDate } from '../../utils/format'
import { CardSystem } from '../../constants/cardSystem'

function resolveBusLocation(item: any, rawData: any): string {
  const govRef = rawData.governorateRef || item.governorateRef
  const wilRef = rawData.wilayaRef || item.wilayaRef

  if (govRef || wilRef) {
    const govName = govRef?.nameAr || govRef?.name || govRef?.nameEn || ''
    const wilName = wilRef ? (wilRef.nameAr || wilRef.name || wilRef.nameEn || '') : ''
    if (govName && wilName && govName !== wilName) {
      return `${govName}، ${wilName}`
    }
    return wilName || govName || ''
  }

  const rawGov = rawData.governorateName || rawData.details?.governorateName || item.governorate || rawData.governorate
  const rawWil = rawData.wilayaName || rawData.details?.wilayaName || rawData.city || item.city || rawData.wilaya || item.wilaya

  let govLabel = ''
  if (typeof rawGov === 'string' && !rawGov.startsWith('OM_') && !rawGov.startsWith('OM-') && isNaN(Number(rawGov))) {
    govLabel = rawGov
  } else if (rawGov) {
    const strGov = String(rawGov).toUpperCase()
    const foundOpt = GOVERNORATE_OPTIONS.find(
      (o) => o.value.toUpperCase() === strGov || o.value.replace('_', '-').toUpperCase() === strGov.replace('_', '-')
    )
    if (foundOpt) {
      govLabel = foundOpt.labelAr
    } else {
      const foundLoc = OMAN_LOCATIONS.find(
        (l) => l.id.toUpperCase() === strGov || l.legacyId.toUpperCase() === strGov
      )
      if (foundLoc) govLabel = foundLoc.labelAr
    }
  }

  let wilLabel = ''
  if (typeof rawWil === 'string') {
    wilLabel = rawWil
  } else if (rawWil?.nameAr) {
    wilLabel = rawWil.nameAr
  }

  if (govLabel && wilLabel && govLabel !== wilLabel) {
    return `${govLabel}، ${wilLabel}`
  }
  return wilLabel || govLabel || rawData.location || item.location || ''
}

export const BusCard = ({ item, onPress, fullWidth = false, gridMode = false, showChips = false, maxChips = 4, actionMenu }: { item: Listing, onPress: () => void, fullWidth?: boolean, gridMode?: boolean, showChips?: boolean, maxChips?: number, actionMenu?: React.ReactNode }) => {
  const router = useRouter()
  const displayImages = (item.images || []).map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) as string[]
  const listingTypeStr = String(item.listingType || (item as any).type || '')
  
  const isRental = listingTypeStr === 'BUS_RENT' || listingTypeStr === 'RENTAL'
  const isSale = listingTypeStr === 'BUS_SALE' || listingTypeStr === 'SALE'
  
  const rawData = (item as any).raw || item
  const isSellerVerified = (item as any).isVerified ?? rawData.user?.isVerified ?? rawData.seller?.isVerified ?? false
  
  let priceLabel = `${item.price} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
  if ((item as any).priceText) {
    priceLabel = (item as any).priceText
  } else if (!item.price && !rawData.price && !rawData.dailyPrice && !rawData.monthlyPrice) {
    priceLabel = 'تواصل للسعر'
  } else {
    const p = item.price || rawData.price || rawData.dailyPrice || rawData.monthlyPrice || rawData.budgetMax;
    priceLabel = `${p} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    if (isRental) {
      if ((item as any).priceLabel) {
        priceLabel += ` / ${(item as any).priceLabel}`
      } else if (rawData.dailyPrice) {
        priceLabel = `${rawData.dailyPrice} ${item.currency === 'USD' ? '$' : 'ر.ع'} / يوم`
      } else if (rawData.monthlyPrice) {
        priceLabel = `${rawData.monthlyPrice} ${item.currency === 'USD' ? '$' : 'ر.ع'} / شهر`
      }
    }
  }

  const make = rawData.make || rawData.bus?.make || rawData.details?.make
  const yearData = rawData.year || rawData.bus?.year || rawData.details?.year
  const mileageData = rawData.mileage || rawData.bus?.mileage || rawData.details?.mileage
  const busCapacity = rawData.capacity || rawData.bus?.capacity || rawData.details?.capacity || (item as any).details?.capacity
  const busTypeRaw = rawData.busType || rawData.bus?.busType || rawData.details?.busType || (item as any).details?.busType
  const condition = rawData.condition || rawData.bus?.condition || rawData.details?.condition || (item as any).details?.condition

  const transRaw = rawData.transmission || rawData.bus?.transmission || rawData.details?.transmission
  const transLabel = transRaw === 'AUTOMATIC' ? 'أوتوماتيك' : transRaw === 'MANUAL' ? 'عادي' : transRaw

  const year = yearData ? String(yearData) : 'N/A'
  const mileage = mileageData ? `${Number(mileageData).toLocaleString('en-US')} كم` : ''
  
  const getBusTypeLabel = (type: string) => {
    if (!type) return ''
    const types: Record<string, string> = {
      'MINI_BUS': 'ميني باص',
      'MEDIUM_BUS': 'حافلة متوسطة',
      'LARGE_BUS': 'حافلة كبيرة',
      'COASTER': 'كوستر',
      'SCHOOL_BUS': 'حافلة مدرسية',
    }
    return types[type] || type
  }
  const busTypeLabel = getBusTypeLabel(busTypeRaw)

  const busName = item.title || (make ? `${make} ${busCapacity ? busCapacity + ' مقعد' : ''} ${year !== 'N/A' ? year : ''}`.trim() : 'إعلان حافلة')
  
  const location = resolveBusLocation(item, rawData)

  const { isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()
  const [isFav, setIsFav] = useState(false) 
  const [cardWidth, setCardWidth] = useState(0)
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any)
      return
    }
    
    setIsFav(!isFav)
    try {
      await favoritesApi.add('LISTING', item.id)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (err: any) {
      console.log('Error toggling favorite:', err?.response?.data || err.message || err)
      setIsFav(isFav)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `شاهد هذه الحافلة المعروضة على سوق ون: ${busName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`,
      })
    } catch (error) {
      console.log('Error sharing listing:', error)
    }
  }

  return (
    <View style={[s.card, fullWidth && { width: '100%' }, gridMode && { width: '100%', flex: 1 }]}>
      <View style={s.imageContainer} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
        {displayImages.length > 0 ? (
          cardWidth > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={[s.swiperScrollView, fullWidth && { height: 180, aspectRatio: undefined }]}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
              >
                {displayImages.map((img, i) => (
                  <Pressable key={i} onPress={onPress} style={{ width: cardWidth, height: '100%' }}>
                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              {displayImages.length > 1 && (
                <View style={s.dotsWrapper}>
                  {displayImages.map((_, i) => (
                     <View key={i} style={[s.dot, activeImgIdx === i && s.activeDot]} />
                  ))}
                </View>
              )}
            </>
          ) : null
        ) : (
          <Pressable onPress={onPress} style={[s.imagePlaceholder, fullWidth && { height: 180, aspectRatio: undefined }]}>
            <Ionicons name="bus-outline" size={40} color={Colors.borderStrong} />
          </Pressable>
        )}
        
        {/* Actions (Share & Favorite) */}
        <View style={s.actionsContainer}>
          <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleFavorite} activeOpacity={0.8}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={16} color={isFav ? "#ef4444" : Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Badges Overlay */}
        <View style={s.badgesContainer}>
          {isRental && (
            <View style={[s.badge, { backgroundColor: '#fffbeb' }]}>
              <Text style={[s.badgeTxt, { color: '#d97706' }]}>إيجار</Text>
            </View>
          )}
          {listingTypeStr === 'BUS_SALE_WITH_CONTRACT' && (
            <View style={[s.badge, { backgroundColor: '#8b5cf6', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Ionicons name="document-text" size={10} color={Colors.white} style={{ marginRight: 2 }} />
              <Text style={s.badgeTxt}>بيع مع عقد تشغيل</Text>
            </View>
          )}
          {isRental && item.withDriver && (
            <View style={[s.badge, { backgroundColor: '#10b981' }]}>
              <Ionicons name="person" size={10} color={Colors.white} style={{ marginRight: 2 }} />
              <Text style={s.badgeTxt}>مع سائق</Text>
            </View>
          )}
          {isSale && condition === 'NEW' && (
            <View style={[s.badge, { backgroundColor: '#3b82f6' }]}>
              <Text style={s.badgeTxt}>جديدة</Text>
            </View>
          )}
          {isSale && condition === 'USED' && (
            <View style={[s.badge, { backgroundColor: '#64748b' }]}>
              <Text style={s.badgeTxt}>مستعملة</Text>
            </View>
          )}
          {item.isPremium && (
            <View style={[s.badge, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="star" size={10} color={Colors.white} style={{ marginRight: 2 }} />
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
      
      <Pressable onPress={onPress} style={s.detailsCard}>
        <View style={s.headerRow}>
          <Text style={[s.titleTxt, { flex: 1 }]} numberOfLines={2}>{busName}</Text>
          {isSellerVerified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
              <Text style={s.verifiedTxt}>موثق</Text>
            </View>
          )}
        </View>
        
        <View style={s.locationRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={[s.locationTxt, { marginLeft: 4 }]} numberOfLines={1}>{location}</Text>
          </View>
          {!!item.createdAt && (
            <>
              <Text style={{ fontSize: 10, color: '#cbd5e1' }}>•</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="time-outline" size={12} color={'#94a3b8'} />
                <Text style={s.timeTxt}>{formatDate(item.createdAt)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.divider} />

        {/* Details List (Info Pills matching Cars conditions) */}
        <View style={s.detailsList}>
          {(() => {
            const pills = []
            
            // 1. Bus Type (e.g. Coaster / Mini Bus)
            if (busTypeLabel) {
              pills.push(
                <View key="type" style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="bus-outline" size={13} color="#64748b" />
                  <Text style={s.detailText} numberOfLines={1} ellipsizeMode="tail">{busTypeLabel}</Text>
                </View>
              )
            }

            // 2. Year (Blue pill)
            if (year !== 'N/A') {
              pills.push(
                <View key="year" style={[s.detailPill, s.pillBlue]}>
                  <Ionicons name="calendar-outline" size={13} color="#3b82f6" />
                  <Text style={[s.detailText, { color: '#3b82f6' }]} numberOfLines={1}>{year}</Text>
                </View>
              )
            }

            // 3. Transmission (Neutral pill with shift pattern icon)
            if (transLabel) {
              pills.push(
                <View key="trans" style={[s.detailPill, s.pillNeutral]}>
                  <MaterialCommunityIcons name="car-shift-pattern" size={12} color="#64748b" />
                  <Text style={s.detailText} numberOfLines={1} ellipsizeMode="tail">{transLabel}</Text>
                </View>
              )
            }

            // 4. Mileage (Amber pill with speedometer icon)
            if (mileage) {
              pills.push(
                <View key="mileage" style={[s.detailPill, s.pillAmber]}>
                  <Ionicons name="speedometer-outline" size={13} color="#d97706" />
                  <Text style={[s.detailText, { color: '#d97706' }]} numberOfLines={1}>{mileage}</Text>
                </View>
              )
            }

            // 5. Capacity (Seats count)
            if (busCapacity) {
              pills.push(
                <View key="cap" style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="people-outline" size={13} color="#64748b" />
                  <Text style={s.detailText} numberOfLines={1}>{busCapacity} مقعد</Text>
                </View>
              )
            }

            if (pills.length <= maxChips) {
              return pills
            }

            const visiblePills = pills.slice(0, maxChips)
            const remainingCount = pills.length - maxChips

            return (
              <>
                {visiblePills}
                {remainingCount > 0 && (
                  <View style={[s.detailPill, s.pillNeutral, { paddingHorizontal: 4.5, flexShrink: 0 }]}>
                    <Text style={[s.detailText, { fontFamily: 'Almarai_700Bold', color: '#64748b', fontSize: 9.5 }]} numberOfLines={1}>
                      +{remainingCount}
                    </Text>
                  </View>
                )}
              </>
            )
          })()}
        </View>

        <View style={[s.divider, { marginTop: 2, marginBottom: 6 }]} />

        {/* Footer Row (Budget & Quotes style) */}
        <View style={s.footerRow}>
          <View style={[s.detailPill, isSale && item.isPriceNegotiable ? s.pillGreen : s.pillNeutral, { flex: 1 }]}>
            <Ionicons name="wallet-outline" size={15} color={isSale && item.isPriceNegotiable ? '#059669' : '#64748b'} />
            <Text style={[s.budgetValText, isSale && item.isPriceNegotiable && { color: '#059669' }]}>{priceLabel}</Text>
          </View>
          
          {isSale && item.isPriceNegotiable && (
            <View style={[s.detailPill, s.pillGreen]}>
              <Text style={[s.detailText, { color: '#059669', fontFamily: 'Almarai_700Bold' }]}>
                قابل للتفاوض
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    alignSelf: 'flex-start',
    ...CardSystem.styles.border,
    overflow: 'hidden',
    ...CardSystem.styles.softShadow,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  imagePlaceholder: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperScrollView: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
  },
  dotsWrapper: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#fff', width: 14 },
  actionsContainer: {
    position: 'absolute', top: 10, right: 10, zIndex: 10,
    flexDirection: 'row', gap: 6,
  },
  actionBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute', top: 10, left: 10, right: 75,
    flexDirection: 'row', gap: 5, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: CardSystem.radius.badge,
    ...CardSystem.styles.badgeShadow,
  },
  badgeTxt: {
    ...CardSystem.typography.badgeText,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  detailsCard: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: CardSystem.gap.primary,
  },
  titleTxt: {
    ...CardSystem.typography.title,
    color: '#0f172a', textAlign: 'left', writingDirection: 'rtl',
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 5, paddingVertical: 1.5, 
    borderRadius: 100, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 2,
  },
  verifiedTxt: {
    ...CardSystem.typography.badgeText,
    color: '#2563eb', writingDirection: 'rtl',
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 4, marginTop: 2, marginBottom: 5,
  },
  locationTxt: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted, writingDirection: 'rtl',
  },
  timeTxt: {
    ...CardSystem.typography.subtitle,
    color: '#94a3b8', marginStart: 3, writingDirection: 'rtl',
  },
  divider: {
    height: 1, backgroundColor: '#f1f5f9', marginBottom: 6,
  },
  detailsList: {
    flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 3.5, marginBottom: 4, overflow: 'hidden',
  },
  detailPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 2.5,
    borderRadius: CardSystem.radius.inner,
    flexShrink: 1,
  },
  pillNeutral: CardSystem.styles.pillNeutral,
  pillBlue: CardSystem.styles.pillBlue,
  pillAmber: CardSystem.styles.pillAmber,
  pillGreen: CardSystem.styles.pillGreen,
  detailText: {
    ...CardSystem.typography.pillText,
    color: '#475569', writingDirection: 'rtl',
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5,
  },
  budgetValText: {
    fontSize: 11.5, fontFamily: 'Almarai_800ExtraBold', color: '#64748b', lineHeight: 15, writingDirection: 'rtl',
  },
})
