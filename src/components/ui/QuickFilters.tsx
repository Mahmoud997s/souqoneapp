import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { PhysicalHorizontalTrack } from './PhysicalHorizontalTrack';

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
      <PhysicalHorizontalTrack
        minHeight={34}
        contentContainerStyle={s.quickFiltersContent}
      >
        {filters.map((qf) => {
          const isActive = qf.isActive;
          
          return (
            <View
              key={qf.id}
              style={[s.quickFilterChip, isActive && s.quickFilterChipActive]}
            >
              <TouchableOpacity
                style={[s.chipPressableArea, !isActive && s.chipPressableAreaInactive]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={qf.label}
                accessibilityState={{ selected: Boolean(isActive) }}
                // Effective touch height: visible height is 29pt (paddingVertical 6*2 + lineHeight 15 + border 2).
                // hitSlop 8 top/bottom extends up to parent PhysicalHorizontalTrack bounds (minHeight 34pt, paddingVertical 2pt),
                // yielding effective touch height of ~34pt (clipped by track bounds, keeping visible layout unchanged per M-023/M-025).
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                onPress={() => onFilterPress(qf.id)}
              >
                {!isActive && qf.icon && (
                  <Ionicons name={qf.icon} size={12.5} color={Colors.textMuted} />
                )}
                <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
                  {qf.label}
                </Text>
                {!isActive && (
                  <Ionicons name="chevron-down" size={11} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
              {isActive && (
                <TouchableOpacity
                  style={s.clearButton}
                  // Effective clear target: 12.5pt icon with paddingVertical 6 + paddingEnd 8 (visible ~29x22pt).
                  // hitSlop 16 is bounded by the chip container (29pt height), giving effective touch target of ~29x24pt.
                  // VoiceOver accesses this directly as a sibling button without parent nesting clipping.
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessibilityRole="button"
                  accessibilityLabel="إزالة الفلتر"
                  onPress={() => onClearFilter(qf.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={12.5} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </PhysicalHorizontalTrack>
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
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { 
        shadowColor: Colors.primaryDark, 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2 
      },
      android: { 
        elevation: 1 
      },
    }),
  },
  chipPressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingStart: 10,
    paddingEnd: 4,
    gap: 5,
  },
  chipPressableAreaInactive: {
    paddingEnd: 10,
  },
  clearButton: {
    paddingVertical: 6,
    paddingEnd: 8,
    paddingStart: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
