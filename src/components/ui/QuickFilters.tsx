import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FilterGlassTokens, SoftTactileTokens } from '../../constants/filterGlassTokens';
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
    <View testID="quick-filters-container" style={s.quickFiltersContainer}>
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
              {isActive && (
                <View
                  testID={`quick-filter-inset-${qf.id}`}
                  pointerEvents="none"
                  style={s.chipInsetOverlay}
                />
              )}
              <TouchableOpacity
                style={[s.chipPressableArea, !isActive && s.chipPressableAreaInactive]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={qf.label}
                accessibilityState={{ selected: Boolean(isActive) }}
                // Effective touch height: visible height is 29pt (paddingVertical 6*2 + lineHeight 15 + border 2).
                // hitSlop 8 top/bottom extends up to parent PhysicalHorizontalTrack bounds (minHeight 34pt),
                // yielding effective touch height of ~34pt (clipped by track bounds, keeping visible layout unchanged).
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                onPress={() => onFilterPress(qf.id)}
              >
                {!isActive && qf.icon && (
                  <Ionicons name={qf.icon} size={12.5} color={FilterGlassTokens.chip.iconColor} />
                )}
                <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
                  {qf.label}
                </Text>
                {!isActive && (
                  <Ionicons name="chevron-down" size={11} color={FilterGlassTokens.chip.iconColor} />
                )}
              </TouchableOpacity>
              {isActive && (
                <TouchableOpacity
                  style={s.clearButton}
                  // Effective clear target: 12.5pt icon with paddingVertical 6 + paddingEnd 10 (visible ~29x22.5pt).
                  // hitSlop 16 is bounded by the chip container (29pt height), giving effective touch target of ~29x24pt.
                  // VoiceOver accesses this directly as a sibling button without parent nesting clipping.
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessibilityRole="button"
                  accessibilityLabel="إزالة الفلتر"
                  onPress={() => onClearFilter(qf.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={12.5} color={SoftTactileTokens.inset.iconColor} />
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
    backgroundColor: Colors.transparent,
    marginTop: SoftTactileTokens.rhythm.sectionGap,
    marginBottom: 0,
  },
  quickFiltersContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: 2,
    gap: SoftTactileTokens.rhythm.chipGap,
    alignItems: 'center',
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: FilterGlassTokens.chip.borderRadius,
    backgroundColor: SoftTactileTokens.raised.bg,
    borderWidth: SoftTactileTokens.raised.borderWidth,
    borderColor: SoftTactileTokens.raised.borderColor,
    ...SoftTactileTokens.raised.shadow,
  },
  chipInsetOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: FilterGlassTokens.chip.borderRadius,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: SoftTactileTokens.inset.innerShadowColor,
    borderLeftColor: SoftTactileTokens.inset.innerShadowColor,
  },
  chipPressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingStart: 10,
    paddingEnd: 5,
    gap: 5,
  },
  chipPressableAreaInactive: {
    paddingEnd: 10,
  },
  clearButton: {
    paddingVertical: 6,
    paddingEnd: 10,
    paddingStart: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilterChipActive: {
    backgroundColor: SoftTactileTokens.inset.bg,
    borderColor: SoftTactileTokens.inset.borderColor,
    shadowOpacity: 0,
    elevation: 0,
  },
  quickFilterTxt: {
    fontFamily: FilterGlassTokens.chip.fontFamily,  
    fontSize: FilterGlassTokens.chip.fontSize,
    lineHeight: FilterGlassTokens.chip.lineHeight,
    color: FilterGlassTokens.chip.textColor,
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  quickFilterTxtActive: {
    color: SoftTactileTokens.inset.textColor,
  },
});
