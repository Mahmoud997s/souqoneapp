import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';

const CATEGORIES = [
  { id: 'GOODS', icon: 'package-variant-closed', label: 'بضائع عامة', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'FURNITURE', icon: 'sofa-outline', label: 'أثاث وعفش', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'CARS', icon: 'tow-truck', label: 'نقل سيارات', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'LIVESTOCK', icon: 'cow', label: 'نقل مواشي', color: '#ec4899', bgColor: '#fdf2f8' },
  { id: 'CONSTRUCTION', icon: 'crane', label: 'مواد بناء', color: '#64748b', bgColor: '#f8fafc' },
  { id: 'HEAVY', icon: 'truck-trailer', label: 'نقل ثقيل', color: '#ef4444', bgColor: '#fef2f2' },
  { id: 'BACKLOAD', icon: 'truck-check-outline', label: 'شحنات مجمعة', color: '#d946ef', bgColor: '#fdf4ff' },
  { id: 'EQUIPMENT', icon: 'excavator', label: 'معدات وآليات', color: '#f59e0b', bgColor: '#fffbeb' },
];

export function TransportCategoriesGrid() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>ماذا تريد أن تنقل؟</Text>
      </View>
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={s.item}
            activeOpacity={0.7}
            onPress={() => router.push(`/transport/browse?type=${item.id}` as any)}
          >
            <View style={[s.iconWrap, { backgroundColor: item.bgColor }]}>
              <MaterialCommunityIcons name={item.icon as any} size={30} color={item.color} />
            </View>
            <Text style={s.label}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
    marginTop: Spacing.space2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.space3,
    paddingHorizontal: Spacing.space5,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    writingDirection: 'rtl',
    paddingVertical: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
});
