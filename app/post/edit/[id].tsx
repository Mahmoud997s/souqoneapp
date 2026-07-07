import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { listingsApi } from '../../../src/api/listings'
import { usePostStore } from '../../../src/store/postStore'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { equipmentApi } from '../../../src/api/equipment'

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
        } else {
          res = await listingsApi.getById(id)
        }
        const listing: any = res.data ?? res

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
        else if (listing.type === 'bus' || listing.listingType === 'BUS_LISTING') category = 'buses'
        else if (listing.type === 'transport' || listing.listingType === 'TRANSPORT_REQUEST') category = 'transport'
        else if (listing.type === 'job' || listing.listingType === 'JOB') category = 'jobs'
        else if (listing.type === 'service' || listing.listingType === 'CAR_SERVICE') category = 'services'
        else if (listing.type === 'part' || listing.listingType === 'SPARE_PART') category = 'parts'

        // Populate store
        set({
          editMode: true,
          editListingId: id,
          category,
          title: listing.title || '',
          description: listing.description || '',
          price: String(listing.price || listing.dailyPrice || listing.monthlyPrice || listing.basePrice || listing.dailyRate || listing.hourlyRate || ''),
          isPriceNegotiable: listing.isPriceNegotiable || false,
          governorate: listing.governorate || '',
          city: listing.city || '',
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
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false,
    fontSize: 16,
    color: Colors.text,
    marginTop: Spacing.space4,
  },
  error: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false,
    fontSize: 16,
    color: Colors.error,
    marginBottom: Spacing.space4,
  },
  backBtn: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false,
    fontSize: 14,
    color: Colors.primary,
  },
})
