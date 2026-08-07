import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { listingsApi } from '../../src/api/listings'
import { jobsApi } from '../../src/api/jobs'
import { servicesApi } from '../../src/api/services'
import { partsApi } from '../../src/api/parts'
import { equipmentApi } from '../../src/api/equipment'
import { transportApi } from '../../src/api/transport'
import { busesApi } from '../../src/api/buses'
import { uploadsApi } from '../../src/api/uploads'
import { getPostGovLabel, getPostCityLabel } from '../../src/constants/locations'
import { PART_CATEGORIES, PART_CONDITIONS, POPULAR_PART_MAKES } from '../../src/constants/parts'
import { useQueryClient } from '@tanstack/react-query'
import { dialogService } from '../../src/store/dialogStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function PostStep5Screen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const store = usePostStore()
  const queryClient = useQueryClient()

  // Collect all images (existing edit-mode images + newly picked images)
  const allImages = [
    ...(store.existingImages?.map((i) => i.url) || []),
    ...(store.images || []),
  ]

  const handlePublish = async () => {
    if (!store.title || !store.title.trim()) {
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
        'category',
        'locationNote',
        'images',
        'id',
        'slug',
        'isPremium',
        'featuredUntil',
        'viewCount',
        'sellerId',
        'createdAt',
        'updatedAt',
        'seller',
        'color',
        'interiorColor',
        'existingImages',
        'removedImageIds',
        'status',
        'userId',
        'user',
      ]
      forbiddenFields.forEach((field) => delete payload[field])

      // Re-attach the finalised images array so the backend can save them
      payload.images = store.editMode
        ? [...(store.existingImages?.map((i) => i.url) || []), ...(store.images || [])]
        : store.images || []

      // Ensure price is not negative
      if (typeof payload.price === 'number' && payload.price < 0) {
        payload.price = 0
      }

      // If images array is empty, do not send it
      if (Array.isArray(payload.images) && payload.images.length === 0) {
        delete payload.images
      }

      // For WANTED listings, backend explicitly forbids images property
      const listingTypeStr = String(
        payload.listingType || payload.type || store.details?.listingType || ''
      ).toUpperCase()
      if (listingTypeStr.includes('WANTED')) {
        delete payload.images
      }

      const numericFields = [
        'mileage',
        'dailyPrice',
        'monthlyPrice',
        'depositAmount',
        'minRentalDays',
        'kmLimitPerDay',
        'experienceYears',
        'horsepower',
        'doors',
        'year',
        'hoursUsed',
        'budgetMax',
        'capacity',
        'contractMonthly',
        'contractDuration',
        'priceFrom',
        'priceTo',
        'pricePerHour',
        'yearFrom',
        'yearTo',
      ]
      numericFields.forEach((field) => {
        if (payload[field] != null && payload[field] !== '') {
          payload[field] = parseFloat(String(payload[field]))
        } else if (payload[field] === '') {
          delete payload[field]
        }
      })

      // Format compatibleModels if string
      if (typeof payload.compatibleModels === 'string' && payload.compatibleModels.trim()) {
        payload.compatibleModels = (payload.compatibleModels as string)
          .split(/[,،]/)
          .map((m: string) => m.trim())
          .filter(Boolean)
      }

      // Format workingDays if string
      if (typeof payload.workingDays === 'string' && payload.workingDays.trim()) {
        payload.workingDays = [(payload.workingDays as string).trim()]
      }

      if (store.editMode && store.editListingId) {
        switch (store.category) {
          case 'jobs':
            await jobsApi.update(store.editListingId, payload as any)
            break
          case 'services':
            await servicesApi.update(store.editListingId, payload as any)
            break
          case 'parts':
            await partsApi.update(store.editListingId, payload as any)
            break
          case 'equipment':
            await equipmentApi.update(store.editListingId, payload as any)
            break
          case 'transport':
            await transportApi.update(store.editListingId, payload as any)
            break
          case 'buses':
            await busesApi.update(store.editListingId, payload as any)
            break
          default:
            await listingsApi.update(store.editListingId, payload as any)
            break
        }

        // Cleanup removed images
        if (store.removedImageIds && store.removedImageIds.length > 0) {
          for (const imgId of store.removedImageIds) {
            try {
              if (store.category === 'parts') {
                await uploadsApi.removePartImage(imgId)
              } else if (store.category === 'services') {
                await uploadsApi.removeServiceImage(imgId)
              } else {
                await uploadsApi.removeListingImage(store.editListingId, imgId)
              }
            } catch {
              // ignore cleanup errors
            }
          }
        }
      } else {
        switch (store.category) {
          case 'jobs':
            await jobsApi.create(payload as any)
            break
          case 'services':
            await servicesApi.create(payload as any)
            break
          case 'parts':
            await partsApi.create(payload as any)
            break
          case 'equipment':
            await equipmentApi.create(payload as any)
            break
          case 'transport':
            await transportApi.create(payload as any)
            break
          case 'buses':
            await busesApi.create(payload as any)
            break
          default:
            await listingsApi.create(payload as any)
            break
        }
      }

      await queryClient.invalidateQueries()
      store.reset()
      dialogService.alert(
        store.editMode ? 'تم التعديل' : 'تم النشر بنجاح',
        store.editMode ? 'تم تحديث بيانات إعلانك بنجاح!' : 'تم نشر إعلانك في سوق ون بنجاح!',
        'success'
      )
      router.replace('/(tabs)')
    } catch (err: any) {
      let msg = store.editMode ? 'حدث خطأ أثناء تعديل الإعلان' : 'حدث خطأ أثناء نشر الإعلان'
      if (err?.response?.data?.message) {
        const errorData = err.response.data.message
        if (Array.isArray(errorData)) {
          msg = errorData.join('\n')
        } else if (typeof errorData === 'string') {
          msg = errorData
        } else {
          msg = JSON.stringify(errorData)
        }
      } else if (err?.message) {
        msg = err.message
      }
      dialogService.alert('خطأ', String(msg))
    } finally {
      setLoading(false)
    }
  }

  const govLabel = getPostGovLabel(store.governorate)
  const cityLabel = getPostCityLabel(store.governorate, store.city)
  const locationText = [govLabel, cityLabel].filter(Boolean).join(' • ') || 'غير محدد'

  // Format category badge
  const categoryLabelMap: Record<string, string> = {
    cars: 'سيارات ومركبات',
    parts: 'قطع غيار ولوازم',
    buses: 'حافلات وباصات',
    services: 'خدمات وورش',
    equipment: 'معدات ثقيلة',
    transport: 'نقل وشحن',
    jobs: 'وظائف',
  }
  const categoryLabel = categoryLabelMap[store.category] || store.category

  // Helper for rendering Part specifications
  const renderPartSpecs = () => {
    const partCat = PART_CATEGORIES.find((c) => c.id === store.details?.partCategory)
    const partCond = PART_CONDITIONS.find((c) => c.id === store.details?.condition)
    const makesList = Array.isArray(store.details?.compatibleMakes)
      ? store.details.compatibleMakes.map((m: string) => {
          const found = POPULAR_PART_MAKES.find((p) => p.id === m)
          return found ? found.label : m
        }).join('، ')
      : ''

    const yearsText = [store.details?.yearFrom, store.details?.yearTo]
      .filter(Boolean)
      .join(' - ')

    const specs = [
      { label: 'قسم القطعة', value: partCat?.label || store.details?.partCategory },
      { label: 'الحالة', value: partCond?.label || store.details?.condition },
      {
        label: 'الأصالة',
        value: store.details?.isOriginal === true ? 'أصلي وكالة' : 'تجاري / بديل',
      },
      { label: 'رقم القطعة (Part #)', value: store.details?.partNumber },
      { label: 'الماركات المتوافقة', value: makesList },
      { label: 'الموديلات المتوافقة', value: store.details?.compatibleModels },
      { label: 'سنة التوافق', value: yearsText },
    ].filter((s) => Boolean(s.value))

    return (
      <View style={s.specsGrid}>
        {specs.map((item, idx) => (
          <View key={idx} style={s.specItem}>
            <Text style={s.specLabel}>{item.label}</Text>
            <Text style={s.specVal}>{String(item.value)}</Text>
          </View>
        ))}
      </View>
    )
  }

  // Helper for rendering Car specifications
  const renderCarSpecs = () => {
    const d = store.details || {}
    const specs = [
      { label: 'الماركة', value: d.make },
      { label: 'الموديل', value: d.model },
      { label: 'سنة الصنع', value: d.year },
      { label: 'الممشى', value: d.mileage ? `${Number(d.mileage).toLocaleString()} كم` : null },
      { label: 'ناقل الحركة', value: d.transmission === 'AUTOMATIC' ? 'أوتوماتيك' : d.transmission === 'MANUAL' ? 'يدوي' : d.transmission },
      { label: 'نوع الوقود', value: d.fuelType },
      { label: 'سعة المحرك', value: d.engineSize ? `${d.engineSize} CC` : null },
      { label: 'اللون الخارجي', value: d.exteriorColor || d.color },
      { label: 'اللون الداخلي', value: d.interior || d.interiorColor },
    ].filter((s) => Boolean(s.value))

    return (
      <View style={s.specsGrid}>
        {specs.map((item, idx) => (
          <View key={idx} style={s.specItem}>
            <Text style={s.specLabel}>{item.label}</Text>
            <Text style={s.specVal}>{String(item.value)}</Text>
          </View>
        ))}
      </View>
    )
  }

  // Helper for rendering Bus specifications
  const renderBusSpecs = () => {
    const d = store.details || {}
    const specs = [
      { label: 'الماركة', value: d.make },
      { label: 'الموديل', value: d.model },
      { label: 'سنة الصنع', value: d.year },
      { label: 'عدد المقاعد', value: d.capacity ? `${d.capacity} راكب` : null },
      { label: 'الممشى', value: d.mileage ? `${Number(d.mileage).toLocaleString()} كم` : null },
      { label: 'نوع الوقود', value: d.fuelType },
      { label: 'رقم اللوحة', value: d.plateNumber },
    ].filter((s) => Boolean(s.value))

    return (
      <View style={s.specsGrid}>
        {specs.map((item, idx) => (
          <View key={idx} style={s.specItem}>
            <Text style={s.specLabel}>{item.label}</Text>
            <Text style={s.specVal}>{String(item.value)}</Text>
          </View>
        ))}
      </View>
    )
  }

  // Helper for rendering Service specifications
  const renderServiceSpecs = () => {
    const d = store.details || {}
    const specs = [
      { label: 'نوع الخدمة', value: d.serviceType },
      { label: 'مقدم الخدمة', value: d.providerName },
      { label: 'صفة المزود', value: d.providerType === 'WORKSHOP' ? 'ورشة / مركز' : d.providerType === 'INDIVIDUAL' ? 'فني مستقل' : d.providerType },
      { label: 'خدمة متنقلة', value: d.isHomeService ? 'نعم، في موقع العميل' : 'في الورشة / المركز' },
      { label: 'أيام العمل', value: Array.isArray(d.workingDays) ? d.workingDays.join('، ') : d.workingDays },
      { label: 'ساعات العمل', value: [d.workingHoursOpen, d.workingHoursClose].filter(Boolean).join(' إلى ') },
      { label: 'العنوان', value: d.address },
    ].filter((s) => Boolean(s.value))

    return (
      <View style={s.specsGrid}>
        {specs.map((item, idx) => (
          <View key={idx} style={s.specItem}>
            <Text style={s.specLabel}>{item.label}</Text>
            <Text style={s.specVal}>{String(item.value)}</Text>
          </View>
        ))}
      </View>
    )
  }

  const renderCategorySpecs = () => {
    switch (store.category) {
      case 'parts':
        return renderPartSpecs()
      case 'cars':
        return renderCarSpecs()
      case 'buses':
        return renderBusSpecs()
      case 'services':
        return renderServiceSpecs()
      default:
        return null
    }
  }

  const contactPhone = store.details?.contactPhone
  const whatsappNumber = store.details?.whatsapp

  return (
    <View style={s.root}>
      <AppHeader title="معاينة الإعلان والنشر" showBack />

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.centerWrap}>
          <View style={s.progressWrap}>
            <Stepper currentStep={5} totalSteps={5} title="المعاينة النهائية والنشر" />
          </View>

          {/* ── 1. معرض الصور ── */}
          {allImages.length > 0 ? (
            <View style={s.galleryCard}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x
                  const idx = Math.round(x / (SCREEN_WIDTH > 600 ? 568 : SCREEN_WIDTH - 32))
                  setActiveImageIndex(idx)
                }}
              >
                {allImages.map((uri, index) => (
                  <View key={index} style={s.slideWrap}>
                    <Image source={{ uri }} style={s.slideImg} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
              <View style={s.photoCounterBadge}>
                <Ionicons name="camera" size={14} color={Colors.white} />
                <Text style={s.photoCounterTxt}>
                  {activeImageIndex + 1} / {allImages.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.noImageCard}>
              <Ionicons name="image-outline" size={40} color={Colors.textMuted} />
              <Text style={s.noImageTxt}>لم يتم إرفاق صور لهذا الإعلان</Text>
            </View>
          )}

          {/* ── 2. بطاقة السعر والعنوان ── */}
          <View style={s.card}>
            <View style={s.badgeRow}>
              <View style={s.categoryBadge}>
                <Text style={s.categoryBadgeTxt}>{categoryLabel}</Text>
              </View>
              {store.isPriceNegotiable && (
                <View style={s.negotiableBadge}>
                  <Text style={s.negotiableBadgeTxt}>قابل للتفاوض</Text>
                </View>
              )}
            </View>

            <Text style={s.mainTitle}>{store.title || 'عنوان الإعلان'}</Text>

            <View style={s.priceRow}>
              <Text style={s.priceTxt}>
                {store.category === 'services' && store.details?.priceFrom
                  ? `يبدأ من ${parseFloat(String(store.details.priceFrom)).toLocaleString()} ر.ع`
                  : store.category === 'services' && !store.price && !store.details?.priceFrom
                  ? 'حسب الخدمة والمعاينة'
                  : ['RENTAL', 'EQUIPMENT_RENT'].includes(store.details?.listingType) &&
                    store.details?.dailyPrice
                  ? `${parseFloat(String(store.details.dailyPrice)).toLocaleString()} ر.ع / يوم`
                  : ['WANTED', 'EQUIPMENT_WANTED'].includes(store.details?.listingType) &&
                    store.details?.budgetMax
                  ? `الميزانية حتى ${parseFloat(String(store.details.budgetMax)).toLocaleString()} ر.ع`
                  : store.price
                  ? `${parseFloat(String(store.price)).toLocaleString()} ر.ع`
                  : 'السعر غير محدد'}
              </Text>
            </View>

            <View style={s.divider} />

            <View style={s.locationRow}>
              <Ionicons name="location-sharp" size={16} color={Colors.primary} />
              <Text style={s.locationTxt}>{locationText}</Text>
            </View>
          </View>

          {/* ── 3. المواصفات والتفاصيل ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="format-list-bulleted" size={18} color={Colors.primary} />
              <Text style={s.cardTitle}>المواصفات والتفاصيل</Text>
            </View>

            {renderCategorySpecs()}
          </View>

          {/* ── 4. الوصف ── */}
          {store.description ? (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                <Text style={s.cardTitle}>تفاصيل الإعلان والوصف</Text>
              </View>
              <Text style={s.descriptionTxt}>{store.description}</Text>
            </View>
          ) : null}

          {/* ── 5. بيانات التواصل ── */}
          {(contactPhone || whatsappNumber) && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
                <Text style={s.cardTitle}>بيانات التواصل</Text>
              </View>

              <View style={s.contactRow}>
                {contactPhone ? (
                  <View style={s.contactItem}>
                    <Ionicons name="call" size={16} color={Colors.primary} />
                    <Text style={s.contactTxt}>{contactPhone}</Text>
                  </View>
                ) : null}

                {whatsappNumber ? (
                  <View style={[s.contactItem, s.whatsappItem]}>
                    <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                    <Text style={[s.contactTxt, { color: '#16A34A' }]}>{whatsappNumber}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </View>
      </ScrollView>

      {/* ── شريط الأزرار السفلي ── */}
      <View
        style={[
          s.bottomBarWrap,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={s.bottomBarContent}>
          <AppButton
            variant="outline"
            size="sm"
            title="السابق / تعديل"
            onPress={() => router.back()}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <AppButton
            title={store.editMode ? 'حفظ التعديلات' : 'تأكيد ونشر الإعلان'}
            icon="rocket"
            size="sm"
            onPress={handlePublish}
            loading={loading}
            style={{ flex: 1.4 }}
          />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  flex1: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.space3,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space5,
  },
  centerWrap: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  progressWrap: {
    marginBottom: Spacing.space3,
  },
  galleryCard: {
    width: '100%',
    height: 240,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    marginBottom: Spacing.space3,
  },
  slideWrap: {
    width: SCREEN_WIDTH > 600 ? 568 : SCREEN_WIDTH - 32,
    height: 240,
  },
  slideImg: {
    width: '100%',
    height: '100%',
  },
  photoCounterBadge: {
    position: 'absolute',
    bottom: 12,
    start: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoCounterTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.white,
  },
  noImageCard: {
    width: '100%',
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    marginBottom: Spacing.space3,
  },
  noImageTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space3,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space2,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  categoryBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  negotiableBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  negotiableBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#059669',
  },
  mainTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: Spacing.space2,
  },
  priceRow: {
    marginBottom: Spacing.space2,
  },
  priceTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
    color: Colors.primary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.space2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  specItem: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    padding: Spacing.space3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  specLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 2,
  },
  specVal: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  descriptionTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  whatsappItem: {
    backgroundColor: '#F0FDF4',
  },
  contactTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primary,
  },
  bottomBarWrap: {
    backgroundColor: Colors.white,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space4,
  },
})
