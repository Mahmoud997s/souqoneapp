import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LegacyQuickFilterModal } from '../LegacyQuickFilterModal';
import { locationsApi } from '../../../api/locations';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
  },
}));

describe('LegacyQuickFilterModal - Characterization Tests (Existing Behaviour)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (locationsApi.getGovernorates as jest.Mock).mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
    ]);
  });

  it('renders null when visible is false', async () => {
    const { toJSON } = await render(
      <LegacyQuickFilterModal
        visible={false}
        activeDropdown="make"
        onClose={jest.fn()}
        filters={{}}
        setFilters={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it('displays correct title for make dropdown', async () => {
    const { getByText } = await render(
      <LegacyQuickFilterModal
        visible={true}
        activeDropdown="make"
        onClose={jest.fn()}
        filters={{}}
        setFilters={jest.fn()}
      />
    );
    await waitFor(() => {
      expect(getByText('اختر الماركة')).toBeTruthy();
    });
  });

  it('handles brand/make selection and calls setFilters + onClose', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const brands = [{ id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' }];

    const { getByText } = await render(
      <LegacyQuickFilterModal
        visible={true}
        activeDropdown="make"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        brands={brands}
      />
    );

    await waitFor(() => {
      expect(getByText('تويوتا')).toBeTruthy();
    });

    fireEvent.press(getByText('تويوتا'));
    expect(setFilters).toHaveBeenCalledWith({
      makeId: 'toyota',
      make: 'Toyota',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fetches and selects governorate, setting numeric ID and clearing wilayaId', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    const { getByText } = await render(
      <LegacyQuickFilterModal
        visible={true}
        activeDropdown="city"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
      />
    );

    await waitFor(() => {
      expect(locationsApi.getGovernorates).toHaveBeenCalledTimes(1);
      expect(getByText('مسقط')).toBeTruthy();
    });

    fireEvent.press(getByText('مسقط'));
    expect(setFilters).toHaveBeenCalledWith({
      governorateId: 1,
      governorate: 'مسقط',
      city: 'مسقط',
      wilayaId: undefined,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports bus-specific dropdowns (busType, capacity)', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    const { getByText } = await render(
      <LegacyQuickFilterModal
        visible={true}
        activeDropdown="capacity"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isBus={true}
      />
    );

    await waitFor(() => {
      expect(getByText('سعة الحافلة')).toBeTruthy();
      expect(getByText('+ 15 مقعد')).toBeTruthy();
    });

    fireEvent.press(getByText('+ 15 مقعد'));
    expect(setFilters).toHaveBeenCalledWith({
      capacity: 15,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports services-specific dropdowns (serviceType, specialization, providerType)', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    const { getByText } = await render(
      <LegacyQuickFilterModal
        visible={true}
        activeDropdown="serviceType"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isService={true}
      />
    );

    await waitFor(() => {
      expect(getByText('نوع الخدمة')).toBeTruthy();
    });
  });
});
