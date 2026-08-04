import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { Platform } from 'react-native'
import { listingsApi } from '../../src/api/listings'
import { jobsApi } from '../../src/api/jobs'
import { servicesApi } from '../../src/api/services'
import { partsApi } from '../../src/api/parts'
import { equipmentApi } from '../../src/api/equipment'
import { transportApi } from '../../src/api/transport'
import { busesApi } from '../../src/api/buses'
import { uploadsApi } from '../../src/api/uploads'
import { paymentsApi } from '../../src/api/payments'
import { getPostGovLabel, getPostCityLabel } from '../../src/constants/locations'
import { useQueryClient } from '@tanstack/react-query'
import { dialogService } from '../../src/store/dialogStore'

export default function PostStep5Screen() {
  const insets = useSafeAreaInsets()
  const [promo, setPromo] = useState('free')
  const [loading, setLoading] = useState(false)
  const store = usePostStore()
  const queryClient = useQueryClient()

  const handlePublish = async () => {
    if (!store.title.trim()) {
      dialogService.alert('تنبيه', 'يرجى إدخال عنوان الإعلان')
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        ...(store.details || {}),
        title: store.title?.trim() || store.details?.title?.trim(),
        price: isNaN(parseFloat(String(store.price))) ? 0 : parseFloat(String(store.price)),
        isPriceNegotiable: store.isPriceNegotiable ?? store.details?.isPriceNegotiable,
        description: store.description || store.details?.description,
        governorate: store.governorate || store.details?.governorate,
        city: store.city || store.details?.city,
        latitude: store.latitude || store.details?.latitude,
        longitude: store.longitude || store.details?.longitude,
        exteriorColor: store.details?.color || store.details?.exteriorColor,
        interior: store.details?.interiorColor || store.details?.interior,
      }

      const forbiddenFields = [
        'category', 'locationNote', 'images', 'id', 'slug', 'isPremium', 
        'featuredUntil', 'viewCount', 'sellerId', 'createdAt', 'updatedAt', 
        'seller', 'color', 'interiorColor', 'existingImages', 'removedImageIds',
        'status', 'userId', 'user'
      ];
      forbiddenFields.forEach(field => delete payload[field]);

      // Re-attach the finalised images array so the backend can save them
      payload.images = store.editMode 
        ? [...(store.existingImages?.map(i => i.url) || []), ...(store.images || [])]
        : (store.images || []);

      // Ensure price is not negative
      if (typeof payload.price === 'number' && payload.price < 0) {
        payload.price = 0;
      }

      // If images array is empty, do not send it (fixes "property images should not exist" for schemas that omit images)
      if (Array.isArray(payload.images) && payload.images.length === 0) {
        delete payload.images;
      }
      
      // For WANTED listings, backend explicitly forbids images property
      const listingTypeStr = String(payload.listingType || payload.type || store.details?.listingType || '').toUpperCase();
      if (listingTypeStr.includes('WANTED')) {
        delete payload.images;
      }

      const numericFields = [
        'mileage', 'dailyPrice', 'monthlyPrice', 'depositAmount',
        'minRentalDays', 'kmLimitPerDay', 'experienceYears', 'horsepower', 'doors',
        'year', 'hoursUsed', 'budgetMax', 'capacity', 'contractMonthly', 'contractDuration',
        'priceFrom', 'priceTo', 'pricePerHour', 'yearFrom', 'yearTo'
      ];
      numericFields.forEach(field => {
        if (payload[field] != null && payload[field] !== '') {
          payload[field] = parseFloat(String(payload[field]));
        } else if (payload[field] === '') {
          delete payload[field]; // Remove empty string numerics
        }
      });

      // Format compatibleModels if string
      if (typeof payload.compatibleModels === 'string' && payload.compatibleModels.trim()) {
        payload.compatibleModels = (payload.compatibleModels as string)
          .split(',')
          .map((m: string) => m.trim())
          .filter(Boolean);
      }

      // Format workingDays if string
      if (typeof payload.workingDays === 'string' && payload.workingDays.trim()) {
        payload.workingDays = [(payload.workingDays as string).trim()];
      }

      let res;
      if (store.editMode && store.editListingId) {
        // Images are handled via uploadsApi in edit mode, no need to send them in the root payload
        
        switch (store.category) {
          case 'jobs': res = await jobsApi.update(store.editListingId, payload as any); break;
          case 'services': res = await servicesApi.update(store.editListingId, payload as any); break;
          case 'parts': res = await partsApi.update(store.editListingId, payload as any); break;
          case 'equipment': res = await equipmentApi.update(store.editListingId, payload as any); break;
          case 'transport': res = await transportApi.update(store.editListingId, payload as any); break;
          case 'buses': res = await busesApi.update(store.editListingId, payload as any); break;
          default: res = await listingsApi.update(store.editListingId, payload as any); break;
        }
        
        // Cleanup removed images from backend storage explicitly
        if (store.removedImageIds && store.removedImageIds.length > 0) {
          for (const imgId of store.removedImageIds) {
            try {
              if (store.category === 'parts') {
                await uploadsApi.removePartImage(imgId);
              } else if (store.category === 'services') {
                await uploadsApi.removeServiceImage(imgId);
              } else {
                await uploadsApi.removeListingImage(store.editListingId, imgId);
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        switch (store.category) {
          case 'jobs': res = await jobsApi.create(payload as any); break;
          case 'services': res = await servicesApi.create(payload as any); break;
          case 'parts': res = await partsApi.create(payload as any); break;
          case 'equipment': res = await equipmentApi.create(payload as any); break;
          case 'transport': res = await transportApi.create(payload as any); break;
          case 'buses': res = await busesApi.create(payload as any); break;
          default: res = await listingsApi.create(payload as any); break;
        }
      }
      
      const listingId = (res.data as any)?.id

      if (promo !== 'free' && listingId && !store.editMode) {
        try {
          const payRes = await paymentsApi.featureListing(listingId)
          const url = (payRes.data as any)?.checkoutUrl
          if (url) {
            await queryClient.invalidateQueries()
            store.reset()
            await Linking.openURL(url)
            router.replace('/(tabs)')
            return
          }
        } catch {
          // payment initiation failed — listing was created, skip payment
        }
      }

      await queryClient.invalidateQueries()
      store.reset()
      dialogService.alert(store.editMode ? 'تم التعديل' : 'تم النشر', store.editMode ? 'تم تعديل إعلانك بنجاح!' : 'تم نشر إعلانك بنجاح!', 'success')
      router.replace('/(tabs)')
    } catch (err: any) {
      let msg = store.editMode ? 'حدث خطأ أثناء تعديل الإعلان' : 'حدث خطأ أثناء نشر الإعلان'
      if (err?.response?.data?.message) {
        const errorData = err.response.data.message;
        if (Array.isArray(errorData)) {
          msg = errorData.join('\n');
        } else if (typeof errorData === 'string') {
          msg = errorData;
        } else {
          msg = JSON.stringify(errorData);
        }
      } else if (err?.message) {
        msg = err.message;
      }
      dialogService.alert('خطأ', String(msg))
    } finally {
      setLoading(false)
    }
  }

  const previewImage = store.existingImages && store.existingImages.length > 0 ? store.existingImages[0].url : store.images[0]
  const govLabel = getPostGovLabel(store.governorate)
  const cityLabel = getPostCityLabel(store.governorate, store.city)

  return (
    <View style={s.root}>
      <AppHeader title="المعاينة والنشر" showBack />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.progressWrap}>
          <Stepper currentStep={5} totalSteps={5} title="المعاينة والنشر" />
        </View>

        <Text style={s.sectionTitle}>معاينة الإعلان</Text>

        <View style={s.previewCard}>
          <View style={s.previewRow}>
            <View style={s.imgBox}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={s.previewImg} contentFit="cover" />
              ) : (
                <View style={[s.previewImg, s.imgPlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={Colors.border} />
                </View>
              )}
              {(store.images.length > 0 || (store.existingImages && store.existingImages.length > 0)) && (
                <View style={s.photoBadge}>
                  <Ionicons name="camera" size={14} color={Colors.text} />
                  <Text style={s.photoBadgeTxt}>{(store.images.length || 0) + (store.existingImages?.length || 0)}</Text>
                </View>
              )}
            </View>
            <View style={s.infoBox}>
              <Text style={s.previewTitle} numberOfLines={2}>
                {store.title || 'عنوان الإعلان'}
              </Text>
              <Text style={s.previewPrice}>
                {store.category === 'services' && store.details?.priceFrom
                  ? `يبدأ من ${parseFloat(String(store.details.priceFrom)).toLocaleString()} ر.ع`
                  : store.category === 'services' && !store.price && !store.details?.priceFrom
                  ? 'حسب الخدمة والمعاينة'
                  : ['RENTAL', 'EQUIPMENT_RENT'].includes(store.details?.listingType) && store.details?.dailyPrice
                  ? `${parseFloat(String(store.details.dailyPrice)).toLocaleString()} ر.ع / يوم`
                  : ['WANTED', 'EQUIPMENT_WANTED'].includes(store.details?.listingType) && store.details?.budgetMax
                  ? `${parseFloat(String(store.details.budgetMax)).toLocaleString()} ر.ع (ميزانية)`
                  : store.price
                  ? `${parseFloat(String(store.price)).toLocaleString()} ر.ع`
                  : '—'}
              </Text>
              <Text style={s.previewSub}>
                {[govLabel, cityLabel].filter(Boolean).join('، ')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>خيارات الترويج</Text>

        <View style={s.promos}>
          <TouchableOpacity
            style={[s.promoCard, promo === 'free' && s.promoCardFreeActive]}
            onPress={() => setPromo('free')}
            activeOpacity={0.8}
          >
            <View style={[s.radioWrap, promo === 'free' && s.radioActive]}>
              {promo === 'free' && <View style={s.radioInner} />}
            </View>
            <View style={s.promoInfo}>
              <Text style={s.promoTitle}>إعلان عادي - مجاني</Text>
              <Text style={s.promoSub}>يظهر في القوائم العادية</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.promoCard, promo === 'premium' && s.promoCardPremiumActive]}
            onPress={() => setPromo('premium')}
            activeOpacity={0.8}
          >
            <View style={[s.radioWrap, promo === 'premium' && s.radioActive]}>
              {promo === 'premium' && <View style={s.radioInner} />}
            </View>
            <View style={s.promoInfo}>
              <View style={s.promoTitleRow}>
                <Ionicons name="star" size={18} color={Colors.primary} />
                <Text style={[s.promoTitle, { color: Colors.primary }]}>إعلان مميز - 15 ر.ع</Text>
              </View>
              <Text style={s.promoSub}>يظهر في أعلى نتائج البحث لمدة 7 أيام</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.promoCard, promo === 'elite' && s.promoCardEliteActive]}
            onPress={() => setPromo('elite')}
            activeOpacity={0.8}
          >
            <View style={[s.radioWrap, promo === 'elite' && s.radioActive]}>
              {promo === 'elite' && <View style={s.radioInner} />}
            </View>
            <View style={s.promoInfo}>
              <View style={s.promoTitleRow}>
                <Ionicons name="diamond" size={18} color={Colors.accent} />
                <Text style={[s.promoTitle, { color: Colors.accent }]}>إعلان Elite - 30 ر.ع</Text>
              </View>
              <Text style={s.promoSub}>تمييز حصري، يظهر في الصفحة الرئيسية أعلى النتائج لمدة 14 يوم</Text>
            </View>
          </TouchableOpacity>
        </View>

        <AppButton
          title="نشر الإعلان الآن"
          icon="rocket"
          onPress={handlePublish}
          loading={loading}
        />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: Spacing.space4, paddingBottom: Spacing.space6 },
  progressWrap: { marginBottom: Spacing.space6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.space2 },
  progressStepTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.textMuted },
  progressTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },
  progressBarBg: { height: 10, backgroundColor: Colors.surface, borderRadius: 100, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 100 },
  sectionTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space3 },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.space4,
    marginBottom: Spacing.space6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  previewRow: { flexDirection: 'row', gap: Spacing.space3 },
  imgBox: { width: 100, height: 100, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
  previewImg: { width: '100%', height: '100%' },
  imgPlaceholder: { backgroundColor: '#eceef1', alignItems: 'center', justifyContent: 'center' },
  photoBadge: { position: 'absolute', bottom: 4, start: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoBadgeTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.text },
  infoBox: { flex: 1, justifyContent: 'space-around' },
  previewTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, writingDirection: 'rtl' },
  previewPrice: { fontFamily: 'Almarai_700Bold',  fontSize: 15, color: Colors.primary },
  previewSub: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.textMuted, writingDirection: 'rtl' },
  promos: { marginBottom: Spacing.space6 },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginBottom: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  promoCardFreeActive: { borderColor: Colors.text2, backgroundColor: '#f2f4f7' },
  promoCardPremiumActive: { borderColor: Colors.primary, backgroundColor: '#eff6ff' },
  promoCardEliteActive: { borderColor: Colors.accent, backgroundColor: '#FFF8F2' },
  radioWrap: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginEnd: Spacing.space3 },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  promoInfo: { flex: 1 },
  promoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, marginBottom: 2 },
  promoTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text, writingDirection: 'rtl' },
  promoSub: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.textMuted, writingDirection: 'rtl' },
})
