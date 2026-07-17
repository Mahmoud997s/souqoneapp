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
import { formatLocation } from '../../utils/mappers'

const COND_COLORS: Record<string, { bg: string; text: string }> = {
  NEW:      { bg: '#d1fae5', text: '#065f46' },
  LIKE_NEW: { bg: '#d1fae5', text: '#065f46' },
  USED:     { bg: '#f3f4f6', text: '#4b5563' },
  GOOD:     { bg: '#dbeafe', text: '#1d4ed8' },
  FAIR:     { bg: '#fef3c7', text: '#92400e' },
}
const COND_LABELS: Record<string, string> = {
  NEW: 'جديد', LIKE_NEW: 'شبه جديد', USED: 'مستعمل', GOOD: 'جيد', FAIR: 'مقبول',
}

export const PartCard = ({ item, onPress, fullWidth = false, gridMode = false, showChips = false, actionMenu }: { item: any, onPress: () => void, fullWidth?: boolean, gridMode?: boolean, showChips?: boolean, actionMenu?: React.ReactNode }) => {
  const router = useRouter()
  const rawData = item.raw || item
  
  const displayImages = (rawData.images || []).map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) as string[]
  const isSellerVerified = rawData.user?.isVerified ?? rawData.seller?.isVerified ?? false
  
  const price = parseFloat(rawData.price) || 0
  const currency = rawData.currency === 'USD' ? '$' : 'ر.ع'
  const priceLabel = price > 0 ? `${price.toLocaleString('en-US')} ${currency}` : 'تواصل للسعر'

  const title = rawData.title ?? rawData.partName ?? ''
  const condColor = COND_COLORS[rawData.condition] ?? COND_COLORS.USED
  const condLabel = COND_LABELS[rawData.condition] ?? rawData.condition

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
      await favoritesApi.add('SPARE_PART', rawData.id)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (err: any) {
      console.log('Error toggling favorite:', err)
      setIsFav(isFav)
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
                style={[s.swiperScrollView, fullWidth && { height: 160, aspectRatio: undefined }]}
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
          <Pressable onPress={onPress} style={[s.imagePlaceholder, fullWidth && { height: 160, aspectRatio: undefined }]}>
            <Ionicons name="construct-outline" size={40} color={Colors.borderStrong} />
          </Pressable>
        )}
        
        <TouchableOpacity style={s.favBtn} onPress={handleFavorite} activeOpacity={0.8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#ef4444" : Colors.white} />
        </TouchableOpacity>

        <View style={s.badgesContainer}>
          {condLabel && (
            <View style={[s.badge, { backgroundColor: condColor.bg }]}>
              <Text style={[s.badgeTxt, { color: condColor.text }]}>{condLabel}</Text>
            </View>
          )}
          {rawData.isOriginal && (
            <View style={[s.badge, { backgroundColor: '#ea580c' }]}>
              <Ionicons name="shield-checkmark" size={10} color={Colors.white} style={{ marginRight: 2 }} />
              <Text style={[s.badgeTxt, { color: Colors.white }]}>أصلي</Text>
            </View>
          )}
        </View>

        {actionMenu && (
          <View style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 30, elevation: 6 }}>
            {actionMenu}
          </View>
        )}
      </View>

      <Pressable onPress={onPress} style={s.details}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[s.title, { flex: 1 }]} numberOfLines={1}>{title}</Text>
          {isSellerVerified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
            </View>
          )}
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={s.price}>{priceLabel}</Text>
          {rawData.isPriceNegotiable && (
            <Text style={s.negotiableTxt}>قابل للتفاوض</Text>
          )}
        </View>

        {showChips ? (
          <>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={s.locationTxt} numberOfLines={1}>{formatLocation(rawData)}</Text>
            </View>
            <View style={s.chipsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
                {rawData.partCategory && (
                  <View style={s.specChip}>
                    <Ionicons name="grid-outline" size={10} color={Colors.textMuted} />
                    <Text style={s.specChipTxt}>{rawData.partCategory}</Text>
                  </View>
                )}
                {rawData.compatibleMakes && rawData.compatibleMakes.length > 0 && (
                  <View style={s.specChip}>
                    <Ionicons name="car-outline" size={10} color={Colors.textMuted} />
                    <Text style={s.specChipTxt}>{rawData.compatibleMakes[0]}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </>
        ) : (
          <View style={s.metaRow}>
            {rawData.partCategory && (
              <>
                <Text style={s.metaTxt}>{rawData.partCategory}</Text>
                <Text style={s.metaDot}>•</Text>
              </>
            )}
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={s.metaTxt} numberOfLines={1}>{formatLocation(rawData)}</Text>
          </View>
        )}
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
    borderWidth: 1, borderColor: Colors.border,
  },
  imageContainer: { position: 'relative' },
  imagePlaceholder: {
    width: '100%', height: 120, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center',
  },
  swiperScrollView: { width: '100%', height: 120, backgroundColor: '#F8F9FA' },
  dotsWrapper: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#fff', width: 16 },
  favBtn: { position: 'absolute', top: 8, right: 8, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  badgesContainer: { position: 'absolute', top: 8, left: 8, right: 44, flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  badgeTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 10 },
  details: { padding: Spacing.space3 },
  title: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, textAlign: 'left' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E7F3FF', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 100 },
  price: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 14, color: '#ea580c', textAlign: 'left' },
  negotiableTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 10, color: '#10b981', backgroundColor: '#d1fae5', paddingHorizontal: 6, borderRadius: Radius.sm, overflow: 'hidden' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.space2 },
  metaTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted },
  metaDot: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted, marginHorizontal: 2 },
  chipsWrapper: { marginTop: 8, marginHorizontal: -Spacing.space3 },
  chipsScroll: { paddingHorizontal: Spacing.space3, gap: 6 },
  specChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  specChipTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 10, color: Colors.text2 },
})
