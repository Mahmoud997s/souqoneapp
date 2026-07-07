import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { useState } from 'react'

export default function FiltersModal() {
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [condition, setCondition] = useState('ALL')

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>تصفية النتائج</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <Text style={s.label}>نطاق السعر</Text>
        <View style={s.priceRow}>
          <TextInput 
            style={s.input} 
            placeholder="الحد الأعلى" 
            keyboardType="numeric" 
            value={maxPrice} 
            onChangeText={setMaxPrice} 
            textAlign="right"
          />
          <Text style={s.dash}>-</Text>
          <TextInput 
            style={s.input} 
            placeholder="الحد الأدنى" 
            keyboardType="numeric" 
            value={minPrice} 
            onChangeText={setMinPrice} 
            textAlign="right"
          />
        </View>

        <Text style={s.label}>الحالة</Text>
        <View style={s.chipRow}>
          {[['ALL', 'الكل'], ['NEW', 'جديد'], ['USED', 'مستعمل']].map(([val, lbl]) => (
            <TouchableOpacity 
              key={val} 
              style={[s.chip, condition === val && s.chipActive]}
              onPress={() => setCondition(val)}
            >
              <Text style={[s.chipTxt, condition === val && s.chipTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.resetBtn} onPress={() => { setMinPrice(''); setMaxPrice(''); setCondition('ALL') }}>
          <Text style={s.resetTxt}>إعادة ضبط</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.applyBtn} onPress={() => {
          router.navigate({
            pathname: '/(tabs)/search',
            params: { minPrice, maxPrice, condition }
          })
        }}>
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
  chipRow: { flexDirection: 'row', gap: 12 },
  chip: { flex: 1, height: 44, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#eff6ff' },
  chipTxt: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text2 },
  chipTxtActive: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary },
  footer: { flexDirection: 'row', width: '100%', gap: 12, paddingVertical: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  resetBtn: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  resetTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text2 },
  applyBtn: { flex: 2, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, backgroundColor: Colors.primary },
  applyTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.white },
})
