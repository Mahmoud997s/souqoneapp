import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { useEquipmentStore } from '../../../src/store/equipmentPostStore'
import { Ionicons } from '@expo/vector-icons'

export function EquipmentStep5Review() {
  const state = useEquipmentStore()
  
  const isWanted = state.listingType === 'EQUIPMENT_WANTED'

  const getListingTypeLabel = () => {
    if (state.listingType === 'EQUIPMENT_SALE') return 'للبيع'
    if (state.listingType === 'EQUIPMENT_RENT') return 'للإيجار'
    if (state.listingType === 'EQUIPMENT_WANTED') return 'مطلوب'
    return state.listingType
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>
        يرجى مراجعة تفاصيل إعلانك قبل النشر للتأكد من صحتها.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>المعلومات الأساسية</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>نوع الإعلان:</Text>
          <Text style={styles.detailValue}>{getListingTypeLabel()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>العنوان:</Text>
          <Text style={styles.detailValue}>{state.title || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>الفئة:</Text>
          <Text style={styles.detailValue}>{state.equipmentType || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>الماركة والموديل:</Text>
          <Text style={styles.detailValue}>{state.make || '-'} {state.model || ''}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>سنة الصنع:</Text>
          <Text style={styles.detailValue}>{state.year || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>الوصف:</Text>
          <Text style={styles.detailValue}>{state.description || '-'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>الموقع والتسعير</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>المحافظة:</Text>
          <Text style={styles.detailValue}>{state.governorate || '-'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>الولاية:</Text>
          <Text style={styles.detailValue}>{state.city || '-'}</Text>
        </View>
        
        {isWanted ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>الميزانية المحددة:</Text>
            <Text style={styles.detailValue}>{state.budgetMin || '0'} - {state.budgetMax || '0'} ر.ع</Text>
          </View>
        ) : state.listingType === 'EQUIPMENT_RENT' ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>الإيجار اليومي:</Text>
              <Text style={styles.detailValue}>{state.dailyPrice || '-'} ر.ع</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>الإيجار الشهري:</Text>
              <Text style={styles.detailValue}>{state.monthlyPrice || '-'} ر.ع</Text>
            </View>
          </>
        ) : (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>السعر:</Text>
            <Text style={styles.detailValue}>{state.price || '-'} ر.ع</Text>
          </View>
        )}
      </View>

      {!isWanted && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>الصور</Text>
          </View>
          <Text style={{ fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted, writingDirection: 'rtl' }}>
            تم إرفاق ({state.images.length}) صور.
          </Text>
        </View>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text2,
    writingDirection: 'rtl',
    marginBottom: Spacing.space5,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  detailValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    textAlign: 'left',
    marginLeft: 16,
  },
})
