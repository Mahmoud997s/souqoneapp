import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  VisualFiltersBase,
  VisualFilterTab,
  isSegmentedTabsFixed,
} from '../VisualFiltersBase';
import { FilterGlassTokens } from '../../../constants/filterGlassTokens';

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

  it('applies FilterGlassTokens.card styles to item cards and track', async () => {
    const { getByLabelText } = await render(
      <VisualFiltersBase tabs={dummyTabs} defaultTab="tab1" />
    );

    const unselectedItem = getByLabelText('عنصر 1');
    const unselectedContainer = unselectedItem.parent;
    expect(unselectedContainer?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: FilterGlassTokens.card.bg,
          borderColor: FilterGlassTokens.card.borderColor,
          borderWidth: FilterGlassTokens.card.borderWidth,
          borderRadius: FilterGlassTokens.card.borderRadius,
        }),
      ])
    );

    const selectedItem = getByLabelText('عنصر 2');
    const selectedContainer = selectedItem.parent;
    expect(selectedContainer?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: FilterGlassTokens.card.selectedBg,
          borderColor: FilterGlassTokens.card.selectedBorderColor,
        }),
      ])
    );
  });
});
