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
import {
  CAR_FEATURE_KEYS,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  CONDITION_TYPES,
  BODY_TYPES,
  DRIVE_TYPES,
  CAR_LISTING_TYPES,
  CAR_COLORS,
} from '../../src/constants/cars'
import { useBrands } from '../../src/hooks/useCars'
import { useQueryClient } from '@tanstack/react-query'
import { dialogService } from '../../src/store/dialogStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function PostStep5Screen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const store = usePostStore()
  const queryClient = useQueryClient()
  const { data: brands } = useBrands()

  const cardWidth = Math.min(SCREEN_WIDTH - 24, 568)

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

    if (store.category === 'cars') {
      if (!store.details?.brandId || !store.details?.carModelId) {
        dialogService.alert('بيانات غير مكتملة', 'يرجى إعادة اختيار الماركة والموديل')
        return
      }
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
        governorateId: store.governorateId || store.details?.governorateId,
        wilayaId: store.wilayaId || store.details?.wilayaId,
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
        'governorate',
        'city',
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

      // Category-specific payload cleanup
      if (store.category === 'services') {
        delete payload.price
        delete payload.isPriceNegotiable

        // Ensure providerType has a valid default if missing
        if (!payload.providerType) {
          payload.providerType = 'WORKSHOP'
        }
      }

      if (store.category === 'cars') {
        delete payload.make
        delete payload.model
        delete payload.trim
      }

      if (store.category === 'parts') {
        delete payload.exteriorColor
        delete payload.interior
        delete payload.listingType
        delete payload.type
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
        'governorateId',
        'wilayaId',
      ]
      numericFields.forEach((field) => {
        if (payload[field] != null && payload[field] !== '') {
          payload[field] = parseFloat(String(payload[field]))
        } else if (payload[field] === '') {
          delete payload[field]
        }
      })

      // Cleanup empty string ID fields to prevent validation errors
      const stringIdFields = ['brandId', 'carModelId', 'carTrimId']
      stringIdFields.forEach((field) => {
        if (payload[field] === '') {
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
        payload.version = store.details?.version;
        
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
      if (err?.response?.status === 409) {
        dialogService.alert('خطأ التزامن', 'تم تعديل هذا الإعلان من جهاز آخر، يرجى إعادة تحميل البيانات')
        return
      }
      
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
      ? store.details.compatibleMakes
          .map((m: string) => {
            if (m === 'all') return 'متوافق مع جميع السيارات'
            const foundApi = brands?.find((b) => b.id === m)
            if (foundApi) return foundApi.nameAr || foundApi.name
            const foundLocal = POPULAR_PART_MAKES.find((p) => p.id === m)
            return foundLocal ? foundLocal.label : m
          })
          .join('، ')
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
            <Text style={s.specLabel} numberOfLines={1}>{item.label}</Text>
            <Text style={s.specVal} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{String(item.value)}</Text>
          </View>
        ))}
      </View>
    )
  }

  // Helper for rendering Car specifications
  const renderCarSpecs = () => {
    const d = store.details || {}
    const transLabel = TRANSMISSION_TYPES.find((t) => t.value === d.transmission)?.label || d.transmission
    const fuelLabel = FUEL_TYPES.find((f) => f.value === d.fuelType)?.label || d.fuelType
    const condLabel = CONDITION_TYPES.find((c) => c.value === d.condition)?.label || d.condition
    const bodyLabel = BODY_TYPES.find((b) => b.value === d.bodyType)?.label || d.bodyType
    const driveLabel = DRIVE_TYPES.find((dt) => dt.value === d.driveType)?.label || d.driveType
    const extColorLabel = CAR_COLORS.find((c) => c.value === (d.exteriorColor || d.color))?.label || d.exteriorColor || d.color
    const intColorLabel = CAR_COLORS.find((c) => c.value === (d.interior || d.interiorColor))?.label || d.interior || d.interiorColor

    const specs = [
      { label: 'الماركة والموديل', value: [d.make, d.model, d.trim].filter(Boolean).join(' ') },
      { label: 'سنة الصنع', value: d.year },
      { label: 'الحالة', value: condLabel },
      { label: 'الممشى', value: d.mileage ? `${Number(d.mileage).toLocaleString()} كم` : null },
      { label: 'ناقل الحركة', value: transLabel },
      { label: 'نوع الوقود', value: fuelLabel },
      { label: 'شكل السيارة', value: bodyLabel },
      { label: 'نظام الدفع', value: driveLabel },
      { label: 'سعة المحرك', value: d.engineSize ? `${d.engineSize} CC` : null },
      { label: 'الأحصنة', value: d.horsepower ? `${d.horsepower} حصان` : null },
      { label: 'عدد الأبواب', value: d.doors ? `${d.doors} أبواب` : null },
      { label: 'اللون الخارجي', value: extColorLabel },
      { label: 'اللون الداخلي', value: intColorLabel },
    ].filter((s) => Boolean(s.value))

    // Rental terms if rental
    const rentalSpecs = d.listingType === 'RENTAL' ? [
      { label: 'الإيجار اليومي', value: d.dailyPrice ? `${d.dailyPrice} ر.ع` : null },
      { label: 'الإيجار الشهري', value: d.monthlyPrice ? `${d.monthlyPrice} ر.ع` : null },
      { label: 'مبلغ التأمين', value: d.depositAmount ? `${d.depositAmount} ر.ع` : null },
      { label: 'أقل مدة حجز', value: d.minRentalDays ? `${d.minRentalDays} أيام` : null },
      { label: 'حد المسافة اليومي', value: d.kmLimitPerDay ? `${d.kmLimitPerDay} كم/يوم` : null },
      { label: 'مع سائق', value: d.withDriver ? 'نعم' : 'لا' },
      { label: 'تأمين شامل', value: d.insuranceIncluded ? 'نعم' : 'لا' },
      { label: 'توصيل للموقع', value: d.deliveryAvailable ? 'نعم' : 'لا' },
    ].filter((s) => Boolean(s.value)) : []

    return (
      <>
        <View style={s.specsGrid}>
          {specs.map((item, idx) => (
            <View key={idx} style={s.specItem}>
              <Text style={s.specLabel} numberOfLines={1}>{item.label}</Text>
              <Text style={s.specVal} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{String(item.value)}</Text>
            </View>
          ))}
        </View>

        {rentalSpecs.length > 0 && (
          <View style={{ marginTop: Spacing.space3 }}>
            <Text style={s.subSectionTitle}>شروط وبنود الإيجار</Text>
            <View style={s.specsGrid}>
              {rentalSpecs.map((item, idx) => (
                <View key={idx} style={[s.specItem, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' }]}>
                  <Text style={s.specLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={[s.specVal, { color: Colors.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{String(item.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    )
  }

  // Helper for rendering Bus specifications
  const renderBusSpecs = () => {
    const d = store.details || {}
    const specs = [
      { label: 'الماركة والموديل', value: [d.make, d.model].filter(Boolean).join(' ') },
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
            <Text style={s.specLabel} numberOfLines={1}>{item.label}</Text>
            <Text style={s.specVal} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{String(item.value)}</Text>
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
      {
        label: 'صفة المزود',
        value: d.providerType === 'WORKSHOP' ? 'ورشة / مركز' : d.providerType === 'INDIVIDUAL' ? 'فني مستقل' : d.providerType,
      },
      { label: 'خدمة متنقلة', value: d.isHomeService ? 'نعم، في موقع العميل' : 'في الورشة / المركز' },
      { label: 'أيام العمل', value: Array.isArray(d.workingDays) ? d.workingDays.join('، ') : d.workingDays },
      { label: 'ساعات العمل', value: [d.workingHoursOpen, d.workingHoursClose].filter(Boolean).join(' إلى ') },
      { label: 'العنوان', value: d.address },
    ].filter((s) => Boolean(s.value))

    return (
      <View style={s.specsGrid}>
        {specs.map((item, idx) => (
          <View key={idx} style={s.specItem}>
            <Text style={s.specLabel} numberOfLines={1}>{item.label}</Text>
            <Text style={s.specVal} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{String(item.value)}</Text>
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
  const carFeatures = Array.isArray(store.details?.features) ? store.details.features : []
  const listingTypeVal = store.details?.listingType || store.details?.type
  const listingTypeLabel = CAR_LISTING_TYPES.find((lt) => lt.value === listingTypeVal)?.label

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

          {/* ── 1. معرض الصور (Un-zoomed & Refined) ── */}
          {allImages.length > 0 ? (
            <View style={s.galleryCard}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x
                  const idx = Math.round(x / cardWidth)
                  setActiveImageIndex(idx)
                }}
              >
                {allImages.map((uri, index) => (
                  <View key={index} style={[s.slideWrap, { width: cardWidth }]}>
                    <Image source={{ uri }} style={s.slideImg} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
              <View style={s.photoCounterBadge}>
                <Ionicons name="camera" size={12} color={Colors.white} />
                <Text style={s.photoCounterTxt}>
                  {activeImageIndex + 1} / {allImages.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.noImageCard}>
              <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
              <Text style={s.noImageTxt}>لم يتم إرفاق صور لهذا الإعلان</Text>
            </View>
          )}

          {/* ── 2. بطاقة السعر والعنوان ── */}
          <View style={s.card}>
            <View style={s.badgeRow}>
              <View style={s.categoryBadge}>
                <Text style={s.categoryBadgeTxt}>{categoryLabel}</Text>
              </View>
              {listingTypeLabel && (
                <View style={[s.categoryBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[s.categoryBadgeTxt, { color: Colors.text2 }]}>{listingTypeLabel}</Text>
                </View>
              )}
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
              <Ionicons name="location-sharp" size={14} color={Colors.primary} />
              <Text style={s.locationTxt}>{locationText}</Text>
            </View>
          </View>

          {/* ── 3. المواصفات والتفاصيل ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.headerIconWrap}>
                <MaterialCommunityIcons name="format-list-bulleted" size={14} color={Colors.primary} />
              </View>
              <Text style={s.cardTitle}>المواصفات الفنية والتفاصيل</Text>
            </View>

            {renderCategorySpecs()}
          </View>

          {/* ── 4. المميزات والإضافات (للسيارات) ── */}
          {store.category === 'cars' && carFeatures.length > 0 && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.headerIconWrap}>
                  <Ionicons name="sparkles" size={14} color={Colors.primary} />
                </View>
                <Text style={s.cardTitle}>المميزات والإضافات ({carFeatures.length})</Text>
              </View>

              <View style={s.featuresWrap}>
                {carFeatures.map((featId: string) => {
                  const feat = CAR_FEATURE_KEYS.find((f) => f.id === featId)
                  return (
                    <View key={featId} style={s.featureBadge}>
                      <Ionicons
                        name={(feat?.icon as any) || 'checkmark-circle'}
                        size={13}
                        color={Colors.primary}
                      />
                      <Text style={s.featureBadgeTxt}>{feat?.label || featId}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* ── 5. الوصف ── */}
          {store.description ? (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.headerIconWrap}>
                  <Ionicons name="document-text-outline" size={14} color={Colors.primary} />
                </View>
                <Text style={s.cardTitle}>تفاصيل الإعلان والوصف</Text>
              </View>
              <Text style={s.descriptionTxt}>{store.description}</Text>
            </View>
          ) : null}

          {/* ── 6. بيانات التواصل ── */}
          {(contactPhone || whatsappNumber) && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.headerIconWrap}>
                  <Ionicons name="call-outline" size={14} color={Colors.primary} />
                </View>
                <Text style={s.cardTitle}>بيانات التواصل</Text>
              </View>

              <View style={s.contactRow}>
                {contactPhone ? (
                  <View style={s.contactItem}>
                    <Ionicons name="call" size={14} color={Colors.primary} />
                    <Text style={s.contactTxt}>{contactPhone}</Text>
                  </View>
                ) : null}

                {whatsappNumber ? (
                  <View style={[s.contactItem, s.whatsappItem]}>
                    <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
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
    height: 195,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginBottom: Spacing.space3,
  },
  slideWrap: {
    height: 195,
  },
  slideImg: {
    width: '100%',
    height: '100%',
  },
  photoCounterBadge: {
    position: 'absolute',
    bottom: 10,
    start: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoCounterTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.white,
  },
  noImageCard: {
    width: '100%',
    height: 90,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    marginBottom: Spacing.space3,
  },
  noImageTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  headerIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  subSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.pill,
  },
  categoryBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.primary,
  },
  negotiableBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.pill,
  },
  negotiableBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: '#059669',
  },
  mainTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 22,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 4,
  },
  priceRow: {
    marginBottom: 4,
  },
  priceTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.primary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specItem: {
    width: '31.8%',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    minHeight: 56,
  },
  specLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: 2,
  },
  specVal: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'center',
    flexShrink: 1,
  },
  featuresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  featureBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
  descriptionTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  whatsappItem: {
    backgroundColor: '#F0FDF4',
  },
  contactTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  bottomBarWrap: {
    backgroundColor: Colors.white,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.space2,
    paddingHorizontal: Spacing.space3,
  },
})
