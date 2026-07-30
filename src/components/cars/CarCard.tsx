import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Pressable, Platform, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api/favorites'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Listing } from '../../types/listing.types'
import { GOVERNORATE_OPTIONS } from '../../constants/filters'
import { formatLocation } from '../../utils/mappers'
import { formatDate } from '../../utils/format'

export const CarCard = ({ item, onPress, fullWidth = false, gridMode = false, showChips = false, maxChips = 4, actionMenu }: { item: Listing, onPress: () => void, fullWidth?: boolean, gridMode?: boolean, showChips?: boolean, maxChips?: number, actionMenu?: React.ReactNode }) => {
  const router = useRouter()
  const displayImages = (item.images || []).map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) as string[]
  const imageUrl = displayImages[0]
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
  const mileageData = rawData.mileage || rawData.car?.mileage || rawData.details?.mileage

  const transRaw = rawData.transmission || rawData.car?.transmission || rawData.details?.transmission
  const transLabel = transRaw === 'AUTOMATIC' ? 'أوتوماتيك' : transRaw === 'MANUAL' ? 'عادي' : transRaw

  const year = yearData ? String(yearData) : 'N/A'
  const mileage = mileageData ? `${Number(mileageData).toLocaleString('en-US')} كم` : ''
  const isEquipment = listingTypeStr.startsWith('EQUIPMENT') || (item as any).category === 'equipment' || rawData.category === 'equipment'
  const hoursUsedData = rawData.hoursUsed || rawData.details?.hoursUsed || (item as any).details?.hoursUsed
  const eqCondition = rawData.condition || rawData.details?.condition || (item as any).details?.condition
  const equipmentConditionLabel = eqCondition === 'NEW' ? 'جديدة' : eqCondition === 'USED' ? 'مستعملة' : eqCondition === 'LIKE_NEW' ? 'شبه جديدة' : eqCondition === 'REFURBISHED' ? 'مجددة' : eqCondition
  
  const carName = make && model && !isEquipment ? `${make} ${model} ${year !== 'N/A' ? year : ''}`.trim() : item.title
  
  const getGovernorateLabel = (codeOrName: string) => {
    if (!codeOrName) return ''
    const option = GOVERNORATE_OPTIONS.find(opt => opt.value === codeOrName)
    return option ? option.labelAr : codeOrName
  }
  const govLabel = getGovernorateLabel(item.governorate)
  const location = item.city ? `${govLabel}، ${item.city}` : govLabel

  const { isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()
  const [isFav, setIsFav] = useState(false) // Or derive from item.isFavorite if available
  const [cardWidth, setCardWidth] = useState(0)
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any)
      return
    }
    
    // Optimistic UI toggle
    setIsFav(!isFav)
    
    try {
      // Backend uses a toggle endpoint: POST /favorites/:entityType/:entityId
      await favoritesApi.add('LISTING', item.id)
      
      // Invalidate the favorites cache so the FavoritesScreen will refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (err: any) {
      console.log('Error toggling favorite:', err?.response?.data || err.message || err)
      // Revert if API fails
      setIsFav(isFav)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `شاهد هذه السيارة المعروضة على سوق ون: ${carName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`,
      })
    } catch (error) {
      console.log('Error sharing listing:', error)
    }
  }

  return (
    <View 
      style={[s.card, fullWidth && { width: '100%' }, gridMode && { width: '100%', flex: 1 }]} 
    >
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
          <Pressable onPress={onPress} style={[s.carImagePlaceholder, fullWidth && { height: 180, aspectRatio: undefined }]}>
            <Ionicons name="car-sport" size={40} color={Colors.borderStrong} />
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
              <Text style={s.badgeTxt}>مع سائق</Text>
            </View>
          )}
          {isSale && item.condition === 'NEW' && (
            <View style={[s.badge, { backgroundColor: '#3b82f6' }]}>
              <Text style={s.badgeTxt}>جديد</Text>
            </View>
          )}
          {isSale && item.condition === 'LIKE_NEW' && (
            <View style={[s.badge, { backgroundColor: '#14b8a6' }]}>
              <Text style={s.badgeTxt}>شبه جديد</Text>
            </View>
          )}
          {isSale && item.condition === 'USED' && (
            <View style={[s.badge, { backgroundColor: '#64748b' }]}>
              <Text style={s.badgeTxt}>مستعمل</Text>
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
      
      <Pressable onPress={onPress} style={s.carDetails}>
        <View style={s.headerRow}>
          <Text style={[s.carTitle, { flex: 1 }]} numberOfLines={2}>{carName}</Text>
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
          {isEquipment ? (
            <>
              {make && (
                <View style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="construct-outline" size={14} color="#64748b" />
                  <Text style={s.detailText}>{make}</Text>
                </View>
              )}
              {year !== 'N/A' && (
                <View style={[s.detailPill, s.pillBlue]}>
                  <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
                  <Text style={[s.detailText, { color: '#3b82f6' }]}>{year}</Text>
                </View>
              )}
              {!!hoursUsedData && (
                <View style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text style={s.detailText}>{hoursUsedData} س</Text>
                </View>
              )}
              {!!equipmentConditionLabel && (
                <View style={[s.detailPill, s.pillAmber]}>
                  <Ionicons name="information-circle-outline" size={14} color="#d97706" />
                  <Text style={[s.detailText, { color: '#d97706' }]}>{equipmentConditionLabel}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {model && (
                <View style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="car-outline" size={14} color="#64748b" />
                  <Text style={s.detailText}>{model}</Text>
                </View>
              )}
              {year !== 'N/A' && (
                <View style={[s.detailPill, s.pillBlue]}>
                  <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
                  <Text style={[s.detailText, { color: '#3b82f6' }]}>{year}</Text>
                </View>
              )}
              {transLabel && (
                <View style={[s.detailPill, s.pillNeutral]}>
                  <Ionicons name="settings-outline" size={14} color="#64748b" />
                  <Text style={s.detailText}>{transLabel}</Text>
                </View>
              )}
              {!!mileage && (
                <View style={[s.detailPill, s.pillAmber]}>
                  <Ionicons name="speedometer-outline" size={14} color="#d97706" />
                  <Text style={[s.detailText, { color: '#d97706' }]}>{mileage}</Text>
                </View>
              )}
            </>
          )}
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

const softShadow = Platform.select({
  ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  android: { elevation: 3 },
});

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
  carImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperScrollView: {
    width: '100%',
    height: 140, // Increased slightly for better look
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
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    flexDirection: 'row', gap: 8,
  },
  actionBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute', top: 12, left: 12, right: 80, // leave space for actions
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100, // fully rounded like pills
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2, // premium shadow
  },
  badgeTxt: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 10, color: Colors.white,
    letterSpacing: 0.2,
  },
  carDetails: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  carTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 15, color: '#0f172a', textAlign: 'left',
    lineHeight: 22,
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 2,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 10, color: '#2563eb',
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 6, marginTop: 4, marginBottom: 8,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, color: Colors.textMuted,
  },
  timeTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 11, color: '#94a3b8',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc', // slate-50
  },
  pillBlue: {
    backgroundColor: '#eff6ff', // blue-50
  },
  pillAmber: {
    backgroundColor: '#fffbeb', // amber-50
  },
  pillGreen: {
    backgroundColor: '#ecfdf5', // emerald-50
  },
  detailText: {
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  budgetValText: {
    fontSize: 13,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    lineHeight: 20,
  },
})
