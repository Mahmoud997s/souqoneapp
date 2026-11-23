import React from 'react';
import fs from 'fs';
import path from 'path';
import { StyleSheet, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  VisualFiltersBase,
  VisualFilterTab,
  isSegmentedTabsFixed,
} from '../VisualFiltersBase';
import { FilterGlassTokens, SoftTactileTokens, QuickChipTokens } from '../../../constants/filterGlassTokens';
import { Colors } from '../../../constants/colors';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('VisualFiltersBase - Characterization Tests (Existing Behaviour)', () => {
  const dummyTabs: VisualFilterTab[] = [
    {
      id: 'tab1',
      label: 'التبويب الأول',
      items: [
        { id: 'item1', label: 'عنصر 1', isSelected: false },
        { id: 'item2', label: 'عنصر 2', isSelected: true },
      ],
    },
    {
      id: 'tab2',
      label: 'التبويب الثاني',
      items: [{ id: 'item3', label: 'عنصر 3' }],
    },
  ];

  it('correctly calculates isSegmentedTabsFixed', () => {
    expect(isSegmentedTabsFixed(1)).toBe(true);
    expect(isSegmentedTabsFixed(2)).toBe(true);
    expect(isSegmentedTabsFixed(3)).toBe(true);
    expect(isSegmentedTabsFixed(4)).toBe(false);
    expect(isSegmentedTabsFixed(5)).toBe(false);
  });

  it('renders tabs and active tab items', async () => {
    const { getByText } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" />
    );

    expect(getByText('التبويب الأول')).toBeTruthy();
    expect(getByText('التبويب الثاني')).toBeTruthy();
    expect(getByText('عنصر 1')).toBeTruthy();
    expect(getByText('عنصر 2')).toBeTruthy();
  });

  it('switches active tab when tab is pressed', async () => {
    const onTabChange = jest.fn();
    const { getByText } = await render(
      <VisualFiltersBase
        tabs={dummyTabs}
        defaultTab="tab1"
        onTabChange={onTabChange}
      />
    );

    fireEvent.press(getByText('التبويب الثاني'));
    expect(onTabChange).toHaveBeenCalledWith('tab2');
    await waitFor(() => {
      expect(getByText('عنصر 3')).toBeTruthy();
    });
  });

  it('renders skeleton grid when isLoading is true', async () => {
    const loadingTabs: VisualFilterTab[] = [
      {
        id: 'loadingTab',
        label: 'جار التحميل',
        isLoading: true,
      },
    ];

    const { queryByText, getByText } = await render(
      <VisualFiltersBase tabs={loadingTabs} />
    );
    expect(getByText('جار التحميل')).toBeTruthy();
    expect(queryByText('عنصر 1')).toBeNull();
  });

  it('renders custom emptyState when provided', async () => {
    const emptyTabs: VisualFilterTab[] = [
      {
        id: 'emptyTab',
        label: 'فارغ',
        emptyState: <Text>حالة فارغة مخصصة</Text>,
      },
    ];

    const { getByText } = await render(
      <VisualFiltersBase tabs={emptyTabs} />
    );
    expect(getByText('حالة فارغة مخصصة')).toBeTruthy();
  });

  it('renders View All button when onViewAll is provided and hideViewAll is not set', async () => {
    const onViewAll = jest.fn();
    const { getByText } = await render(
      <VisualFiltersBase
        tabs={dummyTabs}
        defaultTab="tab1"
        onViewAll={onViewAll}
      />
    );

    const viewAllBtn = getByText('عرض الكل');
    expect(viewAllBtn).toBeTruthy();
    fireEvent.press(viewAllBtn);
    expect(onViewAll).toHaveBeenCalledWith('tab1');
  });

  it('exposes accessibility role, label, state, and hitSlop on tabs', async () => {
    const { getByLabelText } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" />
    );

    const activeTab = getByLabelText('التبويب الأول');
    expect(activeTab.props.accessibilityRole).toBe('tab');
    expect(activeTab.props.accessibilityState).toEqual({ selected: true });
    expect(activeTab.props.hitSlop).toEqual({ top: 9, bottom: 9, left: 4, right: 4 });

    const inactiveTab = getByLabelText('التبويب الثاني');
    expect(inactiveTab.props.accessibilityRole).toBe('tab');
    expect(inactiveTab.props.accessibilityState).toEqual({ selected: false });
    expect(inactiveTab.props.hitSlop).toEqual({ top: 9, bottom: 9, left: 4, right: 4 });
  });

  it('exposes accessibility role, label, state, and hitSlop on item cards', async () => {
    const { getByLabelText } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" />
    );

    const unselectedItem = getByLabelText('عنصر 1');
    expect(unselectedItem.props.accessibilityRole).toBe('button');
    expect(unselectedItem.props.accessibilityState).toEqual({ selected: false });
    expect(unselectedItem.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 4, right: 4 });

    const selectedItem = getByLabelText('عنصر 2');
    expect(selectedItem.props.accessibilityRole).toBe('button');
    expect(selectedItem.props.accessibilityState).toEqual({ selected: true });
    expect(selectedItem.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 4, right: 4 });
  });

  it('exposes accessibility role, label, and hitSlop on View All button', async () => {
    const { getByLabelText } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" onViewAll={jest.fn()} />
    );

    const viewAll = getByLabelText('عرض الكل');
    expect(viewAll.props.accessibilityRole).toBe('button');
    expect(viewAll.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 4, right: 4 });
  });

  it('applies plain flat QuickChipTokens to normal and selected item cards without shadow, elevation, or inset overlay (D-380 Part 3)', async () => {
    const { getByLabelText, getByText, getByTestId, queryByTestId } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" />
    );

    const unselectedItem = getByLabelText('عنصر 1');
    const unselectedStyle = StyleSheet.flatten(unselectedItem.parent?.props.style);
    expect(unselectedStyle.backgroundColor).toBe(QuickChipTokens.normal.bg);
    expect(unselectedStyle.borderColor).toBe(QuickChipTokens.normal.borderColor);
    expect(unselectedStyle.borderWidth).toBe(QuickChipTokens.borderWidth);
    expect(unselectedStyle.borderRadius).toBe(FilterGlassTokens.card.borderRadius);
    expect(unselectedStyle.minWidth).toBe(95);
    expect(unselectedStyle.shadowOpacity).toBeUndefined();
    expect(unselectedStyle.elevation).toBeUndefined();
    expect(queryByTestId('visual-filter-item-inset-item1')).toBeNull();

    const selectedItem = getByLabelText('عنصر 2');
    const selectedStyle = StyleSheet.flatten(selectedItem.parent?.props.style);
    expect(selectedStyle.backgroundColor).toBe(Colors.primaryStrong);
    expect(selectedStyle.borderColor).toBe(Colors.primaryStrong);
    expect(selectedStyle.shadowOpacity).toBeUndefined();
    expect(selectedStyle.elevation).toBeUndefined();
    expect(queryByTestId('visual-filter-item-inset-item2')).toBeNull();

    const selectedLabelStyle = StyleSheet.flatten(getByText('عنصر 2').props.style);
    expect(selectedLabelStyle.color).toBe(Colors.white);

    // Bottom padding of visual filters block uses unified SoftTactileTokens.rhythm.sectionGap (12)
    const baseStyle = StyleSheet.flatten(getByTestId('visual-filters-base').props.style);
    expect(baseStyle.paddingBottom).toBe(SoftTactileTokens.rhythm.sectionGap);
  });

  it('applies pressed state styles on pressIn for both normal and selected visual filter cards without navy flash (D-380 Part 3)', async () => {
    const { getByLabelText, getByTestId, queryByTestId } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" />
    );

    // Normal card pressed -> paleMint fill + primary border
    const normalBtn = getByLabelText('عنصر 1');
    await fireEvent(normalBtn, 'pressIn');
    const normalPressedStyle = StyleSheet.flatten(getByTestId('visual-filter-card-item1').props.style);
    expect(normalPressedStyle.backgroundColor).toBe(Colors.paleMint);
    expect(normalPressedStyle.borderColor).toBe(Colors.primary);

    await fireEvent(normalBtn, 'pressOut');
    const normalRestoredStyle = StyleSheet.flatten(getByTestId('visual-filter-card-item1').props.style);
    expect(normalRestoredStyle.backgroundColor).toBe(Colors.surface);
    expect(normalRestoredStyle.borderColor).toBe(Colors.border);

    // Selected card pressed -> stays Colors.primary with turquoise scrim overlay (no navy flash)
    const selectedBtn = getByLabelText('عنصر 2');
    await fireEvent(selectedBtn, 'pressIn');
    const selectedPressedStyle = StyleSheet.flatten(getByTestId('visual-filter-card-item2').props.style);
    expect(selectedPressedStyle.backgroundColor).toBe(Colors.primaryStrong);
    expect(selectedPressedStyle.backgroundColor).not.toBe(Colors.primaryDark);
    const overlayStyle = StyleSheet.flatten(getByTestId('visual-filter-card-pressed-item2').props.style);
    expect(overlayStyle.backgroundColor).toBe(Colors.scrimDark15);

    await fireEvent(selectedBtn, 'pressOut');
    expect(queryByTestId('visual-filter-card-pressed-item2')).toBeNull();
  });

  it('contains no animation APIs in VisualFiltersBase.tsx and keeps uniform listHeader marginBottom across all 5 visual-filter browse pages (D-380 Part 3)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../VisualFiltersBase.tsx'), 'utf8');
    expect(src).not.toMatch(/\b(Animated|Reanimated|useSharedValue|withTiming|withSpring|LayoutAnimation)\b/);

    const root = path.resolve(__dirname, '../../../..');
    const visualBrowsePages = [
      'app/cars/browse.tsx',
      'app/buses/browse.tsx',
      'app/equipment/browse.tsx',
      'app/parts/browse.tsx',
      'app/services/browse.tsx',
    ];
    for (const rel of visualBrowsePages) {
      const pageSrc = fs.readFileSync(path.join(root, rel), 'utf8');
      expect({ file: rel, hasUniformListHeader: /listHeader:\s*\{\s*marginBottom:\s*Spacing\.space2,?\s*\}/.test(pageSrc) }).toEqual({
        file: rel,
        hasUniformListHeader: true,
      });
    }
  });
});
