import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { locationsApi } from '../api/locations';
import { useFilterLocations } from '../hooks/useFilterLocations';
import { BrowseEmptyState } from '../components/ui/BrowseEmptyState';
import {
  buildQuickFilterDropdownData,
  applyQuickFilterDropdownSelection,
} from '../utils/browse-filters/quickFilterDropdown';
import { QuickFilterModal } from '../components/filters/QuickFilterModal';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Feather: 'Feather',
}));

jest.mock('../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn(),
    getWilayas: jest.fn(),
  },
}));

const ROOT = path.resolve(__dirname, '../..');

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function LocationProbe({ govId, label }: { govId?: number; label: string }) {
  const { governorates, wilayas } = useFilterLocations(govId, true);
  return (
    <View testID={`probe-${label}`}>
      <Text testID={`govs-${label}`}>{governorates.map((g) => g.nameAr).join(',')}</Text>
      <Text testID={`wilayas-${label}`}>{wilayas.map((w) => w.nameAr).join(',')}</Text>
    </View>
  );
}

describe('D-388 Filters, Locations Cache & Shared Browse Empty/Error States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (locationsApi.getGovernorates as jest.Mock).mockResolvedValue([
      { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
      { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
    ]);
    (locationsApi.getWilayas as jest.Mock).mockResolvedValue([
      { id: 10, nameAr: 'السيب', nameEn: 'Seeb' },
    ]);
  });

  describe('1. QuickFilterModal unification & LegacyQuickFilterModal removal', () => {
    it('deletes src/components/filters/LegacyQuickFilterModal.tsx and removes all references from Cars, Buses, Services', () => {
      expect(
        fs.existsSync(path.join(ROOT, 'src/components/filters/LegacyQuickFilterModal.tsx')),
      ).toBe(false);

      for (const screen of [
        'app/cars/browse.tsx',
        'app/buses/browse.tsx',
        'app/services/browse.tsx',
      ]) {
        const src = readRepoFile(screen);
        expect(src).not.toContain('LegacyQuickFilterModal');
        expect(src).toContain("from '../../src/components/filters/QuickFilterModal'");
      }
    });

    it('opens the unified QuickFilterModal for Cars, Buses, and Services and applies whitelisted filter params', async () => {
      const govs = [{ id: 1, nameAr: 'مسقط', nameEn: 'Muscat' }];

      // Cars: make change clears dependent model/trim
      const carDropdown = buildQuickFilterDropdownData({
        activeDropdown: 'make',
        filters: { makeId: 'toyota', modelId: 'camry', trim: 'LE' },
        vertical: 'cars',
        brands: [
          { id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' },
          { id: 'nissan', name: 'Nissan', nameAr: 'نيسان' },
        ],
      });
      expect(carDropdown?.title).toBe('اختر الماركة');

      const onSelectCar = jest.fn();
      const { getByText, unmount } = await render(
        <QuickFilterModal
          visible={true}
          title={carDropdown!.title}
          options={carDropdown!.options}
          selectedId={carDropdown!.selectedId}
          onSelect={(id) =>
            onSelectCar(
              applyQuickFilterDropdownSelection({
                activeDropdown: 'make',
                optionId: id,
                filters: { makeId: 'toyota', modelId: 'camry', trim: 'LE' },
                vertical: 'cars',
                brands: [
                  { id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' },
                  { id: 'nissan', name: 'Nissan', nameAr: 'نيسان' },
                ],
              }),
            )
          }
          onClose={jest.fn()}
        />,
      );
      await fireEvent.press(getByText('نيسان'));
      await unmount();
      expect(onSelectCar).toHaveBeenCalledWith(
        expect.objectContaining({ makeId: 'nissan', make: 'Nissan' }),
      );
      expect(onSelectCar.mock.calls[0][0].modelId).toBeUndefined();

      // Buses: capacity sets numeric fields
      const busNext = applyQuickFilterDropdownSelection({
        activeDropdown: 'capacity',
        optionId: '30',
        filters: {},
        vertical: 'buses',
      });
      expect(busNext).toEqual({ capacity: 30, minCapacity: 30, capacityMin: 30 });

      // Services: city sets numeric governorateId and clears wilayaId
      const serviceNext = applyQuickFilterDropdownSelection({
        activeDropdown: 'city',
        optionId: '1',
        filters: { wilayaId: 99 },
        vertical: 'services',
        governorates: govs,
      });
      expect(serviceNext).toEqual({
        governorateId: 1,
        governorate: 'مسقط',
        city: 'مسقط',
        wilayaId: undefined,
      });
    });
  });

  describe('2. Shared cached useFilterLocations hook & zero any in filter sheets', () => {
    it('fetches governorates and wilayas once across multiple mounted sheets via cache', async () => {
      const { getByTestId } = await render(
        <View>
          <LocationProbe govId={1} label="sheet1" />
          <LocationProbe govId={1} label="sheet2" />
        </View>,
      );

      await waitFor(() => {
        expect(getByTestId('govs-sheet1').props.children).toBe('مسقط,ظفار');
        expect(getByTestId('govs-sheet2').props.children).toBe('مسقط,ظفار');
        expect(getByTestId('wilayas-sheet1').props.children).toBe('السيب');
        expect(getByTestId('wilayas-sheet2').props.children).toBe('السيب');
      });

      expect(locationsApi.getGovernorates).toHaveBeenCalledTimes(1);
      expect(locationsApi.getWilayas).toHaveBeenCalledTimes(1);
      expect(locationsApi.getWilayas).toHaveBeenCalledWith(1);
    });

    it('uses useFilterLocations in all 6 filter sheets with zero direct locationsApi calls and zero any types', () => {
      const filterSheets = [
        'src/components/filters/FilterBottomSheet.tsx',
        'src/components/filters/BusFilterBottomSheet.tsx',
        'src/components/filters/EquipmentFilterBottomSheet.tsx',
        'src/components/filters/OperatorsFilterBottomSheet.tsx',
        'src/components/parts/PartsFilterBottomSheet.tsx',
        'src/components/services/ServicesFilterBottomSheet.tsx',
      ];

      for (const sheet of filterSheets) {
        const src = readRepoFile(sheet);
        expect(src).toContain('useFilterLocations');
        expect(src).not.toContain('locationsApi');
        expect(src).not.toMatch(/:\s*any\b|\bas\s+any\b/);
      }

      for (const browseScreen of [
        'app/cars/browse.tsx',
        'app/buses/browse.tsx',
        'app/equipment/browse.tsx',
        'app/parts/browse.tsx',
        'app/services/browse.tsx',
      ]) {
        const src = readRepoFile(browseScreen);
        expect(src).toContain('useFilterLocations');
        expect(src).not.toContain('locationsApi');
      }

      expect(readRepoFile('src/hooks/useFilterLocations.ts')).not.toContain(
        'clearFilterLocationsCache',
      );
    });
  });

  describe('3. ONE shared BrowseEmptyState across all 5 browse screens', () => {
    it('deletes duplicate src/components/cars/BrowseEmptyState.tsx and wires all 5 browse screens to ui/BrowseEmptyState', () => {
      expect(
        fs.existsSync(path.join(ROOT, 'src/components/cars/BrowseEmptyState.tsx')),
      ).toBe(false);

      for (const screen of [
        'app/cars/browse.tsx',
        'app/buses/browse.tsx',
        'app/equipment/browse.tsx',
        'app/parts/browse.tsx',
        'app/services/browse.tsx',
      ]) {
        const src = readRepoFile(screen);
        expect(src).toContain("from '../../src/components/ui/BrowseEmptyState'");
        expect(src).not.toContain("from '../../src/components/cars/BrowseEmptyState'");
      }
    });

    it('shows primary "إعادة تعيين الفلاتر" AND secondary "مسح البحث" together when both filters and search are active', async () => {
      const onResetFilters = jest.fn();
      const onResetSearch = jest.fn();
      const onRetry = jest.fn();

      const { getByText } = await render(
        <BrowseEmptyState
          isLoading={false}
          isError={false}
          activeFiltersCount={2}
          hasActiveSearch={true}
          onRetry={onRetry}
          onResetFilters={onResetFilters}
          onResetSearch={onResetSearch}
          emptyTitle="لا توجد سيارات مطابقة"
        />,
      );

      const resetFiltersBtn = getByText('إعادة تعيين الفلاتر');
      const resetSearchBtn = getByText('مسح البحث');
      expect(resetFiltersBtn).toBeTruthy();
      expect(resetSearchBtn).toBeTruthy();

      await fireEvent.press(resetFiltersBtn);
      expect(onResetFilters).toHaveBeenCalledTimes(1);

      await fireEvent.press(resetSearchBtn);
      expect(onResetSearch).toHaveBeenCalledTimes(1);
    });

    it('renders unified error state with retry button via getListErrorProps', async () => {
      const onRetry = jest.fn();
      const { getByTestId, getByText } = await render(
        <BrowseEmptyState
          isLoading={false}
          isError={true}
          error={{ isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' }}
          errorTitle="تعذر تحميل إعلانات السيارات"
          errorTestID="browse-error-state"
          onRetry={onRetry}
        />,
      );

      expect(getByTestId('browse-error-state')).toBeTruthy();
      await fireEvent.press(getByText('إعادة المحاولة'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
