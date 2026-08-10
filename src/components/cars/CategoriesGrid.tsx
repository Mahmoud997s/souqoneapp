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
    <View style={s.container}>

      <View style={s.catsGrid}>
        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=used' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="car-sport" size={20} color="#0ea5e9" />
          </View>
          <Text style={s.catLabel}>مستعملة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=new' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="sparkles" size={20} color="#10b981" />
          </View>
          <Text style={s.catLabel}>جديدة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=wanted' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="megaphone" size={20} color="#8b5cf6" />
          </View>
          <Text style={s.catLabel}>مطلوب</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=rental' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="key" size={20} color="#f59e0b" />
          </View>
          <Text style={s.catLabel}>تأجير</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row', gap: 10,
  },
  catItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3, // 3D floating shadow
  },
  catIconBox: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 12, color: Colors.text, textAlign: 'center',
    lineHeight: 18, paddingTop: 2, writingDirection: 'rtl'
  },
})
