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
              style={[s.quickFilterChip, isActive && s.quickFilterChipActive]}
              activeOpacity={0.8}
              onPress={() => onFilterPress(qf.id)}
            >
              {!isActive && qf.icon && (
                <Ionicons name={qf.icon} size={12.5} color={Colors.textMuted} />
              )}
              <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
                {qf.label}
              </Text>
              {isActive ? (
                <TouchableOpacity
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    onClearFilter(qf.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={12.5} color={Colors.white} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={11} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  quickFiltersContainer: {
    marginVertical: 4,
  },
  quickFiltersContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: 2,
    gap: 6,
    alignItems: 'center',
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2 
      },
      android: { 
        elevation: 1 
      },
    }),
  },
  quickFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: { 
        shadowColor: Colors.primary, 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 3 
      },
      android: { 
        elevation: 1 
      },
    }),
  },
  quickFilterTxt: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  quickFilterTxtActive: {
    color: Colors.white,
  },
});
