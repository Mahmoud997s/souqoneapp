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
      minCapacity: 15,
      capacityMin: 15,
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

  describe('Cars filter rules (M-018 & CodeRabbit)', () => {
    it('clears car model and trim when car make changes', async () => {
      const setFilters = jest.fn();
      const onClose = jest.fn();
      const brands = [
        { id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' },
        { id: 'nissan', name: 'Nissan', nameAr: 'نيسان' },
      ];
      const currentFilters = {
        makeId: 'toyota',
        make: 'Toyota',
        modelId: 'camry',
        model: 'Camry',
        trim: 'LE',
      };

      const { getByText } = await render(
        <LegacyQuickFilterModal
          visible={true}
          activeDropdown="make"
          onClose={onClose}
          filters={currentFilters}
          setFilters={setFilters}
          brands={brands}
          isBus={false}
          isService={false}
        />
      );

      await waitFor(() => {
        expect(getByText('نيسان')).toBeTruthy();
      });

      fireEvent.press(getByText('نيسان'));
      expect(setFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          makeId: 'nissan',
          make: 'Nissan',
        })
      );
      const applied = setFilters.mock.calls[0][0];
      expect(applied.modelId).toBeUndefined();
      expect(applied.model).toBeUndefined();
      expect(applied.trim).toBeUndefined();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('preserves car model and trim when re-selecting the same car make', async () => {
      const setFilters = jest.fn();
      const onClose = jest.fn();
      const brands = [{ id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' }];
      const currentFilters = {
        makeId: 'toyota',
        make: 'Toyota',
        modelId: 'camry',
        model: 'Camry',
        trim: 'LE',
      };

      const { getByText } = await render(
        <LegacyQuickFilterModal
          visible={true}
          activeDropdown="make"
          onClose={onClose}
          filters={currentFilters}
          setFilters={setFilters}
          brands={brands}
          isBus={false}
          isService={false}
        />
      );

      await waitFor(() => {
        expect(getByText('تويوتا')).toBeTruthy();
      });

      fireEvent.press(getByText('تويوتا'));
      expect(setFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          makeId: 'toyota',
          make: 'Toyota',
          modelId: 'camry',
          model: 'Camry',
          trim: 'LE',
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stores uppercase bodyType (e.g. SEDAN) and highlights normalized', async () => {
      const setFilters = jest.fn();
      const onClose = jest.fn();

      const { getByText } = await render(
        <LegacyQuickFilterModal
          visible={true}
          activeDropdown="type"
          onClose={onClose}
          filters={{ bodyType: 'sedan' }}
          setFilters={setFilters}
          isBus={false}
          isService={false}
        />
      );

      await waitFor(() => {
        expect(getByText('سيدان')).toBeTruthy();
      });

      fireEvent.press(getByText('سيدان'));
      expect(setFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          bodyType: 'SEDAN',
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Services filter rules (M-018 & CodeRabbit)', () => {
    it('writes specialization and specializations array on specialization selection', async () => {
      const setFilters = jest.fn();
      const onClose = jest.fn();

      const { getByText } = await render(
        <LegacyQuickFilterModal
          visible={true}
          activeDropdown="specialization"
          onClose={onClose}
          filters={{}}
          setFilters={setFilters}
          isService={true}
        />
      );

      await waitFor(() => {
        expect(getByText('التخصص')).toBeTruthy();
      });

      const firstSpec = getByText('ميكانيكا عامة');
      expect(firstSpec).toBeTruthy();
      fireEvent.press(firstSpec);

      expect(setFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          specialization: 'ميكانيكا عامة',
          specializations: ['ميكانيكا عامة'],
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Numeric brand ID normalization (M-025 & CodeRabbit)', () => {
    it('shows checkmark when bus brand has numeric ID and stored makeId is string (normalized comparison)', async () => {
      const brands = [
        { id: 42, label: 'سكانيا', nameAr: 'سكانيا', name: 'Scania' },
        { id: 43, label: 'مان', nameAr: 'مان', name: 'MAN' },
      ];
      const currentFilters = {
        makeId: '42',
        make: 'OtherBrand',
      };

      const { getByText, toJSON } = await render(
        <LegacyQuickFilterModal
          visible={true}
          activeDropdown="make"
          onClose={jest.fn()}
          filters={currentFilters}
          setFilters={jest.fn()}
          brands={brands}
          isBus={true}
        />
      );

      await waitFor(() => {
        expect(getByText('سكانيا')).toBeTruthy();
      });

      const jsonStr = JSON.stringify(toJSON());
      expect(jsonStr).toContain('"name":"checkmark"');
    });
  });
});
