import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FilterGlassTokens, SoftTactileTokens, QuickChipTokens } from '../../constants/filterGlassTokens';
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

interface QuickFilterChipProps {
  item: QuickFilterItem;
  onFilterPress: (id: string) => void;
  onClearFilter: (id: string) => void;
}

function QuickFilterChip({ item, onFilterPress, onClearFilter }: QuickFilterChipProps) {
  const isActive = Boolean(item.isActive);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClearPressed, setIsClearPressed] = useState(false);

  const isSelectedPressed = isActive && (isPressed || isHovered || isClearPressed);

  const chipStateStyle = isActive
    ? isSelectedPressed
      ? s.quickFilterChipSelectedPressed
      : s.quickFilterChipActive
    : isPressed
      ? s.quickFilterChipPressed
      : isHovered
        ? s.quickFilterChipHovered
        : null;

  return (
    <View
      testID={`quick-filter-chip-${item.id}`}
      style={[s.quickFilterChip, chipStateStyle]}
    >
      {isSelectedPressed && (
        <View
          testID={`quick-filter-selected-pressed-${item.id}`}
          pointerEvents="none"
          style={s.chipSelectedPressedOverlay}
        />
      )}
      <Pressable
        style={isActive ? s.chipPressableArea : s.chipPressableAreaInactive}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: isActive }}
        // Effective touch height: visible height is ~28pt (paddingVertical 6*2 + lineHeight 15 + hairline border).
        // hitSlop 8 top/bottom extends up to parent PhysicalHorizontalTrack bounds (minHeight 34pt),
        // yielding effective touch height of ~34pt (clipped by track bounds, keeping visible layout unchanged).
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        onPress={() => onFilterPress(item.id)}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
      >
        {!isActive && item.icon && (
          <Ionicons name={item.icon} size={12.5} color={QuickChipTokens.normal.iconColor} />
        )}
        <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
          {item.label}
        </Text>
        {!isActive && (
          <Ionicons name="chevron-down" size={11} color={QuickChipTokens.normal.iconColor} />
        )}
      </Pressable>
      {isActive && (
        <Pressable
          style={s.clearButton}
          // Effective clear target: 12.5pt icon with paddingVertical 6 + paddingEnd 10.
          // hitSlop 16 is bounded by the chip container, giving accessible sibling hit area without parent nesting clipping.
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="إزالة الفلتر"
          onPress={() => onClearFilter(item.id)}
          onPressIn={() => setIsClearPressed(true)}
          onPressOut={() => setIsClearPressed(false)}
        >
          <Ionicons name="close-circle" size={12.5} color={QuickChipTokens.selected.iconColor} />
        </Pressable>
      )}
    </View>
  );
}

export function QuickFilters({ filters, onFilterPress, onClearFilter }: QuickFiltersProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <View testID="quick-filters-container" style={s.quickFiltersContainer}>
      <PhysicalHorizontalTrack
        minHeight={QuickChipTokens.row.trackMinHeight}
        contentContainerStyle={s.quickFiltersContent}
      >
        {filters.map((qf) => (
          <QuickFilterChip
            key={qf.id}
            item={qf}
            onFilterPress={onFilterPress}
            onClearFilter={onClearFilter}
          />
        ))}
      </PhysicalHorizontalTrack>
    </View>
  );
}

const s = StyleSheet.create({
  quickFiltersContainer: {
    backgroundColor: Colors.transparent,
    marginTop: QuickChipTokens.row.marginTop,
    marginBottom: QuickChipTokens.row.marginBottom,
  },
  quickFiltersContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: QuickChipTokens.row.contentPaddingVertical,
    gap: SoftTactileTokens.rhythm.chipGap,
    alignItems: 'center',
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: FilterGlassTokens.chip.borderRadius,
    backgroundColor: QuickChipTokens.normal.bg,
    borderWidth: QuickChipTokens.borderWidth,
    borderColor: QuickChipTokens.normal.borderColor,
  },
  quickFilterChipPressed: {
    backgroundColor: QuickChipTokens.pressed.bg,
    borderColor: QuickChipTokens.pressed.borderColor,
  },
  quickFilterChipHovered: {
    backgroundColor: QuickChipTokens.hover.bg,
    borderColor: QuickChipTokens.hover.borderColor,
  },
  quickFilterChipActive: {
    backgroundColor: QuickChipTokens.selected.bg,
    borderColor: QuickChipTokens.selected.borderColor,
  },
  quickFilterChipSelectedPressed: {
    backgroundColor: QuickChipTokens.selectedPressed.bg,
    borderColor: QuickChipTokens.selectedPressed.borderColor,
  },
  chipSelectedPressedOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: FilterGlassTokens.chip.borderRadius,
    backgroundColor: QuickChipTokens.selectedPressed.overlayBg,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingStart: 10,
    paddingEnd: 10,
    gap: 5,
  },
  clearButton: {
    paddingVertical: 6,
    paddingEnd: 10,
    paddingStart: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilterTxt: {
    fontFamily: FilterGlassTokens.chip.fontFamily,
    fontSize: FilterGlassTokens.chip.fontSize,
    lineHeight: FilterGlassTokens.chip.lineHeight,
    color: QuickChipTokens.normal.textColor,
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  quickFilterTxtActive: {
    color: QuickChipTokens.selected.textColor,
  },
});
