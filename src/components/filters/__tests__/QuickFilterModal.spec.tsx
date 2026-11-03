import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickFilterModal, QuickFilterOption } from '../QuickFilterModal';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('QuickFilterModal - Pure Controlled Component', () => {
  const sampleOptions: QuickFilterOption[] = [
    { id: 'opt1', label: 'الخيار الأول' },
    { id: 'opt2', label: 'الخيار الثاني' },
    { id: 'opt3', label: 'الخيار الثالث' },
  ];

  it('renders null when visible is false', async () => {
    const { toJSON } = await render(
      <QuickFilterModal
        visible={false}
        title="تصفية تجريبية"
        options={sampleOptions}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders title and all options when visible is true', async () => {
    const { getByText } = await render(
      <QuickFilterModal
        visible={true}
        title="اختر القسم"
        options={sampleOptions}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByText('اختر القسم')).toBeTruthy();
    expect(getByText('الخيار الأول')).toBeTruthy();
    expect(getByText('الخيار الثاني')).toBeTruthy();
    expect(getByText('الخيار الثالث')).toBeTruthy();
  });

  it('highlights the selected option matching selectedId', async () => {
    const { getByTestId } = await render(
      <QuickFilterModal
        visible={true}
        title="اختر خياراً"
        options={sampleOptions}
        selectedId="opt2"
        onSelect={jest.fn()}
        onClose={jest.fn()}
        accentColor="#0066CC"
      />
    );

    expect(getByTestId('checkmark-icon')).toBeTruthy();
  });

  it('calls onSelect with the option id and triggers onClose on click', async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    const { getByText } = await render(
      <QuickFilterModal
        visible={true}
        title="اختر خياراً"
        options={sampleOptions}
        onSelect={onSelect}
        onClose={onClose}
      />
    );

    fireEvent.press(getByText('الخيار الثاني'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('opt2');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is pressed', async () => {
    const onClose = jest.fn();

    const { getByTestId } = await render(
      <QuickFilterModal
        visible={true}
        title="اختر خياراً"
        options={sampleOptions}
        onSelect={jest.fn()}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId('quick-filter-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when modal overlay is pressed', async () => {
    const onClose = jest.fn();

    const { getByTestId } = await render(
      <QuickFilterModal
        visible={true}
        title="اختر خياراً"
        options={sampleOptions}
        onSelect={jest.fn()}
        onClose={onClose}
      />
    );

    fireEvent.press(getByTestId('quick-filter-modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
