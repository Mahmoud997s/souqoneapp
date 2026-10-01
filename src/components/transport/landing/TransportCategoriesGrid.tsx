import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';

const CATEGORIES_ROW_1 = [
  { id: 'GOODS', icon: 'package-variant-closed', label: 'بضائع عامة' },
  { id: 'FURNITURE', icon: 'sofa-outline', label: 'أثاث وعفش' },
  { id: 'CARS', icon: 'tow-truck', label: 'نقل سيارات' },
  { id: 'BACKLOAD', icon: 'truck-check-outline', label: 'شحنات مجمعة' },
];

const CATEGORIES_ROW_2 = [
  { id: 'CONSTRUCTION', icon: 'crane', label: 'مواد بناء' },
  { id: 'HEAVY', icon: 'truck-trailer', label: 'نقل ثقيل' },
  { id: 'EQUIPMENT', icon: 'excavator', label: 'معدات وآليات' },
  { id: 'LIVESTOCK', icon: 'cow', label: 'نقل مواشي' },
];

export function TransportCategoriesGrid() {
  const router = useRouter();

  const renderItem = (item: typeof CATEGORIES_ROW_1[0]) => (
    <TouchableOpacity
      key={item.id}
      style={s.catItem}
      activeOpacity={0.7}
      onPress={() => router.push(`/transport/browse?type=${item.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={s.catIconBox}>
        <MaterialCommunityIcons name={item.icon as any} size={21} color={Colors.primary} />
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
      <View style={[s.catsGrid, { marginTop: 8 }]}>
        {CATEGORIES_ROW_2.map(renderItem)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  catItem: {
    flex: 1,
    minHeight: 84,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
});

