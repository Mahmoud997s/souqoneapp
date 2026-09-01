import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { MultiSelectSearchModal, MultiSelectOption } from './MultiSelectSearchModal';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const sampleData: MultiSelectOption[] = [
  { id: 'toyota', label: 'تويوتا' },
  { id: 'nissan', label: 'نيسان' },
  { id: 'honda', label: 'هوندا' },
];

describe('MultiSelectSearchModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly with given options and initial selection', async () => {
    await render(
      <MultiSelectSearchModal
        visible={true}
        onClose={mockOnClose}
        title="اختر الماركات"
        data={sampleData}
        selectedValues={['toyota']}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('اختر الماركات')).toBeTruthy();
    expect(screen.getByText('تويوتا')).toBeTruthy();
    expect(screen.getByText('نيسان')).toBeTruthy();
    expect(screen.getByText('هوندا')).toBeTruthy();
  });

  it('toggles selection when tapping items and confirms', async () => {
    await render(
      <MultiSelectSearchModal
        visible={true}
        onClose={mockOnClose}
        title="اختر الماركات"
        data={sampleData}
        selectedValues={['toyota']}
        onConfirm={mockOnConfirm}
      />
    );

    const nissanItem = screen.getByTestId('multi-select-item-nissan');
    await act(async () => {
      fireEvent.press(nissanItem);
    });

    const confirmBtn = screen.getByText(/تأكيد الاختيار/);
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    expect(mockOnConfirm).toHaveBeenCalledWith(['toyota', 'nissan']);
  });

  it('clears all selections when clicking reset button', async () => {
    await render(
      <MultiSelectSearchModal
        visible={true}
        onClose={mockOnClose}
        title="اختر الماركات"
        data={sampleData}
        selectedValues={['toyota', 'nissan']}
        onConfirm={mockOnConfirm}
      />
    );

    const resetBtn = screen.getByText('مسح الكل');
    await act(async () => {
      fireEvent.press(resetBtn);
    });

    const confirmBtn = screen.getByText(/تأكيد الاختيار/);
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    expect(mockOnConfirm).toHaveBeenCalledWith([]);
  });

  it('filters list based on search query', async () => {
    await render(
      <MultiSelectSearchModal
        visible={true}
        onClose={mockOnClose}
        title="اختر الماركات"
        data={sampleData}
        selectedValues={[]}
        onConfirm={mockOnConfirm}
      />
    );

    const searchInput = screen.getByTestId('multi-select-search-input');
    await act(async () => {
      fireEvent.changeText(searchInput, 'نيسان');
    });

    expect(screen.getByText('نيسان')).toBeTruthy();
    expect(screen.queryByText('تويوتا')).toBeNull();
  });
});
