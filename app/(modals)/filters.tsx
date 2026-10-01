import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { OMAN_GOVERNORATES_INDEXED } from '../../src/constants/locations'

export default function FiltersModal() {
  const params = useLocalSearchParams()
  const [minPrice, setMinPrice] = useState((params.minPrice as string) || '')
  const [maxPrice, setMaxPrice] = useState((params.maxPrice as string) || '')
  const [condition, setCondition] = useState((params.condition as string) || 'ALL')
  const [governorateId, setGovernorateId] = useState((params.governorateId as string) || '')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleApply = () => {
    const minVal = minPrice.trim() ? Number(minPrice.trim()) : undefined
    const maxVal = maxPrice.trim() ? Number(maxPrice.trim()) : undefined

    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      setErrorMsg('الحد الأدنى لا يمكن أن يكون أكبر من الحد الأعلى')
      return
    }

    setErrorMsg(null)

    const targetParams: Record<string, string> = {}
    if (params.category) targetParams.category = params.category as string
    if (params.q) targetParams.q = params.q as string
    if (minVal !== undefined && !isNaN(minVal)) targetParams.minPrice = String(minVal)
    if (maxVal !== undefined && !isNaN(maxVal)) targetParams.maxPrice = String(maxVal)
    if (condition && condition !== 'ALL') targetParams.condition = condition
    if (governorateId) targetParams.governorateId = governorateId

    router.navigate({
      pathname: '/(tabs)/search',
      params: targetParams,
    })
    router.back()
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    setCondition('ALL')
    setGovernorateId('')
    setErrorMsg(null)

    const targetParams: Record<string, string> = {}
    if (params.category) targetParams.category = params.category as string
    if (params.q) targetParams.q = params.q as string

    router.navigate({
      pathname: '/(tabs)/search',
      params: targetParams,
    })
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>تصفية النتائج</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── نطاق السعر (RTL: من الحد الأدنى على اليمين إلى الحد الأعلى على اليسار) ── */}
        <Text style={s.label}>نطاق السعر (ر.ع)</Text>
        <View style={s.priceRow}>
          <View style={s.inputWrapper}>
            <TextInput
              style={[s.input, Boolean(errorMsg) && s.inputError]}
              placeholder="الحد الأدنى"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={(val) => {
                setMinPrice(val)
                if (errorMsg) setErrorMsg(null)
              }}
              textAlign="right"
            />
          </View>

          <Text style={s.dash}>-</Text>

          <View style={s.inputWrapper}>
            <TextInput
              style={[s.input, Boolean(errorMsg) && s.inputError]}
              placeholder="الحد الأعلى"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={(val) => {
                setMaxPrice(val)
                if (errorMsg) setErrorMsg(null)
              }}
              textAlign="right"
            />
          </View>
        </View>
        {errorMsg && <Text style={s.errorText}>{errorMsg}</Text>}

        {/* ── الحالة ── */}
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

        {/* ── المحافظة (Location) ── */}
        <Text style={s.label}>الموقع (المحافظة)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.govScrollContainer}
        >
          <TouchableOpacity
            style={[s.govChip, !governorateId && s.govChipActive]}
            onPress={() => setGovernorateId('')}
            activeOpacity={0.7}
          >
            <Text style={[s.govChipTxt, !governorateId && s.govChipTxtActive]}>
              كل المحافظات
            </Text>
          </TouchableOpacity>

          {OMAN_GOVERNORATES_INDEXED.map((gov) => {
            const isActive = governorateId === String(gov.id)
            return (
              <TouchableOpacity
                key={gov.id}
                style={[s.govChip, isActive && s.govChipActive]}
                onPress={() => setGovernorateId(isActive ? '' : String(gov.id))}
                activeOpacity={0.7}
              >
                <Text style={[s.govChipTxt, isActive && s.govChipTxtActive]}>
                  {gov.nameAr}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </ScrollView>

      {/* ── Footer Actions ── */}
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 24,
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
  inputWrapper: {
    flex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    backgroundColor: '#F8FAFC',
    writingDirection: 'rtl',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  dash: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.textMuted,
  },
  errorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
    marginTop: 6,
    writingDirection: 'rtl',
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
  govScrollContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  govChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  govChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
  },
  govChipTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text2,
  },
  govChipTxtActive: {
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
    lineHeight: 20,
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
    lineHeight: 20,
    color: Colors.white,
  },
})
