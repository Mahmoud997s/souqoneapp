import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  MyListingsVisualFilters,
  MAIN_CATEGORY_TABS,
} from '../MyListingsVisualFilters';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('MyListingsVisualFilters - Characterization Tests (Existing Behaviour)', () => {
  it('renders main category tabs', async () => {
    const { getByText } = await render(
      <MyListingsVisualFilters
        activeCategory="all"
        activeSubFilter="all_items"
        onSelectCategory={jest.fn()}
        onSelectSubFilter={jest.fn()}
      />
    );

    expect(getByText('الكل')).toBeTruthy();
    expect(getByText('سيارات')).toBeTruthy();
    expect(getByText('حافلات')).toBeTruthy();
    expect(getByText('معدات ثقيلة')).toBeTruthy();
    expect(getByText('قطع غيار')).toBeTruthy();
    expect(getByText('خدمات')).toBeTruthy();
  });

  it('renders sub-filters for active category and handles selection', async () => {
    const onSelectSubFilter = jest.fn();
    const { getByText } = await render(
      <MyListingsVisualFilters
        activeCategory="cars"
        activeSubFilter="all_cars"
        onSelectCategory={jest.fn()}
        onSelectSubFilter={onSelectSubFilter}
      />
    );

    // Cars category has 'للبيع' sub-filter
    const saleSub = getByText('للبيع');
    expect(saleSub).toBeTruthy();
    fireEvent.press(saleSub);
    expect(onSelectSubFilter).toHaveBeenCalledWith('SALE');
  });

  it('calls onSelectCategory when category tab is pressed', async () => {
    const onSelectCategory = jest.fn();
    const { getByText } = await render(
      <MyListingsVisualFilters
        activeCategory="all"
        activeSubFilter="all_items"
        onSelectCategory={onSelectCategory}
        onSelectSubFilter={jest.fn()}
      />
    );

    fireEvent.press(getByText('حافلات'));
    expect(onSelectCategory).toHaveBeenCalledWith('buses');
  });
});
