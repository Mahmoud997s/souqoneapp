import React from 'react';
import { LayoutAnimation, StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickFilters } from '../components/ui/QuickFilters';
import { VisualFiltersBase } from '../components/ui/VisualFiltersBase';
import { FilterGlassTokens, SoftTactileTokens, QuickChipTokens } from '../constants/filterGlassTokens';
import { Colors } from '../constants/colors';

describe('D-359/D-377/D-379: Plain flat QuickFilters & soft tactile VisualFilters, transparent page bg, no tab animation, glass tab bar preserved', () => {
  it('QuickFilters uses transparent page bg, plain flat normal chips without FilterGlassSurface, solid primary selected chip without inset overlay, same sizes', async () => {
    const { getByTestId, getByLabelText, queryByTestId } = await render(
      <QuickFilters
        filters={[
          { id: 'brand', label: 'الماركة', isActive: false },
          { id: 'loc', label: 'مسقط', isActive: true },
        ]}
        onFilterPress={jest.fn()}
        onClearFilter={jest.fn()}
      />
    );

    const container = getByTestId('quick-filters-container');
    const containerStyle = StyleSheet.flatten(container.props.style);
    expect(containerStyle.backgroundColor).toBe(Colors.transparent);
    expect(containerStyle.marginTop).toBe(QuickChipTokens.row.marginTop);
    expect(containerStyle.marginBottom).toBe(QuickChipTokens.row.marginBottom);
    const trackStyle = StyleSheet.flatten(
      (container.children[0] as { props?: { style?: Record<string, unknown> } })?.props?.style as Record<string, unknown>
    ) as { minHeight?: number };
    expect(trackStyle.minHeight).toBe(34);

    expect(queryByTestId('quick-filter-glass-brand-layers')).toBeNull();
    expect(queryByTestId('quick-filter-glass-loc-layers')).toBeNull();

    const inactiveChip = getByLabelText('الماركة').parent;
    const inactiveStyle = StyleSheet.flatten(inactiveChip?.props.style);
    expect(inactiveStyle.backgroundColor).toBe(QuickChipTokens.normal.bg);
    expect(inactiveStyle.borderRadius).toBe(FilterGlassTokens.chip.borderRadius);
    expect(inactiveStyle.borderColor).toBe(QuickChipTokens.normal.borderColor);

    const activeChip = getByLabelText('مسقط').parent;
    const activeStyle = StyleSheet.flatten(activeChip?.props.style);
    expect(activeStyle.backgroundColor).toBe(QuickChipTokens.selected.bg);
    expect(activeStyle.borderRadius).toBe(FilterGlassTokens.chip.borderRadius);
    expect(activeStyle.borderColor).toBe(QuickChipTokens.selected.borderColor);
    expect(queryByTestId('quick-filter-inset-loc')).toBeNull();

    // Size tokens unchanged
    expect(FilterGlassTokens.chip.fontSize).toBe(11);
    expect(FilterGlassTokens.chip.lineHeight).toBe(15);
    expect(FilterGlassTokens.chip.borderRadius).toBe(20);
  });

  it('VisualFiltersBase removes LayoutAnimation on tab switch, keeps glass tab bar, and applies raised/inset tokens on transparent page bg', async () => {
    const layoutSpy = jest.spyOn(LayoutAnimation, 'configureNext');

    const { getByTestId, getByLabelText, queryByTestId } = await render(
      <VisualFiltersBase
        tabs={[
          {
            id: 'brands',
            label: 'الماركات',
            items: [
              { id: 'toyota', name: 'تويوتا', isSelected: false, onPress: jest.fn() },
              { id: 'nissan', name: 'نيسان', isSelected: true, onPress: jest.fn() },
            ],
          },
          {
            id: 'types',
            label: 'الأنواع',
            items: [{ id: 'sedan', name: 'سيدان', isSelected: false, onPress: jest.fn() }],
          },
        ]}
      />
    );

    // Segmented tab bar stays glass
    expect(getByTestId('visual-filters-track-glass-layers')).toBeTruthy();

    // Content area uses transparent page bg & preserves original minHeight (42 single-row)
    const contentAreaStyle = StyleSheet.flatten(getByTestId('visual-filters-content-area').props.style);
    expect(contentAreaStyle.backgroundColor).toBe(Colors.transparent);
    expect(contentAreaStyle.minHeight).toBe(42);

    // Cards no longer use FilterGlassSurface
    expect(queryByTestId('visual-filter-item-glass-toyota-layers')).toBeNull();
    expect(queryByTestId('visual-filter-item-glass-nissan-layers')).toBeNull();

    // Unselected card is raised with single hairline border
    const toyotaCard = getByLabelText('تويوتا').parent;
    const toyotaStyle = StyleSheet.flatten(toyotaCard?.props.style);
    expect(toyotaStyle.backgroundColor).toBe(SoftTactileTokens.raised.bg);
    expect(toyotaStyle.borderRadius).toBe(FilterGlassTokens.card.borderRadius);
    expect(toyotaStyle.borderColor).toBe(SoftTactileTokens.raised.borderColor);

    // Selected card is inset
    expect(getByTestId('visual-filter-item-inset-nissan')).toBeTruthy();

    // Tab switch does NOT invoke LayoutAnimation
    fireEvent.press(getByLabelText('الأنواع'));
    expect(layoutSpy).not.toHaveBeenCalled();

    // Size tokens unchanged
    expect(FilterGlassTokens.card.borderRadius).toBe(8);
    expect(FilterGlassTokens.card.fontSize).toBe(11);
    expect(FilterGlassTokens.card.lineHeight).toBe(15);

    layoutSpy.mockRestore();
  });
});
