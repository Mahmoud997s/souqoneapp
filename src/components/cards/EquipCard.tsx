import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Pressable, Platform, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api/favorites'
import { Listing } from '../../types/listing.types'
import { formatDate } from '../../utils/format'
import { CardSystem } from '../../constants/cardSystem'

export const EquipCard = ({ item, onPress, fullWidth = false, gridMode = false, showChips = false, maxChips = 3, actionMenu }: { item: Listing, onPress: () => void, fullWidth?: boolean, gridMode?: boolean, showChips?: boolean, maxChips?: number, actionMenu?: React.ReactNode }) => {
  const router = useRouter()
  const displayImages = (item.images || []).map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) as string[]
  const listingTypeStr = String(item.listingType || (item as any).type || '')
  const isRental = listingTypeStr === 'RENTAL' || listingTypeStr === 'EQUIPMENT_RENT'
  const isSale = listingTypeStr === 'SALE' || listingTypeStr === 'EQUIPMENT_SALE'
  
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
    } else if (listingTypeStr === 'EQUIPMENT_WANTED' && rawData.budgetMax) {
      priceLabel = `الميزانية: ${rawData.budgetMax} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    }
  }

  const make = rawData.make || rawData.car?.make || rawData.details?.make
  const model = rawData.model || rawData.car?.model || rawData.details?.model
  const yearData = rawData.year || rawData.car?.year || rawData.details?.year
  const year = yearData ? String(yearData) : 'N/A'

  const hoursUsedData = rawData.hoursUsed || rawData.details?.hoursUsed || (item as any).details?.hoursUsed
  const eqCondition = rawData.condition || rawData.details?.condition || (item as any).details?.condition
  const equipmentConditionLabel = eqCondition === 'NEW' ? 'جديدة' : eqCondition === 'USED' ? 'مستعملة' : eqCondition === 'LIKE_NEW' ? 'شبه جديدة' : eqCondition === 'REFURBISHED' ? 'مجددة' : eqCondition
  
  const equipName = item.title || (make && model ? `${make} ${model} ${year !== 'N/A' ? year : ''}`.trim() : 'إعلان معدة')
  
  const location = (item as any).governorate || ''

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
        message: `شاهد هذه المعدة المعروضة على سوق ون: ${equipName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`,
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
            <Ionicons name="hardware-chip-outline" size={40} color={Colors.borderStrong} />
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
          {isRental && item.withDriver && (
            <View style={[s.badge, { backgroundColor: '#10b981' }]}>
              <Ionicons name="person" size={10} color={Colors.white} style={{ marginRight: 2 }} />
              <Text style={s.badgeTxt}>مع سائق/مشغل</Text>
            </View>
          )}
          {isSale && eqCondition === 'NEW' && (
            <View style={[s.badge, { backgroundColor: '#3b82f6' }]}>
              <Text style={s.badgeTxt}>جديدة</Text>
            </View>
          )}
          {isSale && eqCondition === 'USED' && (
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
          <Text style={[s.titleTxt, { flex: 1 }]} numberOfLines={2}>{equipName}</Text>
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

        {/* Details List (Info Pills) */}
        <View style={s.detailsList}>
          {(() => {
            const pills = []
            if (make) pills.push(
              <View key="make" style={[s.detailPill, s.pillNeutral]}>
                <Ionicons name="construct-outline" size={13} color="#64748b" />
                <Text style={s.detailText} numberOfLines={1} ellipsizeMode="tail">{make}</Text>
              </View>
            )
            if (year !== 'N/A') pills.push(
              <View key="year" style={[s.detailPill, s.pillBlue]}>
                <Ionicons name="calendar-outline" size={13} color="#3b82f6" />
                <Text style={[s.detailText, { color: '#3b82f6' }]} numberOfLines={1}>{year}</Text>
              </View>
            )
            if (hoursUsedData) pills.push(
              <View key="hours" style={[s.detailPill, s.pillNeutral]}>
                <Ionicons name="time-outline" size={13} color="#64748b" />
                <Text style={s.detailText} numberOfLines={1}>{hoursUsedData} س</Text>
              </View>
            )
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

        <View style={[s.divider, { marginTop: 4 }]} />

        {/* Footer Row (Budget & Quotes style) */}
        <View style={s.footerRow}>
          <View style={[s.detailPill, isSale && item.isPriceNegotiable ? s.pillGreen : s.pillNeutral, { flex: 1 }]}>
            <Ionicons name="wallet-outline" size={16} color={isSale && item.isPriceNegotiable ? '#059669' : '#64748b'} />
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
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#fff', width: 16 },
  actionsContainer: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    flexDirection: 'row', gap: 8,
  },
  actionBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute', top: 12, left: 12, right: 80,
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 2.5,
    borderRadius: CardSystem.radius.badge,
    ...CardSystem.styles.badgeShadow,
  },
  badgeTxt: {
    ...CardSystem.typography.badgeText,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  detailsCard: { padding: CardSystem.padding.dense },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: CardSystem.gap.primary },
  titleTxt: {
    ...CardSystem.typography.title,
    color: '#0f172a', textAlign: 'left', writingDirection: 'rtl',
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 6, paddingVertical: 2, 
    borderRadius: 100, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 2,
  },
  verifiedTxt: {
    ...CardSystem.typography.badgeText,
    color: '#2563eb', writingDirection: 'rtl',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5, marginTop: 3, marginBottom: 6 },
  locationTxt: { ...CardSystem.typography.subtitle, color: Colors.textMuted, writingDirection: 'rtl' },
  timeTxt: { ...CardSystem.typography.subtitle, color: '#94a3b8', marginStart: 4, writingDirection: 'rtl' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 8 },
  detailsList: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 3.5, marginBottom: 4, overflow: 'hidden' },
  detailPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 2.5, borderRadius: CardSystem.radius.inner,
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
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: CardSystem.gap.secondary },
  budgetValText: {
    fontSize: 12, fontFamily: 'Almarai_800ExtraBold', color: '#64748b', lineHeight: 16, writingDirection: 'rtl',
  },
})
