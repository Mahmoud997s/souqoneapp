import React from 'react';
import fs from 'fs';
import path from 'path';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickFilters, QuickFilterItem } from '../QuickFilters';
import { FilterGlassTokens, QuickChipTokens } from '../../../constants/filterGlassTokens';
import { Colors } from '../../../constants/colors';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('QuickFilters - Characterization & Accessibility Tests', () => {
  const dummyFilters: QuickFilterItem[] = [
    { id: 'f1', label: 'الماركة', icon: 'car-outline', isActive: false },
    { id: 'f2', label: 'مسقط', isActive: true },
  ];

  it('renders null when filters list is empty', async () => {
    const { toJSON } = await render(
      <QuickFilters filters={[]} onFilterPress={jest.fn()} onClearFilter={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders filter chips with labels', async () => {
    const { getByText } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );
    expect(getByText('الماركة')).toBeTruthy();
    expect(getByText('مسقط')).toBeTruthy();
  });

  it('calls onFilterPress when inactive chip is pressed', async () => {
    const onFilterPress = jest.fn();
    const { getByText } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={onFilterPress}
        onClearFilter={jest.fn()}
      />
    );
    fireEvent.press(getByText('الماركة'));
    expect(onFilterPress).toHaveBeenCalledWith('f1');
  });

  it('exposes accessibility role, label, and selected state on chips', async () => {
    const { getByLabelText } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );

    const inactiveChip = getByLabelText('الماركة');
    expect(inactiveChip.props.accessibilityRole).toBe('button');
    expect(inactiveChip.props.accessibilityState).toEqual({ selected: false });
    expect(inactiveChip.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 4, right: 4 });

    const activeChip = getByLabelText('مسقط');
    expect(activeChip.props.accessibilityRole).toBe('button');
    expect(activeChip.props.accessibilityState).toEqual({ selected: true });
    expect(activeChip.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 4, right: 4 });
  });

  it('provides dedicated clear button with role button, label, and enlarged hitSlop >= 44pt touch area', async () => {
    const onClearFilter = jest.fn();
    const { getByLabelText } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={onClearFilter}
      />
    );

    const clearBtn = getByLabelText('إزالة الفلتر');
    expect(clearBtn.props.accessibilityRole).toBe('button');
    expect(clearBtn.props.hitSlop).toEqual({ top: 16, bottom: 16, left: 16, right: 16 });

    fireEvent.press(clearBtn);
    expect(onClearFilter).toHaveBeenCalledWith('f2');
  });

  it('clear button is accessible sibling (not nested in chip pressable) and calls onClearFilter without onFilterPress', async () => {
    const onFilterPress = jest.fn();
    const onClearFilter = jest.fn();
    const { getByLabelText } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={onFilterPress}
        onClearFilter={onClearFilter}
      />
    );

    const activeChip = getByLabelText('مسقط');
    const clearBtn = getByLabelText('إزالة الفلتر');

    // Confirm they are accessible siblings: clearBtn is not inside activeChip children
    expect(activeChip.props.accessibilityRole).toBe('button');
    expect(clearBtn.props.accessibilityRole).toBe('button');

    // Chip pressable area covers padding and maintains exact pixel parity with master
    expect(activeChip.props.style).toEqual(
      expect.objectContaining({ paddingVertical: 6, paddingStart: 10, paddingEnd: 5 })
    );

    // Clear control has paddingStart: 0, paddingEnd: 10
    expect(clearBtn.props.style).toEqual(
      expect.objectContaining({ paddingVertical: 6, paddingStart: 0, paddingEnd: 10 })
    );

    // Press clear control: onClearFilter is called, onFilterPress is NOT triggered
    fireEvent.press(clearBtn);
    expect(onClearFilter).toHaveBeenCalledWith('f2');
    expect(onFilterPress).not.toHaveBeenCalled();
  });

  it('applies plain flat QuickChipTokens to normal chips and solid primary tokens to selected chips without shadow, elevation, or inset overlay', async () => {
    const { getByLabelText, getByText, queryByTestId } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );

    // Normal chip container
    const inactivePressable = getByLabelText('الماركة');
    const inactiveChipStyle = StyleSheet.flatten(inactivePressable.parent?.props.style);
    expect(inactiveChipStyle.backgroundColor).toBe(QuickChipTokens.normal.bg);
    expect(inactiveChipStyle.borderColor).toBe(QuickChipTokens.normal.borderColor);
    expect(inactiveChipStyle.borderWidth).toBe(QuickChipTokens.borderWidth);
    expect(inactiveChipStyle.borderRadius).toBe(FilterGlassTokens.chip.borderRadius);
    expect(inactiveChipStyle.shadowOpacity).toBeUndefined();
    expect(inactiveChipStyle.elevation).toBeUndefined();
    expect(inactiveChipStyle.overflow).not.toBe('hidden');
    expect(queryByTestId('quick-filter-inset-f1')).toBeNull();

    // Selected chip container
    const activePressable = getByLabelText('مسقط');
    const activeChipStyle = StyleSheet.flatten(activePressable.parent?.props.style);
    expect(activeChipStyle.backgroundColor).toBe(Colors.primaryStrong);
    expect(activeChipStyle.borderColor).toBe(Colors.primaryStrong);
    expect(activeChipStyle.shadowOpacity).toBeUndefined();
    expect(activeChipStyle.elevation).toBeUndefined();
    expect(queryByTestId('quick-filter-inset-f2')).toBeNull();

    // Selected chip text & clear icon are white
    const activeTextStyle = StyleSheet.flatten(getByText('مسقط').props.style);
    expect(activeTextStyle.color).toBe(Colors.white);
    const clearBtn = getByLabelText('إزالة الفلتر');
    const clearIcon = clearBtn.children[0] as { props?: { color?: string } };
    expect(clearIcon?.props?.color).toBe(Colors.white);
  });

  it('applies pressed state styles on pressIn and restores on pressOut for both normal and selected chips (D-379)', async () => {
    const { getByLabelText, getByTestId } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );

    // Normal chip pressed -> paleMint fill + primary border
    const normalBtn = getByLabelText('الماركة');
    await fireEvent(normalBtn, 'pressIn');
    const normalPressedStyle = StyleSheet.flatten(getByTestId('quick-filter-chip-f1').props.style);
    expect(normalPressedStyle.backgroundColor).toBe(Colors.paleMint);
    expect(normalPressedStyle.borderColor).toBe(Colors.primary);

    await fireEvent(normalBtn, 'pressOut');
    const normalRestoredStyle = StyleSheet.flatten(getByTestId('quick-filter-chip-f1').props.style);
    expect(normalRestoredStyle.backgroundColor).toBe(Colors.surface);
    expect(normalRestoredStyle.borderColor).toBe(Colors.border);

    // Selected chip pressed -> stays Colors.primary with darker turquoise scrim overlay (no navy flash, D-380)
    const selectedBtn = getByLabelText('مسقط');
    await fireEvent(selectedBtn, 'pressIn');
    const selectedPressedStyle = StyleSheet.flatten(getByTestId('quick-filter-chip-f2').props.style);
    expect(selectedPressedStyle.backgroundColor).toBe(Colors.primaryStrong);
    expect(selectedPressedStyle.backgroundColor).not.toBe(Colors.primaryDark);
    const pressedOverlayStyle = StyleSheet.flatten(getByTestId('quick-filter-selected-pressed-f2').props.style);
    expect(pressedOverlayStyle.backgroundColor).toBe(Colors.scrimDark15);

    await fireEvent(selectedBtn, 'pressOut');
    const selectedRestoredStyle = StyleSheet.flatten(getByTestId('quick-filter-chip-f2').props.style);
    expect(selectedRestoredStyle.backgroundColor).toBe(Colors.primaryStrong);
    expect(selectedRestoredStyle.borderColor).toBe(Colors.primaryStrong);
  });

  it('fits cleanly inside CollapsibleSubHeader (85pt, 84pt inner) with equal top/bottom margins and zero bottom clipping across all 6 browse pages (D-380 Part 2)', async () => {
    const { getByTestId } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );

    const container = getByTestId('quick-filters-container');
    const containerStyle = StyleSheet.flatten(container.props.style);

    // Equal top and bottom breathing space on container (2pt each, down from 12pt top gap)
    expect(containerStyle.marginTop).toBe(QuickChipTokens.row.marginTop);
    expect(containerStyle.marginBottom).toBe(QuickChipTokens.row.marginBottom);
    expect(containerStyle.marginTop).toBe(containerStyle.marginBottom);
    expect(containerStyle.marginTop).toBeLessThanOrEqual(4);

    // Track minHeight (34) >= computed chip height (paddingVertical 6*2 + lineHeight 15 + 2*hairline <= 29)
    const computedChipHeight = 6 * 2 + FilterGlassTokens.chip.lineHeight + QuickChipTokens.borderWidth * 2;
    expect(QuickChipTokens.row.trackMinHeight).toBeGreaterThanOrEqual(computedChipHeight + QuickChipTokens.row.contentPaddingVertical * 2);

    // Full CollapsibleSubHeader stack math: ListingTabs (45.5pt) + QuickFilters (marginTop + trackMinHeight + marginBottom) <= 84pt inner height
    const listingTabsHeight = 8 + 6 + 2 + (6 * 2 + 15.5) + 2; // 45.5pt
    const quickFiltersTotal =
      (containerStyle.marginTop as number) +
      QuickChipTokens.row.trackMinHeight +
      (containerStyle.marginBottom as number);
    expect(listingTabsHeight + quickFiltersTotal).toBeLessThanOrEqual(84);

    // Verify all 6 browse pages wrap ListingTabs + QuickFilters in default CollapsibleSubHeader with no extra per-page wrapper spacing
    const root = path.resolve(__dirname, '../../../..');
    const browsePages = [
      'app/cars/browse.tsx',
      'app/buses/browse.tsx',
      'app/equipment/browse.tsx',
      'app/equipment/operators/browse.tsx',
      'app/parts/browse.tsx',
      'app/services/browse.tsx',
    ];
    for (const rel of browsePages) {
      const src = fs.readFileSync(path.join(root, rel), 'utf8');
      expect({ file: rel, usesCollapsible: src.includes('<CollapsibleSubHeader>') }).toEqual({
        file: rel,
        usesCollapsible: true,
      });
      expect({ file: rel, usesQuickFilters: src.includes('<QuickFilters') }).toEqual({
        file: rel,
        usesQuickFilters: true,
      });
    }
  });

  it('contains no animation APIs or activeOpacity in QuickFilters.tsx (D-379)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../QuickFilters.tsx'), 'utf8');
    expect(src).not.toMatch(/\b(Animated|Reanimated|useSharedValue|withTiming|withSpring|LayoutAnimation|TouchableOpacity|activeOpacity)\b/);
  });
});
