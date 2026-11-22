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
    expect(activeChipStyle.backgroundColor).toBe(Colors.primary);
    expect(activeChipStyle.borderColor).toBe(Colors.primary);
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

    // Selected chip pressed -> primaryDark fill + primaryDark border
    const selectedBtn = getByLabelText('مسقط');
    await fireEvent(selectedBtn, 'pressIn');
    const selectedPressedStyle = StyleSheet.flatten(getByTestId('quick-filter-chip-f2').props.style);
    expect(selectedPressedStyle.backgroundColor).toBe(Colors.primaryDark);
    expect(selectedPressedStyle.borderColor).toBe(Colors.primaryDark);

    await fireEvent(selectedBtn, 'pressOut');
    const selectedRestoredStyle = StyleSheet.flatten(getByTestId('quick-filter-chip-f2').props.style);
    expect(selectedRestoredStyle.backgroundColor).toBe(Colors.primary);
    expect(selectedRestoredStyle.borderColor).toBe(Colors.primary);
  });

  it('contains no animation APIs or activeOpacity in QuickFilters.tsx (D-379)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../QuickFilters.tsx'), 'utf8');
    expect(src).not.toMatch(/\b(Animated|Reanimated|useSharedValue|withTiming|withSpring|LayoutAnimation|TouchableOpacity|activeOpacity)\b/);
  });
});
