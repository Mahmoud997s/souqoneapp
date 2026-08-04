import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { useEquipmentStore } from '../../../store/equipmentPostStore'
import { LocationPicker } from '../../ui/LocationPicker'
import { AppInput } from '../../ui/AppInput'

export function EquipmentStep4Location() {
  const { 
    listingType, 
    price, dailyPrice, monthlyPrice,
    budgetMin, budgetMax, rentalDuration, quantity,
    governorate, city, 
    errors, set 
  } = useEquipmentStore()

  const isWanted = listingType === 'EQUIPMENT_WANTED'
  const isRent = listingType === 'EQUIPMENT_RENT'

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>موقع المعدة *</Text>
      <LocationPicker
        governorate={governorate}
        onGovernorateChange={(v: string) => set({ governorate: v, city: '' })}
        city={city}
        onCityChange={(v: string) => set({ city: v })}
      />
      {errors.governorate || errors.city ? <Text style={styles.errorText}>{errors.governorate || errors.city}</Text> : null}

      <View style={{ height: Spacing.space6 }} />

      <Text style={styles.sectionTitle}>{isWanted ? 'الميزانية والكمية' : 'التسعير'}</Text>
      
      {isWanted ? (
        <>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="الميزانية كحد أدنى *"
                placeholder="مثال: 100"
                keyboardType="numeric"
                value={budgetMin}
                onChangeText={(val: string) => set({ budgetMin: val })}
                error={errors.budgetMin}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="الميزانية كحد أقصى *"
                placeholder="مثال: 500"
                keyboardType="numeric"
                value={budgetMax}
                onChangeText={(val: string) => set({ budgetMax: val })}
                error={errors.budgetMax}
              />
            </View>
          </View>
          <View style={{ height: 16 }} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="الكمية المطلوبة *"
                placeholder="مثال: 2"
                keyboardType="numeric"
                value={quantity}
                onChangeText={(val: string) => set({ quantity: val })}
                error={errors.quantity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="فترة الإيجار (إن وجد)"
                placeholder="مثال: 3 أشهر"
                value={rentalDuration}
                onChangeText={(val: string) => set({ rentalDuration: val })}
              />
            </View>
          </View>
        </>
      ) : isRent ? (
        <>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppInput
                label="سعر الإيجار اليومي *"
                placeholder="0.00 ر.ع"
                keyboardType="numeric"
                value={dailyPrice}
                onChangeText={(val: string) => set({ dailyPrice: val })}
                error={errors.dailyPrice}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label="سعر الإيجار الشهري *"
                placeholder="0.00 ر.ع"
                keyboardType="numeric"
                value={monthlyPrice}
                onChangeText={(val: string) => set({ monthlyPrice: val })}
                error={errors.monthlyPrice}
              />
            </View>
          </View>
        </>
      ) : (
        <AppInput
          label="السعر المطلوب *"
          placeholder="0.00 ر.ع"
          keyboardType="numeric"
          value={price}
          onChangeText={(val: string) => set({ price: val })}
          error={errors.price}
        />
      )}
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
})
