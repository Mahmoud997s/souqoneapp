import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

const CATEGORIES = [
  { id: 'MAINTENANCE', label: 'صيانة', icon: 'wrench' as any, color: '#16a34a', bg: '#dcfce7' },
  { id: 'CLEANING', label: 'غسيل وتلميع', icon: 'water' as any, color: '#2563eb', bg: '#dbeafe' },
  { id: 'INSPECTION', label: 'فحص', icon: 'magnify' as any, color: '#9333ea', bg: '#f3e8ff' },
  { id: 'BODYWORK', label: 'سمكرة وصبغ', icon: 'spray' as any, color: '#ea580c', bg: '#ffedd5' },
  { id: 'MODIFICATION', label: 'تعديل', icon: 'tune' as any, color: '#eab308', bg: '#fef9c3' },
  { id: 'TOWING', label: 'ونش وإنقاذ', icon: 'tow-truck' as any, color: '#dc2626', bg: '#fee2e2' },
  { id: 'KEYS_LOCKS', label: 'مفاتيح', icon: 'key' as any, color: '#0891b2', bg: '#cffafe' },
  { id: 'ACCESSORIES_INSTALL', label: 'إكسسوارات', icon: 'car-shift-pattern' as any, color: '#b45309', bg: '#fef3c7' },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid' as any, color: Colors.primary, bg: '#EFF6FF' },
]

export const ServicesCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/services/browse' as any)
    } else {
      router.push(`/services/browse?serviceType=${id}` as any)
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
              <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
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
    gap: 10,
  },
  item: {
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10, 
    borderRadius: Radius.lg,
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5, 
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    elevation: 3, // 3D floating shadow
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
    paddingTop: 2,
  },
})
