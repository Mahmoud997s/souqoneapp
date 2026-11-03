import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BrowseResultsBar } from '../BrowseResultsBar';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('BrowseResultsBar - Characterization & Parity Tests', () => {
  it('renders result count and entity name correctly', async () => {
    const { getByText } = await render(
      <BrowseResultsBar
        resultsCount={14}
        entityName="سيارة"
        activeFiltersCount={0}
        onClearAll={jest.fn()}
      />
    );

    expect(getByText('14 سيارة متاحة')).toBeTruthy();
  });

  it('does not render clear filters button when activeFiltersCount is 0', async () => {
    const { queryByText } = await render(
      <BrowseResultsBar
        resultsCount={5}
        entityName="معدة"
        activeFiltersCount={0}
        onClearAll={jest.fn()}
      />
    );

    expect(queryByText('مسح الفلاتر')).toBeNull();
  });

  it('renders clear filters button when activeFiltersCount > 0 and calls onClearAll on press', async () => {
    const onClearAll = jest.fn();
    const { getByText } = await render(
      <BrowseResultsBar
        resultsCount={3}
        entityName="قطعة"
        activeFiltersCount={2}
        onClearAll={onClearAll}
      />
    );

    const clearBtn = getByText('مسح الفلاتر');
    expect(clearBtn).toBeTruthy();

    fireEvent.press(clearBtn);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
