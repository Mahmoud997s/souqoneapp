import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

const { width: SW } = Dimensions.get('window')
const ITEM_WIDTH = (SW - Spacing.space5 * 2 - Spacing.space3 * 3) / 4

const CATEGORIES = [
  { id: 'ENGINE', label: 'المحرك', icon: 'settings-outline' as any, color: '#ea580c', bg: '#ffedd5' },
  { id: 'BODY', label: 'الهيكل', icon: 'car-sport-outline' as any, color: '#2563eb', bg: '#dbeafe' },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'flash-outline' as any, color: '#eab308', bg: '#fef9c3' },
  { id: 'SUSPENSION', label: 'التعليق', icon: 'git-network-outline' as any, color: '#16a34a', bg: '#dcfce7' },
  { id: 'BRAKES', label: 'الفرامل', icon: 'disc-outline' as any, color: '#dc2626', bg: '#fee2e2' },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'tablet-landscape-outline' as any, color: '#9333ea', bg: '#f3e8ff' },
  { id: 'TIRES', label: 'الإطارات', icon: 'aperture-outline' as any, color: '#4b5563', bg: '#f3f4f6' },
  { id: 'all', label: 'عرض الكل', icon: 'grid-outline' as any, color: Colors.primary, bg: '#EFF6FF' },
]

export const PartsCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/parts/browse' as any)
    } else {
      router.push(`/parts/browse?category=${id}` as any)
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>أقسام قطع الغيار</Text>
      
      <View style={s.grid}>
        {CATEGORIES.map((cat, i) => (
          <TouchableOpacity 
            key={i} 
            style={s.item} 
            activeOpacity={0.7}
            onPress={() => handlePress(cat.id)}
          >
            <View style={[s.iconBox, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon} size={24} color={cat.color} />
            </View>
            <Text style={s.label} numberOfLines={1}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 18, color: Colors.text, textAlign: 'left',
    marginBottom: Spacing.space3,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space3,
  },
  item: {
    width: ITEM_WIDTH, alignItems: 'center', gap: 6,
  },
  iconBox: {
    width: ITEM_WIDTH, height: ITEM_WIDTH, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11, color: Colors.text2, textAlign: 'center',
  },
})
