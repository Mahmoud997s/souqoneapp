import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { equipmentApi } from '../../../src/api/equipment'
import { useEquipmentStore } from '../../../src/store/equipmentPostStore'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'

export default function EditEquipmentLoader() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { set, reset } = useEquipmentStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchListing() {
      if (!id) return
      try {
        const res = await equipmentApi.getById(id)
        const listing = res.data ?? res

        reset()

        const existingImgs = Array.isArray(listing.images)
          ? listing.images.map((img: any) => typeof img === 'string' ? { url: img } : img)
          : typeof listing.images === 'string'
          ? JSON.parse(listing.images).map((url: string) => ({ url }))
          : []

        set({
          editMode: true,
          editListingId: id,
          currentStep: 1,

          title: listing.title || '',
          description: listing.description || '',
          equipmentType: listing.equipmentType || '',
          listingType: listing.listingType || '',
          
          make: listing.make || '',
          model: listing.model || '',
          year: listing.year ? String(listing.year) : '',
          condition: listing.condition || 'USED',
          capacity: listing.capacity ? String(listing.capacity) : '',
          power: listing.power ? String(listing.power) : '',
          weight: listing.weight ? String(listing.weight) : '',
          hoursUsed: listing.hoursUsed ? String(listing.hoursUsed) : '',

          price: listing.price ? String(listing.price) : '',
          dailyPrice: listing.dailyPrice ? String(listing.dailyPrice) : '',
          monthlyPrice: listing.monthlyPrice ? String(listing.monthlyPrice) : '',
          
          budgetMin: listing.budgetMin ? String(listing.budgetMin) : '',
          budgetMax: listing.budgetMax ? String(listing.budgetMax) : '',
          rentalDuration: listing.rentalDuration || '',
          quantity: listing.quantity ? String(listing.quantity) : '',

          governorate: listing.governorate || '',
          city: listing.city || '',
          latitude: listing.latitude || null,
          longitude: listing.longitude || null,

          existingImages: existingImgs,
          removedImageIds: [],
          images: [],
        })

        router.replace('/equipment/new')
      } catch (err) {
        setError('تعذر تحميل بيانات الإعلان')
      }
    }

    fetchListing()
  }, [id])

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>جاري التحميل...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space4,
  },
  loadingText: {
    fontFamily: 'Almarai_400Regular',
    marginTop: Spacing.space3,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: 'Almarai_700Bold',
    color: '#ef4444',
    fontSize: 16,
  },
})
