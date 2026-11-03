import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickFilters, QuickFilterItem } from '../QuickFilters';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('QuickFilters - Characterization Tests (Existing Behaviour)', () => {
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
});
