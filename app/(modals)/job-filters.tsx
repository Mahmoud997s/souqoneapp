import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { useState } from 'react'

export default function JobFiltersModal() {
  const params = useLocalSearchParams()
  const [minSalary, setMinSalary] = useState(params.minSalary as string || '')
  const [maxSalary, setMaxSalary] = useState(params.maxSalary as string || '')
  const [employmentType, setEmploymentType] = useState(params.employmentType as string || '')
  const [experience, setExperience] = useState(params.experienceYears as string || '')

  const applyFilters = () => {
    const queryParams: any = {}
    if (minSalary) queryParams.minSalary = minSalary
    if (maxSalary) queryParams.maxSalary = maxSalary
    if (employmentType) queryParams.employmentType = employmentType
    if (experience) queryParams.experienceYears = experience

    router.push({ pathname: '/jobs', params: queryParams })
  }

  const resetFilters = () => {
    setMinSalary('')
    setMaxSalary('')
    setEmploymentType('')
    setExperience('')
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>تصفية الوظائف</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <Text style={s.label}>نوع الدوام</Text>
        <View style={s.chipRow}>
          {[['', 'الكل'], ['FULL_TIME', 'كامل'], ['PART_TIME', 'جزئي'], ['CONTRACT', 'عقد']].map(([val, lbl]) => (
            <TouchableOpacity 
              key={val} 
              style={[s.chip, employmentType === val && s.chipActive]}
              onPress={() => setEmploymentType(val)}
            >
              <Text style={[s.chipTxt, employmentType === val && s.chipTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>نطاق الراتب (ر.ع)</Text>
        <View style={s.priceRow}>
          <TextInput 
            style={s.input} 
            placeholder="الحد الأعلى" 
            keyboardType="numeric" 
            value={maxSalary} 
            onChangeText={setMaxSalary} 
            textAlign="right"
          />
          <Text style={s.dash}>-</Text>
          <TextInput 
            style={s.input} 
            placeholder="الحد الأدنى" 
            keyboardType="numeric" 
            value={minSalary} 
            onChangeText={setMinSalary} 
            textAlign="right"
          />
        </View>

        <Text style={s.label}>سنوات الخبرة (الحد الأدنى)</Text>
        <View style={s.chipRow}>
          {[['', 'الكل'], ['1', 'سنة+'], ['3', '3 سنوات+'], ['5', '5 سنوات+']].map(([val, lbl]) => (
            <TouchableOpacity 
              key={val} 
              style={[s.chip, experience === val && s.chipActive]}
              onPress={() => setExperience(val)}
            >
              <Text style={[s.chipTxt, experience === val && s.chipTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.resetBtn} onPress={resetFilters}>
          <Text style={s.resetTxt}>إعادة ضبط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.applyBtn} onPress={applyFilters}>
          <Text style={s.applyTxt}>تطبيق الفلاتر</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, alignItems: 'center',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#E2E6EC',
    borderRadius: 2, marginBottom: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: '#111827' },
})

const s = StyleSheet.create({
  label: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text, writingDirection: 'rtl', marginBottom: 12, marginTop: 24 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, height: 50, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: 16, fontFamily: 'Almarai_400Regular' },
  dash: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 20, color: Colors.textMuted },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#eff6ff' },
  chipTxt: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text2 },
  chipTxtActive: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary },
  footer: { flexDirection: 'row', width: '100%', gap: 12, paddingVertical: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  resetBtn: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  resetTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text2 },
  applyBtn: { flex: 2, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, backgroundColor: Colors.primary },
  applyTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.white },
})
