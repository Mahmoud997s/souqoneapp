import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';

import { BUS_CATEGORIES } from '../../../constants/buses';

export function BusCategoriesGrid() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitleHeader}>فئات الحافلات</Text>
      </View>
      <FlatList
        data={BUS_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={s.item}
            activeOpacity={0.7}
            onPress={() => router.push(`/buses/browse?busType=${item.id}` as any)}
          >
            <View style={[s.iconWrap, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={30} color={item.color} />
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
    marginBottom: Spacing.space6,
    marginTop: Spacing.space2,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.space5,
    marginBottom: Spacing.space3,
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
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
