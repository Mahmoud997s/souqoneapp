import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';
import { TransportRequestCard } from '../TransportRequestCard';
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

export function TransportHorizontalList({
  title,
  subTitle,
  data,
  isLoading,
  emptyText,
  onSeeAll,
  onPressItem,
}: Props) {
  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View style={s.titleWrap}>
          <Text style={s.title}>{title}</Text>
          {subTitle && <Text style={s.subTitle}>{subTitle}</Text>}
        </View>

        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll}>
          <Text style={s.seeAllTxt}>عرض الكل</Text>
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        snapToInterval={(SW * 0.85) + Spacing.space4}
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
            <View key={item.id} style={s.cardWrapper}>
              <TransportRequestCard 
                request={item} 
                onPress={() => onPressItem(item)} 
              />
            </View>
          ))
        ) : (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>{emptyText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingHorizontal: Spacing.space5,
  },
  titleWrap: {
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    paddingBottom: 4,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space4,
  },
  cardWrapper: {
    width: SW * 0.85,
  },
  emptyWrap: {
    width: SW * 0.85,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  emptyTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
});
