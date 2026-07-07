import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export const CategoriesGrid = () => {
  const router = useRouter()

  return (
    <>
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleHeader}>ماذا تبحث عنه؟</Text>
          <Text style={s.sectionSubHeader}>اختر الفئة المناسبة لك</Text>
        </View>
      </View>

      <View style={s.catsGrid}>
        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=used' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="car-sport" size={24} color="#0ea5e9" />
          </View>
          <Text style={s.catLabel}>مستعملة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=new' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="sparkles" size={24} color="#10b981" />
          </View>
          <Text style={s.catLabel}>جديدة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=wanted' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="megaphone" size={24} color="#8b5cf6" />
          </View>
          <Text style={s.catLabel}>مطلوب</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=rental' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="key" size={24} color="#f59e0b" />
          </View>
          <Text style={s.catLabel}>تأجير</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3, marginTop: Spacing.space2,
  },
  sectionTitleHeader: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.text, textAlign: 'left' },
  sectionSubHeader: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.textMuted, textAlign: 'left' },
  catsGrid: {
    flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.space2,
    marginBottom: Spacing.space6,
  },
  catItem: {
    width: '23.5%', // Guarantees all 4 items are exactly equal in size
    backgroundColor: Colors.white,
    paddingVertical: Spacing.space3, paddingHorizontal: 0, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  catIconBox: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 12, color: Colors.text, textAlign: 'center',
  },
})
