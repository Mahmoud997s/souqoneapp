import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { useEquipmentStore } from '../../../src/store/equipmentPostStore'
import { AppInput } from '../../../src/components/ui/AppInput'
import { Ionicons } from '@expo/vector-icons'

const CONDITIONS = [
  { key: 'NEW', label: 'جديد' },
  { key: 'USED', label: 'مستعمل' },
  { key: 'REBUILT', label: 'مجدد' },
]

export function EquipmentStep2Details() {
  const { 
    make, model, year, condition, 
    capacity, power, weight, hoursUsed,
    errors, set 
  } = useEquipmentStore()

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
      
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppInput
            label="الماركة (Make) *"
            placeholder="مثال: Caterpillar"
            value={make}
            onChangeText={(val: string) => set({ make: val })}
            error={errors.make}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput
            label="الموديل (Model) *"
            placeholder="مثال: 320D"
            value={model}
            onChangeText={(val: string) => set({ model: val })}
            error={errors.model}
          />
        </View>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppInput
            label="سنة الصنع *"
            placeholder="مثال: 2018"
            keyboardType="number-pad"
            value={year}
            onChangeText={(val: string) => set({ year: val })}
            error={errors.year}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput
            label="ساعات العمل *"
            placeholder="مثال: 4500"
            keyboardType="number-pad"
            value={hoursUsed}
            onChangeText={(val: string) => set({ hoursUsed: val })}
            error={errors.hoursUsed}
          />
        </View>
      </View>

      <View style={{ height: 24 }} />
      <Text style={styles.sectionTitle}>حالة المعدة</Text>
      <View style={styles.conditionRow}>
        {CONDITIONS.map(cond => {
          const isSelected = condition === cond.key;
          return (
            <TouchableOpacity
              key={cond.key}
              style={[styles.conditionCard, isSelected && styles.conditionCardActive]}
              onPress={() => set({ condition: cond.key })}
              activeOpacity={0.8}
            >
              {isSelected && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ position: 'absolute', top: 8, right: 8 }} />}
              <Text style={[styles.conditionLabel, isSelected && styles.conditionLabelActive]}>
                {cond.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
      {errors.condition ? <Text style={styles.errorText}>{errors.condition}</Text> : null}

      <View style={{ height: 24 }} />
      <Text style={styles.sectionTitle}>المواصفات الفنية *</Text>
      
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppInput
            label="السعة (Capacity) *"
            placeholder="مثال: 20 طن / 5 متر"
            value={capacity}
            onChangeText={(val: string) => set({ capacity: val })}
            error={errors.capacity}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput
            label="القوة (Power) *"
            placeholder="مثال: 300 HP"
            value={power}
            onChangeText={(val: string) => set({ power: val })}
            error={errors.power}
          />
        </View>
      </View>

      <View style={{ height: 16 }} />
      <AppInput
        label="الوزن الإجمالي (Weight) *"
        placeholder="مثال: 25 طن"
        value={weight}
        onChangeText={(val: string) => set({ weight: val })}
        error={errors.weight}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  conditionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  conditionLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.text2,
  },
  conditionLabelActive: {
    color: Colors.primary,
  },
})
