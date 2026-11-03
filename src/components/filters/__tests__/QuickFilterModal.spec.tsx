import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickFilterModal } from '../QuickFilterModal';
import { locationsApi } from '../../../api/locations';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
  },
}));

describe('QuickFilterModal - Characterization Tests (Existing Behaviour)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (locationsApi.getGovernorates as jest.Mock).mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
    ]);
  });

  it('renders null when visible is false', async () => {
    await render(
      <QuickFilterModal
        visible={false}
        activeDropdown="make"
        onClose={jest.fn()}
        filters={{}}
        setFilters={jest.fn()}
      />
    );
    expect(screen.toJSON()).toBeNull();
  });

  it('displays correct title for make dropdown', async () => {
    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="make"
        onClose={jest.fn()}
        filters={{}}
        setFilters={jest.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('اختر الماركة')).toBeTruthy();
    });
  });

  it('handles brand/make selection and calls setFilters + onClose', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const brands = [{ id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' }];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="make"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        brands={brands}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('تويوتا')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('تويوتا'));
    expect(setFilters).toHaveBeenCalledWith({
      makeId: 'toyota',
      make: 'Toyota',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fetches and selects governorate, setting numeric ID, names and clearing wilayaId', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="city"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
      />
    );

    await waitFor(() => {
      expect(locationsApi.getGovernorates).toHaveBeenCalledTimes(1);
      expect(screen.getByText('مسقط')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('مسقط'));
    expect(setFilters).toHaveBeenCalledWith({
      governorateId: 1,
      governorate: 'مسقط',
      city: 'مسقط',
      wilayaId: undefined,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles year selection', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="year"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2024')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('2024'));
    expect(setFilters).toHaveBeenCalledWith({
      yearMin: '2024',
      yearMax: '2024',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles car body type selection', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="type"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('سيدان')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('سيدان'));
    expect(setFilters).toHaveBeenCalledWith({
      bodyType: 'sedan',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles busType selection in bus mode', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="busType"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isBus={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ميني باص')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('ميني باص'));
    expect(setFilters).toHaveBeenCalledWith({
      busType: 'MINI_BUS',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles bus capacity selection in bus mode', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="capacity"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isBus={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('+ 15 مقعد')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('+ 15 مقعد'));
    expect(setFilters).toHaveBeenCalledWith({
      capacityMin: 15,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles serviceType selection in service mode', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="serviceType"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isService={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('صيانة وميكانيكا')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('صيانة وميكانيكا'));
    expect(setFilters).toHaveBeenCalledWith({
      serviceType: 'MAINTENANCE',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles providerType selection in service mode', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="providerType"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isService={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('فني مستقل')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('فني مستقل'));
    expect(setFilters).toHaveBeenCalledWith({
      providerType: 'INDIVIDUAL',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles sort selection for buses', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="sort"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isBus={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('السعر: الأقل للأعلى')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('السعر: الأقل للأعلى'));
    expect(setFilters).toHaveBeenCalledWith({ sort: 'price_asc' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles sort selection for services', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="sort"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isService={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('الأعلى تقييماً')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('الأعلى تقييماً'));
    expect(setFilters).toHaveBeenCalledWith({ sortBy: 'rating', sortOrder: 'desc' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
