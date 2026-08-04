import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { useEquipmentStore } from '../../../store/equipmentPostStore'
import { AppInput } from '../../ui/AppInput'

const LISTING_TYPES = [
  { key: 'EQUIPMENT_SALE', label: 'للبيع', icon: 'tag-outline' },
  { key: 'EQUIPMENT_RENT', label: 'للإيجار', icon: 'calendar-clock' },
  { key: 'EQUIPMENT_WANTED', label: 'مطلوب', icon: 'bullhorn-outline' },
]

const EQUIPMENT_TYPES = [
  { key: 'EXCAVATOR', label: 'حفار', icon: 'excavator' },
  { key: 'LOADER', label: 'لودر / شيول', icon: 'tractor' },
  { key: 'BULLDOZER', label: 'بلدوزر', icon: 'bulldozer' },
  { key: 'CRANE', label: 'رافعة / كرين', icon: 'crane' },
  { key: 'FORKLIFT', label: 'رافعة شوكية', icon: 'forklift' },
  { key: 'CONCRETE_MIXER', label: 'خلاطة', icon: 'dump-truck' },
  { key: 'GENERATOR', label: 'مولد كهرباء', icon: 'engine' },
  { key: 'COMPRESSOR', label: 'كمبروسر', icon: 'air-filter' },
  { key: 'TRUCK', label: 'شاحنة', icon: 'truck' },
  { key: 'OTHER_EQUIPMENT', label: 'أخرى', icon: 'tools' },
]

export function EquipmentStep1Type() {
  const { listingType, equipmentType, title, description, errors, set } = useEquipmentStore()

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>نوع الإعلان *</Text>
      <View style={styles.typeRow}>
        {LISTING_TYPES.map(type => {
          const isSelected = listingType === type.key;
          return (
            <TouchableOpacity
              key={type.key}
              style={[styles.typeCard, isSelected && styles.typeCardActive]}
              onPress={() => set({ listingType: type.key })}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name={type.icon as any} 
                size={24} 
                color={isSelected ? Colors.primary : Colors.textMuted} 
              />
              <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
      {errors.listingType ? <Text style={styles.errorText}>{errors.listingType}</Text> : null}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.space4 }]}>فئة المعدة *</Text>
      <View style={styles.grid}>
        {EQUIPMENT_TYPES.map(eq => {
          const isSelected = equipmentType === eq.key;
          return (
            <TouchableOpacity
              key={eq.key}
              style={[styles.gridCard, isSelected && styles.gridCardActive]}
              onPress={() => set({ equipmentType: eq.key })}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name={eq.icon as any} 
                size={28} 
                color={isSelected ? Colors.white : Colors.text2} 
              />
              <Text style={[styles.gridLabel, isSelected && styles.gridLabelActive]}>
                {eq.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={{ marginTop: Spacing.space5 }}>
        <AppInput
          label="عنوان الإعلان *"
          placeholder="مثال: حفار كاتربيلر للإيجار اليومي"
          value={title}
          onChangeText={(val: string) => set({ title: val })}
          error={errors.title}
        />
        <View style={{ height: 16 }} />
        <AppInput
          label="وصف تفصيلي *"
          placeholder="اكتب تفاصيل المعدة، حالتها، وأي شروط إضافية..."
          value={description}
          onChangeText={(val: string) => set({ description: val })}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
          error={errors.description}
        />
      </View>
      {errors.equipmentType ? <Text style={styles.errorText}>{errors.equipmentType}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  errorText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  typeLabelActive: {
    color: Colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  gridCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  gridLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.text2,
    textAlign: 'center',
  },
  gridLabelActive: {
    color: Colors.white,
  },
})
