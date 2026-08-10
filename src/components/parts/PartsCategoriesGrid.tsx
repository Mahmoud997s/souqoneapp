import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

const CATEGORIES = [
  { id: 'ENGINE', label: 'المحرك', icon: 'engine' as any, color: '#ea580c', bg: '#ffedd5' },
  { id: 'BODY', label: 'الهيكل', icon: 'car-side' as any, color: '#2563eb', bg: '#dbeafe' },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'car-electric' as any, color: '#eab308', bg: '#fef9c3' },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: 'car-esp' as any, color: '#16a34a', bg: '#dcfce7' },
  { id: 'BRAKES', label: 'الفرامل', icon: 'car-brake-alert' as any, color: '#dc2626', bg: '#fee2e2' },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'car-seat' as any, color: '#9333ea', bg: '#f3e8ff' },
  { id: 'TIRES', label: 'الإطارات', icon: 'tire' as any, color: '#4b5563', bg: '#f3f4f6' },
  { id: 'BATTERIES', label: 'البطاريات', icon: 'car-battery' as any, color: '#0891b2', bg: '#cffafe' },
  { id: 'OILS', label: 'الزيوت', icon: 'oil' as any, color: '#b45309', bg: '#fef3c7' },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid' as any, color: Colors.primary, bg: '#EFF6FF' },
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
      >
        {CATEGORIES.map((cat, i) => (
          <TouchableOpacity 
            key={i} 
            style={s.item} 
            activeOpacity={0.7}
            onPress={() => handlePress(cat.id)}
          >
            <View style={[s.iconBox, { backgroundColor: cat.bg }]}>
              <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
            </View>
            <Text style={s.label} numberOfLines={1}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  scrollView: {
    marginHorizontal: -Spacing.space5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    paddingVertical: 6,
    gap: 15,
  },
  item: {
    width: 68,
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11.5,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 16,
    paddingTop: 2,
  },
})
