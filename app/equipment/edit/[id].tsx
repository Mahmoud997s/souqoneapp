import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { equipmentApi } from '../../../src/api/equipment'
import { useEquipmentWizardStore } from '../../../src/store/equipmentWizardStore'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { Radius } from '../../../src/constants/radius'

export default function EditEquipmentLoaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { initEditMode } = useEquipmentWizardStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchListing() {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await equipmentApi.getById(id)
        const listing = (res as any)?.data ?? res

        initEditMode(listing)
        router.replace('/equipment/new')
      } catch (err: any) {
        setError('تعذر تحميل بيانات الإعلان، يرجى التحقق من اتصالك بالإنترنت')
      } finally {
        setIsLoading(false)
      }
    }

    fetchListing()
  }, [id])

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={52} color={Colors.error} />
        </View>
        <Text style={styles.errorTitle}>خطأ في التحميل</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>جاري تجهيز بيانات إعلان المعدة للتعديل...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space5,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.space2,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#0F172A',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#fff',
  },
})
