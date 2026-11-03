import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ListingTabs, TabItem } from '../ListingTabs';

describe('ListingTabs - Characterization & Parity Tests', () => {
  const sampleTabs: TabItem[] = [
    { id: 'all', label: 'الكل' },
    { id: 'sale', label: 'للبيع' },
    { id: 'rent', label: 'للإيجار' },
  ];

  it('renders null when tabs is empty or undefined', async () => {
    const { toJSON: toJSON1 } = await render(
      <ListingTabs tabs={[]} onChangeTab={jest.fn()} />
    );
    expect(toJSON1()).toBeNull();

    const { toJSON: toJSON2 } = await render(
      <ListingTabs tabs={undefined as any} onChangeTab={jest.fn()} />
    );
    expect(toJSON2()).toBeNull();
  });

  it('renders all tab labels', async () => {
    const { getByText } = await render(
      <ListingTabs tabs={sampleTabs} onChangeTab={jest.fn()} />
    );

    expect(getByText('الكل')).toBeTruthy();
    expect(getByText('للبيع')).toBeTruthy();
    expect(getByText('للإيجار')).toBeTruthy();
  });

  it('calls onChangeTab when inactive tab is pressed', async () => {
    const onChangeTab = jest.fn();
    const { getByText } = await render(
      <ListingTabs
        tabs={sampleTabs}
        activeTabId="all"
        onChangeTab={onChangeTab}
      />
    );

    fireEvent.press(getByText('للبيع'));
    expect(onChangeTab).toHaveBeenCalledWith('sale');
  });

  it('calls onClearTab when active tab is pressed and onClearTab is provided', async () => {
    const onChangeTab = jest.fn();
    const onClearTab = jest.fn();
    const { getByText } = await render(
      <ListingTabs
        tabs={sampleTabs}
        activeTabId="sale"
        onChangeTab={onChangeTab}
        onClearTab={onClearTab}
      />
    );

    fireEvent.press(getByText('للبيع'));
    expect(onClearTab).toHaveBeenCalledTimes(1);
    expect(onChangeTab).not.toHaveBeenCalled();
  });

  it('calls onChangeTab when active tab is pressed but onClearTab is not provided', async () => {
    const onChangeTab = jest.fn();
    const { getByText } = await render(
      <ListingTabs
        tabs={sampleTabs}
        activeTabId="sale"
        onChangeTab={onChangeTab}
      />
    );

    fireEvent.press(getByText('للبيع'));
    expect(onChangeTab).toHaveBeenCalledWith('sale');
  });
});
