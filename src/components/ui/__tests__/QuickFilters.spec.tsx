import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickFilters, QuickFilterItem } from '../QuickFilters';
import { FilterGlassTokens } from '../../../constants/filterGlassTokens';

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

  it('applies ice glass tokens to inactive chips and primary tokens to active chips without overflow hidden', async () => {
    const { getByLabelText, getByText } = await render(
      <QuickFilters
        filters={dummyFilters}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );

    // Inactive chip parent container
    const inactiveText = getByText('الماركة');
    const inactivePressable = getByLabelText('الماركة');
    const inactiveChipContainer = inactivePressable.parent;
    expect(inactiveChipContainer?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: FilterGlassTokens.chip.bg,
          borderColor: FilterGlassTokens.chip.borderColor,
          borderWidth: FilterGlassTokens.chip.borderWidth,
          borderRadius: FilterGlassTokens.chip.borderRadius,
        }),
      ])
    );
    // iOS shadow preservation: overflow must NOT be hidden
    expect(inactiveChipContainer?.props.style).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ overflow: 'hidden' }),
      ])
    );

    // Active chip parent container
    const activePressable = getByLabelText('مسقط');
    const activeChipContainer = activePressable.parent;
    expect(activeChipContainer?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: FilterGlassTokens.chip.activeBg,
          borderColor: FilterGlassTokens.chip.activeBorderColor,
        }),
      ])
    );
  });
});
