import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';
import { BusCard } from '../BusCard';
import { SkeletonCard } from '../../ui/SkeletonCard';

const { width: SW } = Dimensions.get('window');

interface Props {
  title: string;
  subTitle?: string;
  data: any[];
  isLoading: boolean;
  emptyText: string;
  onSeeAll: () => void;
  onPressItem: (item: any) => void;
}

export function BusHorizontalList({
  title,
  subTitle,
  data,
  isLoading,
  emptyText,
  onSeeAll,
  onPressItem,
}: Props) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.flex1}>
          <Text style={s.sectionTitleHeader}>{title}</Text>
          {subTitle && <Text style={s.sectionSubHeader}>{subTitle}</Text>}
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={s.hList}
        snapToInterval={(SW * 0.6) + Spacing.space4}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={s.cardWrapper}>
              <SkeletonCard />
            </View>
          ))
        ) : data.length > 0 ? (
          data.map((item) => (
            <BusCard key={item.id} item={item as any} onPress={() => onPressItem(item)} />
          ))
        ) : (
          <View style={s.emptyList}>
            <Ionicons name="bus-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={{ fontFamily: 'Almarai_400Regular', color: Colors.textMuted }}>{emptyText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: { 
    marginBottom: Spacing.space6 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.space5, 
    marginBottom: Spacing.space3 
  },
  flex1: { 
    flex: 1, 
    paddingVertical: 2 
  },
  sectionTitleHeader: { 
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, 
    color: Colors.text, 
    textAlign: 'left', 
    writingDirection: 'rtl' 
  },
  sectionSubHeader: { 
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, 
    color: Colors.textMuted, 
    textAlign: 'left', 
    writingDirection: 'rtl', 
    marginTop: 2 
  },
  seeAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  seeAllTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13, 
    color: Colors.primary 
  },
  hList: { 
    paddingHorizontal: Spacing.space5, 
    gap: Spacing.space4, 
    paddingBottom: 16 
  },
  cardWrapper: {},
  emptyList: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8F9FB', 
    borderRadius: Radius.xl, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderStyle: 'dashed', 
    height: 120, 
    width: SW * 0.85 
  },
});
