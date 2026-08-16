import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { CardSystem } from '../../../constants/cardSystem';
import { TransportRequest } from '../../../types/transport.types';
import { TransportRequestCard } from '../TransportRequestCard';
import { SkeletonCard } from '../../ui/SkeletonCard';
import { EmptyState } from '../../ui/EmptyState';

const { width: SW } = Dimensions.get('window');

interface TransportHorizontalListProps {
  title: string;
  subTitle: string;
  data: TransportRequest[];
  isLoading: boolean;
  emptyText: string;
  onSeeAll: () => void;
  onPressItem: (item: TransportRequest) => void;
}

export function TransportHorizontalList({
  title,
  subTitle,
  data,
  isLoading,
  emptyText,
  onSeeAll,
  onPressItem,
}: TransportHorizontalListProps) {
  return (
    <View style={s.container}>
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleHeader}>{title}</Text>
          <Text style={s.sectionSubHeader}>{subTitle}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll} style={s.seeAllBtn} activeOpacity={0.8}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -Spacing.space5 }}
        contentContainerStyle={s.scrollContent}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard
              key={i}
              style={{ width: SW * 0.62, height: 190 }}
            />
          ))
        ) : data.length > 0 ? (
          data.map((item) => (
            <View key={item.id} style={{ width: SW * 0.62 }}>
              <TransportRequestCard
                request={item}
                onPress={() => onPressItem(item)}
              />
            </View>
          ))
        ) : (
          <View style={s.emptyCard}>
            <EmptyState
              title={emptyText}
              icon="cube-outline"
              compact
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seeAllTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
    paddingTop: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
    paddingVertical: 4,
  },
  emptyCard: {
    width: SW * 0.62,
    height: 160,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    justifyContent: 'center',
    alignItems: 'center',
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
});

