import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { listingsApi } from '../../../src/api/listings'
import { busesApi } from '../../../src/api/buses'
import { equipmentApi } from '../../../src/api/equipment'
import { partsApi } from '../../../src/api/parts'
import { servicesApi } from '../../../src/api/services'
import { usePostStore } from '../../../src/store/postStore'
import { useBusWizardStore } from '../../../src/store/busWizardStore'
import { useCarWizardStore } from '../../../src/store/carWizardStore'
import { usePartWizardStore } from '../../../src/store/partWizardStore'
import { useServiceWizardStore } from '../../../src/store/serviceWizardStore'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { carsApi } from '../../../src/api/cars'

export default function EditListingLoader() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>()
  const { set, reset } = usePostStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchListing() {
      if (!id) return
      try {
        let res;
        if (type === 'operator') {
          res = await equipmentApi.getOperatorById(id)
        } else if (type === 'equipment') {
          res = await equipmentApi.getById(id)
        } else if (type === 'bus' || type === 'buses') {
          res = await busesApi.getById(id)
        } else if (type === 'parts' || type === 'part') {
          res = await partsApi.getById(id)
        } else if (type === 'services' || type === 'service') {
          res = await servicesApi.getById(id)
        } else {
          try {
            res = await listingsApi.getById(id)
          } catch {
            try {
              res = await partsApi.getById(id)
            } catch {
              try {
                res = await servicesApi.getById(id)
              } catch {
                res = await busesApi.getById(id)
              }
            }
          }
        }
        const listing: any = res.data ?? res

        const isBus = type === 'bus' || type === 'buses' || !!listing.busListingType || !!listing.busType

        if (isBus) {
          useBusWizardStore.getState().setEditMode(id, {
            busListingType: listing.busListingType || '',
            busType: listing.busType || '',
            make: listing.make || '',
            model: listing.model || '',
            year: listing.year ? String(listing.year) : '',
            capacity: listing.capacity ? String(listing.capacity) : '',
            condition: listing.condition || '',
            transmission: listing.transmission || '',
            fuelType: listing.fuelType || '',
            mileage: listing.mileage ? String(listing.mileage) : '',
            plateNumber: listing.plateNumber || '',
            features: listing.features || [],
            price: listing.price ? String(listing.price) : '',
            isPriceNegotiable: listing.isPriceNegotiable || false,
            dailyPrice: listing.dailyPrice ? String(listing.dailyPrice) : '',
            monthlyPrice: listing.monthlyPrice ? String(listing.monthlyPrice) : '',
            withDriver: listing.withDriver || false,
            contractType: listing.contractType || '',
            contractClient: listing.contractClient || '',
            contractMonthly: listing.contractMonthly ? String(listing.contractMonthly) : '',
            contractDuration: listing.contractDuration ? String(listing.contractDuration) : '',
            title: listing.title || '',
            description: listing.description || '',
            governorate: listing.governorate || '',
            city: listing.city || '',
            latitude: listing.latitude ?? null,
            longitude: listing.longitude ?? null,
            existingImages: (listing.images || []).map((img: any) => ({
              id: img.id,
              url: img.url || img,
            })),
            images: [],
            removedImageIds: [],
            contactPhone: listing.contactPhone || '',
            whatsapp: listing.whatsapp || '',
          })
          router.replace('/buses/new')
          return
        }

        reset()

        // Extract and map images to existingImages format
        const existingImgs = (listing.images || []).map((img: any) => ({
          id: img.id,
          url: img.url || img,
          isPrimary: img.isPrimary,
        }))

        // Determine category mapping based on type or listingType
        // Mobile uses 'cars', 'buses', 'equipment', 'transport', 'jobs', 'services', 'parts'
        let category = 'cars'
        if (type === 'operator') category = 'operators'
        else if (type === 'equipment' || listing.type === 'equipment' || ['EQUIPMENT_SALE', 'EQUIPMENT_RENT', 'EQUIPMENT_WANTED', 'EQUIPMENT_LISTING'].includes(listing.listingType)) category = 'equipment'
        else if (type === 'transport' || listing.type === 'transport' || listing.listingType === 'TRANSPORT_REQUEST') category = 'transport'
        else if (type === 'jobs' || type === 'job' || listing.type === 'job' || listing.listingType === 'JOB') category = 'jobs'
        else if (type === 'service' || type === 'services' || listing.type === 'service' || listing.listingType === 'CAR_SERVICE' || !!listing.serviceType) category = 'services'
        else if (type === 'part' || type === 'parts' || listing.type === 'part' || listing.listingType === 'SPARE_PART' || !!listing.partCategory) category = 'parts'

        if (category === 'cars') {
          const brandId = listing.brandId || ''
          const carModelId = listing.carModelId || listing.modelId || ''
          const carTrimId = listing.carTrimId || listing.trimId || listing.trim || ''
          
          if (!brandId || !carModelId) {
            Alert.alert(
              'تحديث مطلوب',
              'هذا الإعلان قديم ويحتاج إلى تحديث الماركة والموديل للمتابعة',
              [{ text: 'حسناً' }]
            )
          }

          let makeLabel = ''
          let modelLabel = ''
          let trimLabel = ''

          try {
            console.log('Resolving car labels for:', { brandId, carModelId, carTrimId })
            if (brandId) {
              const brands = await carsApi.getBrands()
              const b = brands.find((x: any) => String(x.id) === String(brandId))
              console.log('Brands fetched:', brands?.length, 'Matched brand:', b?.nameAr || b?.name)
              if (b) makeLabel = b.nameAr || b.name
            }
            if (carModelId && brandId) {
              const models = await carsApi.getModels(brandId)
              const m = models.find((x: any) => String(x.id) === String(carModelId))
              console.log('Models fetched:', models?.length, 'Matched model:', m?.nameAr || m?.name)
              if (m) modelLabel = m.nameAr || m.name
            }
            if (carTrimId && carModelId) {
              const trims = await carsApi.getTrims(carModelId)
              const t = trims.find((x: any) => String(x.id) === String(carTrimId))
              console.log('Trims fetched:', trims?.length, 'Matched trim:', t?.nameAr || t?.name)
              if (t) trimLabel = t.nameAr || t.name
            }
          } catch (e) {
            console.warn('Failed to resolve car labels', e)
          }

          useCarWizardStore.getState().setEditMode(id, {
            listingType: listing.listingType || '',
            version: listing.version || 1,
            title: listing.title || '',
            description: listing.description || '',
            price: listing.price != null ? String(listing.price) : '',
            isPriceNegotiable: listing.isPriceNegotiable || false,
            governorateId: listing.governorateId ? Number(listing.governorateId) : null,
            wilayaId: listing.wilayaId ? Number(listing.wilayaId) : null,
            governorateName: listing.governorateRef?.nameAr || '',
            wilayaName: listing.wilayaRef?.nameAr || '',
            latitude: listing.latitude ?? null,
            longitude: listing.longitude ?? null,
            brandId: brandId,
            carModelId: carModelId,
            originalBrandId: brandId,
            originalCarModelId: carModelId,
            carTrimId: carTrimId,
            make: makeLabel,
            model: modelLabel,
            trim: trimLabel,
            year: listing.year != null ? String(listing.year) : '',
            condition: listing.condition || '',
            transmission: listing.transmission || '',
            fuelType: listing.fuelType || '',
            mileage: listing.mileage != null ? String(listing.mileage) : '',
            exteriorColor: listing.exteriorColor || listing.color || '',
            bodyType: listing.bodyType || '',
            engineSize: listing.engineSize != null ? String(listing.engineSize) : '',
            horsepower: listing.horsepower != null ? String(listing.horsepower) : '',
            doors: listing.doors != null ? String(listing.doors) : '',
            seats: listing.seats != null ? String(listing.seats) : '',
            driveType: listing.driveType || '',
            interior: listing.interior || listing.interiorColor || '',
            features: listing.features || [],
            dailyPrice: listing.dailyPrice != null ? String(listing.dailyPrice) : '',
            monthlyPrice: listing.monthlyPrice != null ? String(listing.monthlyPrice) : '',
            withDriver: listing.withDriver || false,
            depositAmount: listing.depositAmount != null ? String(listing.depositAmount) : '',
            minRentalDays: listing.minRentalDays != null ? String(listing.minRentalDays) : '',
            kmLimitPerDay: listing.kmLimitPerDay != null ? String(listing.kmLimitPerDay) : '',
            cancellationPolicy: listing.cancellationPolicy || '',
            deliveryAvailable: listing.deliveryAvailable || false,
            insuranceIncluded: listing.insuranceIncluded || false,
            existingImages: existingImgs,
            images: [],
            removedImageIds: [],
          })
          router.replace('/cars/new')
          return
        }

        if (category === 'parts') {
          usePartWizardStore.getState().setEditMode(id, {
            title: listing.title ?? '',
            description: listing.description ?? '',
            partCategory: listing.partCategory,
            condition: listing.condition,
            partNumber: listing.partNumber ?? '',
            compatibleMakes: listing.compatibleMakes ?? [],
            compatibleModels: listing.compatibleModels ?? [],
            yearFrom: listing.yearFrom ?? null,
            yearTo: listing.yearTo ?? null,
            isOriginal: listing.isOriginal ?? false,
            hasWarranty: listing.hasWarranty ?? false,
            warrantyDuration: listing.warrantyDuration ?? null,
            quantity: listing.quantity ?? null,
            compatibleVehicleTypes: listing.compatibleVehicleTypes ?? [],
            price: Number(listing.price) || null,
            currency: listing.currency ?? 'OMR',
            isPriceNegotiable: listing.isPriceNegotiable ?? false,
            contactPhone: listing.contactPhone ?? '',
            whatsapp: listing.whatsapp ?? '',
            governorateId: listing.governorateId ? Number(listing.governorateId) : null,
            wilayaId: listing.wilayaId ? Number(listing.wilayaId) : null,
            governorateNameAr: listing.governorateRef?.nameAr ?? listing.governorate ?? '',
            wilayaNameAr: listing.wilayaRef?.nameAr ?? listing.city ?? '',
            latitude: listing.latitude ?? null,
            longitude: listing.longitude ?? null,
            existingImages: (listing.images ?? []).map((img: any) => ({ id: img.id, url: img.url || img })),
          })
          router.replace('/parts/new')
          return
        }

        if (category === 'services') {
          useServiceWizardStore.getState().setEditMode(id, {
            title: listing.title ?? '',
            description: listing.description ?? '',
            serviceType: listing.serviceType ?? null,
            providerType: listing.providerType ?? null,
            providerName: listing.providerName ?? '',
            specializations: listing.specializations ?? [],
            isHomeService: Boolean(listing.isHomeService),
            workingHoursOpen: listing.workingHoursOpen ?? null,
            workingHoursClose: listing.workingHoursClose ?? null,
            workingDays: listing.workingDays ?? [],
            priceFrom: listing.priceFrom != null ? Number(listing.priceFrom) : (listing.price != null ? Number(listing.price) : null),
            priceTo: listing.priceTo != null ? Number(listing.priceTo) : null,
            currency: listing.currency ?? 'OMR',
            contactPhone: listing.contactPhone ?? '',
            whatsapp: listing.whatsapp ?? '',
            website: listing.website ?? '',
            governorateId: listing.governorateId ? Number(listing.governorateId) : null,
            wilayaId: listing.wilayaId ? Number(listing.wilayaId) : null,
            governorateNameAr: listing.governorateRef?.nameAr ?? listing.governorate ?? '',
            wilayaNameAr: listing.wilayaRef?.nameAr ?? listing.city ?? '',
            address: listing.address ?? '',
            latitude: listing.latitude ?? null,
            longitude: listing.longitude ?? null,
            existingImages: (listing.images ?? []).map((img: any) => ({
              id: typeof img === 'string' ? img : (img.id || img.url),
              url: typeof img === 'string' ? img : (img.url || img.uri),
            })),
          })
          router.replace('/services/new')
          return
        }

        // Populate store for other generic categories
        set({
          editMode: true,
          editListingId: id,
          category,
          title: listing.title || '',
          description: listing.description || '',
          price: String(listing.price || listing.priceFrom || listing.dailyPrice || listing.monthlyPrice || listing.basePrice || listing.dailyRate || listing.hourlyRate || ''),
          isPriceNegotiable: listing.isPriceNegotiable || false,
          governorate: listing.governorate || '',
          city: listing.city || '',
          governorateId: listing.governorateId ? Number(listing.governorateId) : null,
          wilayaId: listing.wilayaId ? Number(listing.wilayaId) : null,
          latitude: listing.latitude,
          longitude: listing.longitude,
          existingImages: existingImgs,
          removedImageIds: [],
          images: [],
          details: { ...listing }, // push everything else into details
        })

        // Route to step 2 (Images)
        router.replace('/post/step2')
      } catch (err) {
        setError('تعذر تحميل بيانات الإعلان')
      }
    }

    fetchListing()
  }, [id])

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>{error}</Text>
        <Text style={s.backBtn} onPress={() => router.back()}>رجوع</Text>
      </View>
    )
  }

  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={s.loadingTxt}>جاري تجهيز الإعلان للتعديل...</Text>
    </View>
  )
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: Spacing.space4,
  },
  loadingTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16,
    color: Colors.text,
    marginTop: Spacing.space4,
  },
  error: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16,
    color: Colors.error,
    marginBottom: Spacing.space4,
  },
  backBtn: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14,
    color: Colors.primary,
  },
})
