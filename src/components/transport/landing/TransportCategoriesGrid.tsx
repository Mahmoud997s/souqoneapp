import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';

const CATEGORIES_ROW_1 = [
  { id: 'GOODS', icon: 'package-variant-closed', label: 'بضائع عامة', color: '#0ea5e9', bg: '#e0f2fe' },
  { id: 'FURNITURE', icon: 'sofa-outline', label: 'أثاث وعفش', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'CARS', icon: 'tow-truck', label: 'نقل سيارات', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'BACKLOAD', icon: 'truck-check-outline', label: 'شحنات مجمعة', color: '#10b981', bg: '#d1fae5' },
];

const CATEGORIES_ROW_2 = [
  { id: 'CONSTRUCTION', icon: 'crane', label: 'مواد بناء', color: '#64748b', bg: '#f1f5f9' },
  { id: 'HEAVY', icon: 'truck-trailer', label: 'نقل ثقيل', color: '#ef4444', bg: '#fef2f2' },
  { id: 'EQUIPMENT', icon: 'excavator', label: 'معدات وآليات', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'LIVESTOCK', icon: 'cow', label: 'نقل مواشي', color: '#ec4899', bg: '#fdf2f8' },
];

export function TransportCategoriesGrid() {
  const router = useRouter();

  const renderItem = (item: typeof CATEGORIES_ROW_1[0]) => (
    <TouchableOpacity
      key={item.id}
      style={s.catItem}
      activeOpacity={0.8}
      onPress={() => router.push(`/transport/browse?type=${item.id}` as any)}
    >
      <View style={[s.catIconBox, { backgroundColor: item.bg }]}>
        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
      </View>
      <Text style={s.catLabel} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.catsGrid}>
        {CATEGORIES_ROW_1.map(renderItem)}
      </View>
      <View style={[s.catsGrid, { marginTop: 10 }]}>
        {CATEGORIES_ROW_2.map(renderItem)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  catItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency matching Cars
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
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
});

