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
import { formatLocation } from '../../utils/mappers'

export const EquipCard = ({ item, onPress, fullWidth = false, gridMode = false, showChips = false, actionMenu, maxSpecs }: { item: Listing, onPress: () => void, fullWidth?: boolean, gridMode?: boolean, showChips?: boolean, actionMenu?: React.ReactNode, maxSpecs?: number }) => {
  const router = useRouter()
  const displayImages = (item.images || []).map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) as string[]
  
  const typeStr = (item as any).listingType || ''
  const isRental = typeStr === 'EQUIPMENT_RENT' || typeStr === 'RENTAL'
  const isSale = typeStr === 'EQUIPMENT_SALE' || typeStr === 'SALE'
  const isWanted = typeStr === 'EQUIPMENT_WANTED' || typeStr === 'WANTED'
  const isSellerVerified = item.user?.isVerified ?? (item as any).seller?.isVerified ?? false
  
  let equipDetails = (item as any).details || []
  if (maxSpecs && equipDetails.length > maxSpecs) {
    equipDetails = equipDetails.slice(0, maxSpecs)
  }

  const equipName = item.title || 'معدة غير معروفة'
  const displayCurrency = (item as any).currency === 'USD' ? '$' : 'ر.ع.'
  const priceValue = (item as any).priceText || ((item as any).price > 0 ? `${(item as any).price} ${displayCurrency}` : 'تواصل للسعر')
  const priceLabel = (item as any).priceLabel ? `${priceValue} / ${(item as any).priceLabel}` : priceValue

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

  return (
    <View style={[s.equipCard, fullWidth && { width: '100%' }, gridMode && { width: '100%', flex: 1 }]}>
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
            <Ionicons name="hardware-chip" size={40} color={Colors.borderStrong} />
          </Pressable>
        )}
        
        <TouchableOpacity style={s.favBtn} onPress={handleFavorite} activeOpacity={0.8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#ef4444" : Colors.white} />
        </TouchableOpacity>

        <View style={s.badgesContainer}>
          {isWanted ? (
            <View style={[s.badge, { backgroundColor: '#ea580c' }]}>
              <Text style={s.badgeTxt}>مطلوب</Text>
            </View>
          ) : isRental ? (
            <View style={[s.badge, { backgroundColor: '#f59e0b' }]}>
              <Text style={s.badgeTxt}>تأجير</Text>
            </View>
          ) : isSale ? (
            <View style={[s.badge, { backgroundColor: '#3b82f6' }]}>
              <Text style={s.badgeTxt}>للبيع</Text>
            </View>
          ) : null}

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[s.title, { flex: 1 }]} numberOfLines={1}>{equipName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={s.priceTxt}>{priceLabel}</Text>
          {item.isPriceNegotiable && (
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
                {equipDetails.map((detail: any, idx: number) => (
                  <View key={idx} style={s.specChip}>
                    <Ionicons name={detail.icon as any} size={10} color={Colors.textMuted} />
                    <Text style={s.specChipTxt}>{detail.value}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        ) : (
          <View style={s.metaRow}>
            {equipDetails.length > 0 ? (
              <>
                <Ionicons name={equipDetails[0].icon as any} size={12} color={Colors.textMuted} />
                <Text style={s.metaTxt}>{equipDetails[0].value}</Text>
                
                {equipDetails[1] && (
                  <>
                    <Text style={s.metaDot}>•</Text>
                    <Ionicons name={equipDetails[1].icon as any} size={12} color={Colors.textMuted} />
                    <Text style={s.metaTxt}>{equipDetails[1].value}</Text>
                  </>
                )}
              </>
            ) : null}
            {equipDetails.length > 0 && <Text style={s.metaDot}>•</Text>}
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={s.metaTxt} numberOfLines={1}>{formatLocation(item as any)}</Text>
          </View>
        )}
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  equipCard: {
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
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#fff', width: 16,
  },
  favBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute', top: 8, left: 8, right: 44,
    flexDirection: 'row', gap: 4, flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm,
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 2, paddingBottom: 2,
    fontSize: 10, color: Colors.white,
  },
  detailsContainer: {
    padding: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 4, paddingBottom: 4,
    fontSize: 14, color: Colors.text, textAlign: 'left',
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E7F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 2, paddingBottom: 2,
    fontSize: 9, color: '#1877F2',
  },
  priceTxt: {
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
    fontSize: 11, color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.space2,
  },
  metaTxt: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted,
  },
  metaDot: {
    fontFamily: 'Almarai_400Regular',  paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.textMuted, marginHorizontal: 2,
  },
  chipsWrapper: {
    marginTop: 8, marginHorizontal: -Spacing.space3,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.space3, gap: 6,
  },
  specChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  specChipTxt: {
    fontFamily: 'Almarai_700Bold',  paddingTop: 2, paddingBottom: 2,
    fontSize: 10, color: Colors.text2,
  },
})
