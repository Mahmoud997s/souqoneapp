import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickFilterModal, QuickFilterOption } from '../QuickFilterModal';
import { FilterGlassTokens } from '../../../constants/filterGlassTokens';
import { locationsApi } from '../../../api/locations';
import { useFilterLocations, clearFilterLocationsCache } from '../../../hooks/useFilterLocations';
import {
  buildQuickFilterDropdownData,
  applyQuickFilterDropdownSelection,
  QuickFilterBrandItem,
  QuickFilterVertical,
} from '../../../utils/browse-filters/quickFilterDropdown';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
    getWilayas: jest.fn(),
  },
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

  it('applies FilterGlassTokens.sheet styles to modal card, title, and option text', async () => {
    const { getByText } = await render(
      <QuickFilterModal
        visible={true}
        title="تصفية زجاجية"
        options={sampleOptions}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const titleText = getByText('تصفية زجاجية');
    expect(titleText.props.style).toEqual(
      expect.objectContaining({
        color: FilterGlassTokens.sheet.titleColor,
        fontFamily: FilterGlassTokens.sheet.titleFontFamily,
        fontSize: FilterGlassTokens.sheet.titleFontSize,
      })
    );

    const optionText = getByText('الخيار الأول');
    expect(optionText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: FilterGlassTokens.sheet.optionTextColor,
          fontFamily: FilterGlassTokens.sheet.optionFontFamily,
          fontSize: FilterGlassTokens.sheet.optionFontSize,
        }),
      ])
    );
  });
});

interface QuickFilterHarnessProps<TFilters extends object> {
  visible: boolean;
  activeDropdown: string | null;
  onClose: () => void;
  filters: TFilters;
  setFilters: (next: TFilters) => void;
  brands?: QuickFilterBrandItem[];
  vertical?: QuickFilterVertical;
}

function QuickFilterModalHarness<TFilters extends object>({
  visible,
  activeDropdown,
  onClose,
  filters,
  setFilters,
  brands = [],
  vertical = 'cars',
}: QuickFilterHarnessProps<TFilters>) {
  const { governorates } = useFilterLocations(
    undefined,
    visible && (activeDropdown === 'city' || activeDropdown === 'governorate'),
  );
  const dropdownData = buildQuickFilterDropdownData({
    activeDropdown,
    filters,
    vertical,
    brands,
    governorates,
  });

  return (
    <QuickFilterModal
      visible={visible && !!dropdownData}
      title={dropdownData?.title ?? ''}
      options={dropdownData?.options ?? []}
      selectedId={dropdownData?.selectedId}
      onSelect={(optionId) => {
        if (!activeDropdown) return;
        setFilters(
          applyQuickFilterDropdownSelection({
            activeDropdown,
            optionId,
            filters,
            vertical,
            brands,
            governorates,
          }),
        );
      }}
      onClose={onClose}
    />
  );
}

describe('QuickFilterModal - Ported Cars, Buses & Services Dropdown Characterization (D-388)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFilterLocationsCache();
    (locationsApi.getGovernorates as jest.Mock).mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
    ]);
  });

  it('renders null when visible is false', async () => {
    const { toJSON } = await render(
      <QuickFilterModalHarness
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
      <QuickFilterModalHarness
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
      <QuickFilterModalHarness
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

  it('fetches and selects governorate via useFilterLocations, setting numeric ID and clearing wilayaId', async () => {
    const setFilters = jest.fn();
    const onClose = jest.fn();

    const { getByText } = await render(
      <QuickFilterModalHarness
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
      <QuickFilterModalHarness
        visible={true}
        activeDropdown="capacity"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        vertical="buses"
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
      <QuickFilterModalHarness
        visible={true}
        activeDropdown="serviceType"
        onClose={onClose}
        filters={{}}
        setFilters={setFilters}
        vertical="services"
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
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="make"
          onClose={onClose}
          filters={currentFilters}
          setFilters={setFilters}
          brands={brands}
          vertical="cars"
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
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="make"
          onClose={onClose}
          filters={currentFilters}
          setFilters={setFilters}
          brands={brands}
          vertical="cars"
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
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="type"
          onClose={onClose}
          filters={{ bodyType: 'sedan' }}
          setFilters={setFilters}
          vertical="cars"
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
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="specialization"
          onClose={onClose}
          filters={{}}
          setFilters={setFilters}
          vertical="services"
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
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="make"
          onClose={jest.fn()}
          filters={currentFilters}
          setFilters={jest.fn()}
          brands={brands}
          vertical="buses"
        />
      );

      await waitFor(() => {
        expect(getByText('سكانيا')).toBeTruthy();
      });

      const jsonStr = JSON.stringify(toJSON());
      expect(jsonStr).toContain('"name":"checkmark"');
    });
  });

  describe('Price & Sort dropdowns', () => {
    it('renders price ranges with Western thousands separators and sets priceMin/priceMax', async () => {
      const setFilters = jest.fn();
      const onClose = jest.fn();

      const { getByText, getAllByText } = await render(
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="price"
          onClose={onClose}
          filters={{}}
          setFilters={setFilters}
          vertical="cars"
        />
      );

      await waitFor(() => {
        expect(getByText('نطاق السعر')).toBeTruthy();
      });

      const option = getAllByText(/5,000/)[0];
      fireEvent.press(option);
      expect(setFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          priceMin: expect.any(String),
          priceMax: expect.any(String),
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('applies bus sort option directly as sort key and car sort option as sortBy/sortOrder', async () => {
      const busSetFilters = jest.fn();
      const { getByText: getBusText } = await render(
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="sort"
          onClose={jest.fn()}
          filters={{}}
          setFilters={busSetFilters}
          vertical="buses"
        />
      );

      fireEvent.press(getBusText('السعر: الأقل للأعلى'));
      expect(busSetFilters).toHaveBeenCalledWith({ sort: 'price_asc' });

      const carSetFilters = jest.fn();
      const { getByText: getCarText } = await render(
        <QuickFilterModalHarness
          visible={true}
          activeDropdown="sort"
          onClose={jest.fn()}
          filters={{}}
          setFilters={carSetFilters}
          vertical="cars"
        />
      );

      fireEvent.press(getCarText('الأحدث أولاً'));
      expect(carSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: expect.any(String), sortOrder: expect.any(String) })
      );
    });
  });
});
