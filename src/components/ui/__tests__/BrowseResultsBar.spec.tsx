import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BrowseResultsBar } from '../BrowseResultsBar';
import { FilterGlassTokens } from '../../../constants/filterGlassTokens';

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

  it('supports custom availabilitySuffix (e.g. متاح for masculine operators)', async () => {
    const { getByText } = await render(
      <BrowseResultsBar
        resultsCount={7}
        entityName="مشغل"
        availabilitySuffix="متاح"
        activeFiltersCount={0}
        onClearAll={jest.fn()}
      />
    );

    expect(getByText('7 مشغل متاح')).toBeTruthy();
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

  it('applies FilterGlassTokens.resultsBar tokens to count chip and clear button', async () => {
    const { getByText, getByLabelText } = await render(
      <BrowseResultsBar
        resultsCount={3}
        entityName="قطعة"
        activeFiltersCount={2}
        onClearAll={jest.fn()}
      />
    );

    const countText = getByText('3 قطعة متاحة');
    const countBadge = countText.parent;
    expect(countBadge?.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: FilterGlassTokens.resultsBar.countBg,
        borderColor: FilterGlassTokens.resultsBar.countBorderColor,
        borderWidth: FilterGlassTokens.resultsBar.countBorderWidth,
        borderRadius: FilterGlassTokens.resultsBar.countRadius,
      })
    );
    expect(countText.props.style).toEqual(
      expect.objectContaining({
        color: FilterGlassTokens.resultsBar.countTextColor,
      })
    );

    const clearBtn = getByLabelText('مسح الفلاتر');
    const clearBtnContainer = clearBtn.parent;
    expect(clearBtnContainer?.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: FilterGlassTokens.resultsBar.clearBg,
        borderColor: FilterGlassTokens.resultsBar.clearBorderColor,
        borderWidth: FilterGlassTokens.resultsBar.clearBorderWidth,
        borderRadius: FilterGlassTokens.resultsBar.clearRadius,
      })
    );

    const clearText = getByText('مسح الفلاتر');
    expect(clearText.props.style).toEqual(
      expect.objectContaining({
        color: FilterGlassTokens.resultsBar.clearTextColor,
      })
    );
  });
});
