import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Pressable, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../store/authStore'
import { favoritesApi } from '../../api/favorites'
import { CardSystem } from '../../constants/cardSystem'
import { UnifiedCardItem } from '../cards/UnifiedCard'
import { formatDate } from '../../utils/format'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  MAINTENANCE: 'صيانة',
  CLEANING: 'غسيل وتلميع',
  MODIFICATION: 'تعديل',
  INSPECTION: 'فحص',
  BODYWORK: 'سمكرة وصبغ',
  ACCESSORIES_INSTALL: 'إكسسوارات',
  KEYS_LOCKS: 'مفاتيح وأقفال',
  TOWING: 'ونش وإنقاذ',
  OTHER_SERVICE: 'أخرى',
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  WORKSHOP: 'ورشة',
  INDIVIDUAL: 'فرد',
  MOBILE: 'خدمة متنقلة',
  COMPANY: 'شركة',
}

export const ServiceCard = ({ 
  item, 
  onPress, 
  fullWidth = false, 
  gridMode = false 
}: { 
  item: UnifiedCardItem, 
  onPress: () => void, 
  fullWidth?: boolean, 
  gridMode?: boolean 
}) => {
  const router = useRouter()
  const displayImages = (item.images || []).map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) as string[]
  
  const rawData = item.raw || {}
  const providerName = rawData.providerName || ''
  const providerType = rawData.providerType || ''
  const isHomeService = rawData.isHomeService || false
  const serviceType = rawData.serviceType || ''
  
  const serviceTypeLabel = SERVICE_TYPE_LABELS[serviceType] || serviceType
  const providerTypeLabel = PROVIDER_TYPE_LABELS[providerType] || providerType
  const workingHoursOpen = rawData.workingHoursOpen || ''
  const workingHoursClose = rawData.workingHoursClose || ''

  let priceLabel = 'تواصل للسعر'
  if (item.price && item.price > 0) {
    if (rawData.priceTo && rawData.priceTo > item.price) {
      priceLabel = `${item.price} - ${rawData.priceTo} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    } else {
      priceLabel = `من ${item.price} ${item.currency === 'USD' ? '$' : 'ر.ع'}`
    }
  } else if (item.priceText) {
    priceLabel = item.priceText
  }

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
      await favoritesApi.add('CAR_SERVICE', item.id)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (err: any) {
      setIsFav(isFav)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `شاهد هذه الخدمة على سوق ون: ${item.title}\nالمزود: ${providerName}\nhttps://souqone.app/services/${item.id}`,
      })
    } catch (error) {}
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
          <Pressable onPress={onPress} style={[s.carImagePlaceholder, fullWidth && { height: 160, aspectRatio: undefined }]}>
            <Ionicons name="build" size={40} color={Colors.borderStrong} />
          </Pressable>
        )}
        
        <View style={s.actionsContainer}>
          <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={16} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleFavorite} activeOpacity={0.8}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={16} color={isFav ? "#ef4444" : Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={s.badgesContainer}>
          {isHomeService && (
            <View style={[s.badge, { backgroundColor: '#10b981' }]}>
              <Ionicons name="home" size={10} color={Colors.white} style={{ marginRight: 2 }} />
              <Text style={s.badgeTxt}>خدمة منزلية</Text>
            </View>
          )}
          {serviceTypeLabel && (
            <View style={[s.badge, { backgroundColor: '#3b82f6' }]}>
              <Text style={s.badgeTxt}>{serviceTypeLabel}</Text>
            </View>
          )}
        </View>
      </View>
      
      <Pressable onPress={onPress} style={s.carDetails}>
        <View style={s.headerRow}>
          <Text style={[s.carTitle, { flex: 1 }]} numberOfLines={2}>{item.title}</Text>
        </View>
        
        <View style={s.locationRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={[s.locationTxt, { marginLeft: 4 }]} numberOfLines={1}>{item.governorate}</Text>
          </View>
          {!!rawData.createdAt && (
            <>
              <Text style={{ fontSize: 10, color: '#cbd5e1' }}>•</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="time-outline" size={12} color={'#94a3b8'} />
                <Text style={s.timeTxt}>{formatDate(rawData.createdAt)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={s.divider} />

        <View style={s.detailsList}>
          {providerName ? (
            <View style={[s.detailPill, s.pillNeutral]}>
              <Ionicons name="business-outline" size={14} color="#64748b" />
              <Text style={s.detailText} numberOfLines={1}>{providerName}</Text>
            </View>
          ) : null}
          {providerTypeLabel ? (
            <View style={[s.detailPill, s.pillBlue]}>
              <Ionicons name="person-outline" size={14} color="#3b82f6" />
              <Text style={[s.detailText, { color: '#3b82f6' }]}>{providerTypeLabel}</Text>
            </View>
          ) : null}
          {workingHoursOpen && workingHoursClose ? (
            <View style={[s.detailPill, s.pillNeutral]}>
              <Ionicons name="time-outline" size={14} color="#64748b" />
              <Text style={s.detailText}>{workingHoursOpen} - {workingHoursClose}</Text>
            </View>
          ) : null}
        </View>

        <View style={[s.divider, { marginTop: 4 }]} />

        <View style={s.footerRow}>
          <View style={[s.detailPill, s.pillNeutral, { flex: 1 }]}>
            <Ionicons name="wallet-outline" size={16} color="#64748b" />
            <Text style={s.budgetValText}>{priceLabel}</Text>
          </View>
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
    marginBottom: 12,
    ...CardSystem.styles.border,
    overflow: 'hidden',
    ...CardSystem.styles.softShadow,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  carImagePlaceholder: {
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
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#fff', width: 16,
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
  carDetails: {
    padding: CardSystem.padding.dense,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: CardSystem.gap.primary,
  },
  carTitle: {
    ...CardSystem.typography.title,
    color: '#0f172a', textAlign: 'left', writingDirection: 'rtl',
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5, marginTop: 3, marginBottom: 6,
  },
  locationTxt: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted, writingDirection: 'rtl',
  },
  timeTxt: {
    ...CardSystem.typography.subtitle,
    color: '#94a3b8', marginStart: 4, writingDirection: 'rtl',
  },
  divider: {
    height: 1, backgroundColor: '#f1f5f9', marginBottom: 8,
  },
  detailsList: {
    flexDirection: 'row', flexWrap: 'wrap', gap: CardSystem.gap.secondary, marginBottom: 6,
  },
  detailPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3.5,
    borderRadius: CardSystem.radius.inner,
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: CardSystem.gap.secondary,
  },
  budgetValText: {
    fontSize: 12, fontFamily: 'Almarai_800ExtraBold', color: '#64748b', lineHeight: 16, writingDirection: 'rtl',
  },
})
