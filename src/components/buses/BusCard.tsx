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
import { formatTimeAgo } from '../../utils/formatTime'

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

  const make = rawData.make || rawData.details?.make
  const yearData = rawData.year || rawData.details?.year
  const mileageData = rawData.mileage || rawData.details?.mileage
  const busCapacity = rawData.capacity || rawData.details?.capacity || (item as any).details?.capacity
  const busTypeRaw = rawData.busType || rawData.details?.busType || (item as any).details?.busType
  const condition = rawData.condition || rawData.details?.condition || (item as any).details?.condition

  const year = yearData ? String(yearData) : 'N/A'
  const mileage = mileageData ? `${Number(mileageData).toLocaleString('en-US')} كم` : ''
  
  // Mapping function to avoid hard dependency on BUS_TYPES
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

  const busName = make ? `${make} ${busCapacity ? busCapacity + ' مقعد' : ''} ${year !== 'N/A' ? year : ''}`.trim() : item.title
  
  const getGovernorateLabel = (codeOrName: string) => {
    if (!codeOrName) return ''
    const option = GOVERNORATE_OPTIONS.find(opt => opt.value === codeOrName)
    return option ? option.labelAr : codeOrName
  }
  const govLabel = getGovernorateLabel(item.governorate)

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
        message: `شاهد هذه الحافلة المميزة: ${busName} على سوق ون\n\nالسعر: ${priceLabel}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const createdAt = rawData.createdAt || item.createdAt;
  const dateText = createdAt ? formatTimeAgo(createdAt) : '';
  const isNegotiable = item.isPriceNegotiable ?? rawData.isPriceNegotiable ?? rawData.details?.isPriceNegotiable ?? false;

  return (
    <View style={[s.busCard, fullWidth && { width: '100%' }, gridMode && { width: '100%', flex: 1 }]}>
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
        
        <TouchableOpacity style={s.favBtn} onPress={handleFavorite} activeOpacity={0.8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#ef4444" : Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={[s.favBtn, { right: 44 }]} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={18} color={Colors.white} />
        </TouchableOpacity>

        <View style={s.badgesContainer}>
          {isRental && (
            <View style={[s.badge, { backgroundColor: '#f59e0b' }]}>
              <Text style={s.badgeTxt}>تأجير</Text>
            </View>
          )}
          {listingTypeStr === 'BUS_SALE_WITH_CONTRACT' && (
            <View style={[s.badge, { backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
              <Ionicons name="document-text" size={12} color={Colors.white} style={{ marginRight: 4 }} />
              <Text style={[s.badgeTxt, { fontSize: 11, fontFamily: 'Almarai_800ExtraBold' }]}>بيع مع عقد تشغيل</Text>
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
              <Text style={s.badgeTxt}>جديد</Text>
            </View>
          )}
          {isSale && condition === 'USED' && (
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

        {actionMenu && (
          <View style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 30, elevation: 6 }}>
            {actionMenu}
          </View>
        )}
      </View>

      <Pressable onPress={onPress} style={s.detailsContainer}>
        {/* Title & Price Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <Text style={[s.title, { flexShrink: 1 }]} numberOfLines={1}>{busName}</Text>
            {isSellerVerified && (
              <View style={s.verifiedRow}>
                <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
                <Text style={s.verifiedTxt}>موثق</Text>
              </View>
            )}
          </View>
          <Text style={s.price}>{priceLabel}</Text>
        </View>

        {/* Location, Date & Negotiable Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={s.locationTxt} numberOfLines={1}>{formatLocation(item as any)}</Text>
            </View>
            {!!dateText && (
              <View style={s.locationRow}>
                <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                <Text style={[s.locationTxt, { fontSize: 11 }]}>{dateText}</Text>
              </View>
            )}
          </View>
          
          {isNegotiable && (
            <View style={s.negotiableBadge}>
              <Ionicons name="chatbubbles-outline" size={12} color="#10b981" />
              <Text style={s.negotiableTxt}>قابل للتفاوض</Text>
            </View>
          )}
        </View>
        
        {showChips ? (
          <>
            <View style={s.chipsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
                {(item as any).details && Array.isArray((item as any).details) && (item as any).details.length > 0 ? (
                  (item as any).details.slice(0, maxChips).map((detail: any, idx: number) => {
                    const isContractChip = detail.value === 'عقد تشغيل';
                    const isSaleRentChip = detail.value === 'للبيع' || detail.value === 'تأجير';
                    
                    return (
                      <View key={idx} style={[
                        s.specChip,
                        isContractChip && { backgroundColor: '#ede9fe', borderColor: '#c4b5fd', borderWidth: 1 },
                        isSaleRentChip && { backgroundColor: '#e0f2fe', borderColor: '#bae6fd', borderWidth: 1 }
                      ]}>
                        <Ionicons name={detail.icon as any} size={12} color={isContractChip ? '#7c3aed' : (isSaleRentChip ? '#0284c7' : Colors.textMuted)} />
                        <Text style={[
                          s.specChipTxt,
                          isContractChip && { color: '#7c3aed', fontFamily: 'Almarai_800ExtraBold' },
                          isSaleRentChip && { color: '#0284c7', fontFamily: 'Almarai_800ExtraBold' }
                        ]}>{detail.value}</Text>
                      </View>
                    )
                  })
                ) : (
                  <>
                    {make && (
                      <View style={s.specChip}>
                        <Ionicons name="bus-outline" size={10} color={Colors.textMuted} />
                        <Text style={s.specChipTxt}>{make}</Text>
                      </View>
                    )}
                    {busCapacity && (
                      <View style={s.specChip}>
                        <Ionicons name="people-outline" size={10} color={Colors.textMuted} />
                        <Text style={s.specChipTxt}>{busCapacity} راكب</Text>
                      </View>
                    )}
                    {busTypeRaw && (
                      <View style={s.specChip}>
                        <Ionicons name="list-outline" size={10} color={Colors.textMuted} />
                        <Text style={s.specChipTxt}>{getBusTypeLabel(busTypeRaw)}</Text>
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
              </ScrollView>
            </View>
          </>
        ) : (
          <View style={s.metaRow}>
            {(item as any).details && Array.isArray((item as any).details) && (item as any).details.length > 0 ? (
              <>
                <Ionicons name={(item as any).details[0].icon} size={12} color={Colors.textMuted} />
                <Text style={s.metaTxt}>{(item as any).details[0].value}</Text>
                
                {(item as any).details[1] && (
                  <>
                    <Text style={s.metaDot}>•</Text>
                    <Ionicons name={(item as any).details[1].icon} size={12} color={Colors.textMuted} />
                    <Text style={s.metaTxt}>{(item as any).details[1].value}</Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Ionicons name="bus-outline" size={12} color={Colors.textMuted} />
                <Text style={s.metaTxt}>{make || 'حافلة'}</Text>
                
                {busCapacity && (
                  <>
                    <Text style={s.metaDot}>•</Text>
                    <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                    <Text style={s.metaTxt}>{busCapacity} راكب</Text>
                  </>
                )}
              </>
            )}

          </View>
        )}
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  busCard: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
    borderWidth: 1, borderColor: Colors.border,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePlaceholder: {
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
    position: 'absolute', top: 8, left: 8, right: 80,
    flexDirection: 'row', gap: 4, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 10, color: Colors.white,
  },
  detailsContainer: {
    padding: 14,
  },
  title: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: Colors.text, textAlign: 'left',
    paddingVertical: 2,
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E7F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 9, color: '#1877F2',
  },
  price: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, color: Colors.primary, textAlign: 'left',
  },
  negotiableBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 4, borderRadius: Radius.sm, overflow: 'hidden'
  },
  negotiableTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 10, color: '#10b981',
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.space2,
  },
  metaTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 11, color: Colors.textMuted,
  },
  metaDot: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 11, color: Colors.textMuted, marginHorizontal: 2,
  },
  chipsWrapper: {
    marginTop: 12,
    marginHorizontal: -14,
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  specChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.md, borderWidth: 1, borderColor: '#e2e8f0',
  },
  specChipTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11, color: Colors.text2,
  }
})
