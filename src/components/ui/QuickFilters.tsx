import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export interface QuickFilterItem {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isActive?: boolean;
}

export interface QuickFiltersProps {
  filters: QuickFilterItem[];
  onFilterPress: (id: string) => void;
  onClearFilter: (id: string) => void;
}

export function QuickFilters({ filters, onFilterPress, onClearFilter }: QuickFiltersProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <View style={s.quickFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickFiltersContent}>
        {filters.map((qf) => {
          const isActive = qf.isActive;
          
          return (
            <TouchableOpacity
              key={qf.id}
              style={[s.quickFilterChip, s.squareChip, isActive && s.quickFilterChipActive]}
              activeOpacity={0.8}
              onPress={() => onFilterPress(qf.id)}
            >
              {!isActive && qf.icon && <Ionicons name={qf.icon} size={16} color={Colors.textMuted} />}
              <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
                {qf.label}
              </Text>
              <Ionicons 
                name={isActive ? "close-circle" : "chevron-down"} 
                size={14} 
                color={isActive ? Colors.white : Colors.textMuted} 
                onPress={isActive ? (e) => {
                  e.stopPropagation();
                  onClearFilter(qf.id);
                } : undefined} 
              />
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  quickFiltersContainer: {
    marginTop: 4, // Moved up by another 2px (total 4px up from 8px)
    marginBottom: Spacing.space1,
  },
  quickFiltersContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: 6, // Reduced padding
    gap: Spacing.space2,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6, // Reduced padding
    borderRadius: 100,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4, // Reduced gap
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  squareChip: {
    borderRadius: 6,
    paddingVertical: 6, // Reduced padding
    paddingHorizontal: 10,
  },
  quickFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  quickFilterTxt: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 11, // Reduced font size
    lineHeight: 14, // Adjusted line height
    color: Colors.text,
  },
  quickFilterTxtActive: {
    color: Colors.white,
  },
});
