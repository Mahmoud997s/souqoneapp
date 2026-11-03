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

describe('QuickFilterModal - Generalized Features (Equipment, Parts, Generics, Resiliency)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (locationsApi.getGovernorates as jest.Mock).mockResolvedValue([
      { id: 10, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 20, nameAr: 'ظفار', nameEn: 'Dhofar' },
    ]);
  });

  it('handles equipment category selection with isEquipment and categories prop', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const categories = [
      { id: 'all', label: 'الكل' },
      { id: 'HEAVY', label: 'معدات ثقيلة' },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="category"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isEquipment={true}
        categories={categories}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('معدات ثقيلة')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('معدات ثقيلة'));
    expect(setFilters).toHaveBeenCalledWith({
      categoryId: 'HEAVY',
      equipmentType: 'HEAVY',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles equipment condition selection', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const conditions = [
      { id: 'all', label: 'الكل' },
      { id: 'USED', label: 'مستعمل' },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="condition"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isEquipment={true}
        conditions={conditions}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('مستعمل')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('مستعمل'));
    expect(setFilters).toHaveBeenCalledWith({
      condition: 'USED',
      conditionId: 'USED',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles equipment price range selection including all and specific ranges', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const priceRanges = [
      { id: 'all', label: 'الكل', min: undefined, max: undefined },
      { id: '5k-10k', label: '5,000 - 10,000 ر.ع', min: 5000, max: 10000 },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="price"
        onClose={onClose}
        filters={{ priceMin: 5000, priceMax: 10000, priceId: '5k-10k' }}
        setFilters={setFilters}
        isEquipment={true}
        priceRanges={priceRanges}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('الكل')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('الكل'));
    expect(setFilters).toHaveBeenCalledWith({});
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles equipment year range selection', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const yearRanges = [
      { id: '2020-now', label: '2020 - الأحدث', min: 2020, max: undefined },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="year"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isEquipment={true}
        yearRanges={yearRanges}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2020 - الأحدث')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('2020 - الأحدث'));
    expect(setFilters).toHaveBeenCalledWith({
      yearMin: 2020,
      yearMax: undefined,
      yearId: '2020-now',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles equipment hours range selection', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const hoursRanges = [
      { id: '0-1000', label: 'أقل من 1,000 ساعة', min: undefined, max: 1000 },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="hours"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isEquipment={true}
        hoursRanges={hoursRanges}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('أقل من 1,000 ساعة')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('أقل من 1,000 ساعة'));
    expect(setFilters).toHaveBeenCalledWith({
      hoursMin: undefined,
      hoursMax: 1000,
      hoursId: '0-1000',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles equipment city selection setting governorateId and clearing wilayaId/city', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="city"
        onClose={onClose}
        filters={{ wilayaId: 'wilaya-1', city: 'سيب' }}
        setFilters={setFilters}
        isEquipment={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('مسقط')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('مسقط'));
    expect(setFilters).toHaveBeenCalledWith({
      governorateId: 10,
      wilayaId: undefined,
      city: undefined,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles parts category selection with isPart and categories prop', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const categories = [
      { id: 'all', label: 'الكل' },
      { id: 'ENGINE', label: 'قطع محرك' },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="category"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isPart={true}
        categories={categories}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('قطع محرك')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('قطع محرك'));
    expect(setFilters).toHaveBeenCalledWith({ category: 'ENGINE' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles parts condition selection with isPart and conditions prop', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const conditions = [
      { id: 'NEW', label: 'جديد' },
      { id: 'USED', label: 'مستعمل' },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="condition"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isPart={true}
        conditions={conditions}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('جديد')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('جديد'));
    expect(setFilters).toHaveBeenCalledWith({ condition: 'NEW' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles parts price range selection setting priceMin and priceMax', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const priceRanges = [
      { id: '0-50', label: 'أقل من 50 ر.ع', min: undefined, max: 50 },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="price"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isPart={true}
        priceRanges={priceRanges}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('أقل من 50 ر.ع')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('أقل من 50 ر.ع'));
    expect(setFilters).toHaveBeenCalledWith({
      priceMin: undefined,
      priceMax: '50',
      priceId: '0-50',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles parts sort selection with custom sortOptions', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const sortOptions = [
      { id: 'newest', label: 'الأحدث أولاً' },
      { id: 'price_asc', label: 'السعر: الأقل أولاً' },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="sort"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        isPart={true}
        sortOptions={sortOptions}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('الأحدث أولاً')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('الأحدث أولاً'));
    expect(setFilters).toHaveBeenCalledWith({ sort: 'newest' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles parts city selection setting governorateId, governorate and city', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="city"
        onClose={onClose}
        filters={{ wilayaId: 'wilaya-1' }}
        setFilters={setFilters}
        isPart={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('مسقط')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('مسقط'));
    expect(setFilters).toHaveBeenCalledWith({
      governorateId: 10,
      governorate: 'مسقط',
      city: 'مسقط',
      wilayaId: undefined,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders and selects custom generic options if provided', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();
    const options = [
      { id: 'opt1', label: 'خيار 1', key: 'customKey', value: 'customValue' },
    ];

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="custom"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        options={options}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('خيار 1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('خيار 1'));
    expect(setFilters).toHaveBeenCalledWith({
      customKey: 'customValue',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gracefully handles governorates fetch failure without throwing or logging console.warn', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (locationsApi.getGovernorates as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    await render(
      <QuickFilterModal
        visible={true}
        activeDropdown="city"
        onClose={jest.fn()}
        filters={{}}
        setFilters={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(locationsApi.getGovernorates).toHaveBeenCalledTimes(1);
    });

    // Should not call console.warn
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
