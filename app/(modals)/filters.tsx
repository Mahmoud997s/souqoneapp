import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'

export default function FiltersModal() {
  const params = useLocalSearchParams()
  const [minPrice, setMinPrice] = useState((params.minPrice as string) || '')
  const [maxPrice, setMaxPrice] = useState((params.maxPrice as string) || '')
  const [condition, setCondition] = useState((params.condition as string) || 'ALL')

  const handleApply = () => {
    router.navigate({
      pathname: '/(tabs)/search',
      params: {
        ...(params.category ? { category: params.category } : {}),
        ...(params.q ? { q: params.q } : {}),
        minPrice,
        maxPrice,
        condition,
      },
    })
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    setCondition('ALL')
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>تصفية النتائج</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.label}>نطاق السعر (ر.ع)</Text>
        <View style={s.priceRow}>
          <TextInput
            style={s.input}
            placeholder="الحد الأعلى"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
            textAlign="right"
          />
          <Text style={s.dash}>-</Text>
          <TextInput
            style={s.input}
            placeholder="الحد الأدنى"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
            textAlign="right"
          />
        </View>

        <Text style={s.label}>الحالة</Text>
        <View style={s.chipRow}>
          {[
            ['ALL', 'الكل'],
            ['NEW', 'جديد'],
            ['USED', 'مستعمل'],
          ].map(([val, lbl]) => {
            const isActive = condition === val
            return (
              <TouchableOpacity
                key={val}
                style={[s.chip, isActive && s.chipActive]}
                onPress={() => setCondition(val)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipTxt, isActive && s.chipTxtActive]}>{lbl}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <Text style={s.resetTxt}>إعادة ضبط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.applyBtn} onPress={handleApply} activeOpacity={0.8}>
          <Text style={s.applyTxt}>تطبيق الفلاتر</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.text,
  },
})

const s = StyleSheet.create({
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 10,
    marginTop: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
    backgroundColor: '#F8FAFC',
    writingDirection: 'rtl',
  },
  dash: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    lineHeight: 22,
    color: Colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  chipTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text2,
  },
  chipTxtActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resetBtn: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  resetTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text2,
  },
  applyBtn: {
    flex: 2,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  applyTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.white,
  },
})
