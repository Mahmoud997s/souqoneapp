import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Pressable } from 'react-native'
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

  return (
    <View 
      style={[s.carCard, fullWidth && { width: '100%' }, gridMode && { width: '100%', flex: 1 }]} 
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
        
        {/* Favorite Button */}
        <TouchableOpacity style={s.favBtn} onPress={handleFavorite} activeOpacity={0.8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#ef4444" : Colors.white} />
        </TouchableOpacity>

        {/* Badges Overlay */}
        <View style={s.badgesContainer}>
          {isRental && (
            <View style={[s.badge, { backgroundColor: '#f59e0b' }]}>
              <Text style={s.badgeTxt}>تأجير</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[s.carTitle, { flex: 1 }]} numberOfLines={2}>{carName}</Text>
          {isSellerVerified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
              <Text style={s.verifiedTxt}>عميل موثق</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={s.carPrice}>{priceLabel}</Text>
          {isSale && item.isPriceNegotiable && (
            <Text style={s.negotiableTxt}>قابل للتفاوض</Text>
          )}
        </View>
        {showChips ? (
          <>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={s.locationTxt} numberOfLines={1}>{formatLocation(item as any)}</Text>
            </View>
            <View style={s.chipsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
                {(item as any).details && (item as any).details.length > 0 ? (
                  (item as any).details.slice(0, maxChips).map((detail: any, idx: number) => (
                    <View key={idx} style={s.specChip}>
                      <Ionicons name={detail.icon as any} size={10} color={Colors.textMuted} />
                      <Text style={s.specChipTxt}>{detail.value}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    {isEquipment ? (
                      <>
                        {make && (
                          <View style={s.specChip}>
                            <Ionicons name="construct-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{make}</Text>
                          </View>
                        )}
                        {year !== 'N/A' && (
                          <View style={s.specChip}>
                            <Ionicons name="calendar-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{year}</Text>
                          </View>
                        )}
                        {!!hoursUsedData && (
                          <View style={s.specChip}>
                            <Ionicons name="time-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{hoursUsedData} ساعة</Text>
                          </View>
                        )}
                        {!!equipmentConditionLabel && (
                          <View style={s.specChip}>
                            <Ionicons name="information-circle-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{equipmentConditionLabel}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        {model && (
                          <View style={s.specChip}>
                            <Ionicons name="car-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{model}</Text>
                          </View>
                        )}
                        {transLabel && (
                          <View style={s.specChip}>
                            <Ionicons name="settings-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{transLabel}</Text>
                          </View>
                        )}
                        {year !== 'N/A' && (
                          <View style={s.specChip}>
                            <Ionicons name="calendar-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{year}</Text>
                          </View>
                        )}
                        {!!mileage && (
                          <View style={s.specChip}>
                            <Ionicons name="speedometer-outline" size={10} color={Colors.textMuted} />
                            <Text style={s.specChipTxt}>{mileage}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </>
        ) : (
          <View style={s.carMetaRow}>
            {(item as any).details && (item as any).details.length > 0 ? (
              <>
                <Ionicons name={(item as any).details[0].icon} size={12} color={Colors.textMuted} />
                <Text style={s.carMetaTxt}>{(item as any).details[0].value}</Text>
                
                {(item as any).details[1] && (
                  <>
                    <Text style={s.carMetaDot}>•</Text>
                    <Ionicons name={(item as any).details[1].icon} size={12} color={Colors.textMuted} />
                    <Text style={s.carMetaTxt}>{(item as any).details[1].value}</Text>
                  </>
                )}
              </>
            ) : isEquipment ? (
              <>
                <Ionicons name="construct-outline" size={12} color={Colors.textMuted} />
                <Text style={s.carMetaTxt}>{make || 'معدة'}</Text>
                {!!hoursUsedData && (
                  <>
                    <Text style={s.carMetaDot}>•</Text>
                    <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                    <Text style={s.carMetaTxt}>{hoursUsedData} س</Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                <Text style={s.carMetaTxt}>{year}</Text>
                {!!mileage && (
                  <>
                    <Text style={s.carMetaDot}>•</Text>
                    <Text style={s.carMetaTxt}>{mileage}</Text>
                  </>
                )}
              </>
            )}
            <Text style={s.carMetaDot}>•</Text>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={s.carMetaTxt} numberOfLines={1}>{formatLocation(item as any)}</Text>
          </View>
        )}
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
  swiperScrollView: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FA',
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
  favBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute', top: 8, left: 8, right: 44, // 44 to leave space for favBtn
    flexDirection: 'row', gap: 4, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 2, paddingBottom: 2,
    fontSize: 10, color: Colors.white,
  },
  carDetails: {
    padding: Spacing.space3,
  },
  carTitle: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 14, color: Colors.text, textAlign: 'left',
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E7F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 2, paddingBottom: 2,
    fontSize: 9, color: '#1877F2',
  },
  carPrice: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 14, color: Colors.primary, textAlign: 'left',
  },
  negotiableTxt: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 10, color: '#10b981', backgroundColor: '#d1fae5', paddingHorizontal: 6, borderRadius: Radius.sm, overflow: 'hidden'
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted,
  },
  carMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.space2,
  },
  carMetaTxt: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted,
  },
  carMetaDot: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted, marginHorizontal: 2,
  },
  chipsWrapper: {
    marginTop: 8,
    marginHorizontal: -Spacing.space3,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.space3,
    gap: 6,
  },
  specChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  specChipTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 2, paddingBottom: 2,
    fontSize: 10, color: Colors.text2,
  },
})
