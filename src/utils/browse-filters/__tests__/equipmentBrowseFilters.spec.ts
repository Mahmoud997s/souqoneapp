import {
  buildEquipmentQueryParams,
  clearEquipmentFilter,
  parseEquipmentInitialFilters,
  mergeEquipmentRouteParams,
  EquipmentFilterState,
} from '../equipmentBrowseFilters';
import { EQUIPMENT_QUERY_ALLOW_LIST } from '../../../types/contracts/equipmentQuery';

describe('Equipment Browse Pure Filters & Contract (D-185)', () => {
  describe('buildEquipmentQueryParams', () => {
    it('returns default limit when filters and search are empty', () => {
      const params = buildEquipmentQueryParams({});
      expect(params).toEqual({ limit: 30 });
    });

    it('trims search query', () => {
      const params = buildEquipmentQueryParams({}, '   حفار كوماتسو   ');
      expect(params.search).toBe('حفار كوماتسو');
    });

    it('maps numeric location IDs as numbers to match backend DTO', () => {
      const filters: EquipmentFilterState = {
        governorateId: 1,
        wilayaId: 103,
      };
      const params = buildEquipmentQueryParams(filters);
      expect(params.governorateId).toBe(1);
      expect(params.wilayaId).toBe(103);
    });

    it('converts price and year bounds to numbers', () => {
      const filters: EquipmentFilterState = {
        priceMin: '5000',
        priceMax: '25000',
        yearMin: '2015',
        yearMax: '2022',
      };
      const params = buildEquipmentQueryParams(filters);
      expect(params.minPrice).toBe(5000);
      expect(params.maxPrice).toBe(25000);
      expect(params.yearMin).toBe(2015);
      expect(params.yearMax).toBe(2022);
    });

    // ─── CONTRACT RULE: hoursUsedMax only ────────────────────────────────
    it('maps hoursMax to hoursUsedMax and NEVER emits hoursMin (DTO compliance)', () => {
      const filters: EquipmentFilterState = {
        hoursMin: '500',
        hoursMax: '3000',
        hoursId: 'h-1',
      };
      const params = buildEquipmentQueryParams(filters);
      expect(params.hoursUsedMax).toBe(3000);
      expect((params as any).hoursMin).toBeUndefined();
      expect((params as any).hoursMax).toBeUndefined();
      expect((params as any).hoursId).toBeUndefined();
    });
  });

  describe('clearEquipmentFilter', () => {
    it('clears location keys on governorate clear', () => {
      const state: EquipmentFilterState = {
        governorateId: 1,
        wilayaId: 101,
        governorate: 'مسقط',
        city: 'مسقط',
        equipmentType: 'EXCAVATOR',
      };
      const cleared = clearEquipmentFilter(state, 'governorate');
      expect(cleared.governorateId).toBeUndefined();
      expect(cleared.wilayaId).toBeUndefined();
      expect(cleared.governorate).toBeUndefined();
      expect(cleared.city).toBeUndefined();
      expect(cleared.equipmentType).toBe('EXCAVATOR');
    });

    it('clears hours bounds and hoursId on hours clear', () => {
      const state: EquipmentFilterState = {
        hoursMin: '100',
        hoursMax: '2000',
        hoursId: 'range-1',
      };
      const cleared = clearEquipmentFilter(state, 'hours');
      expect(cleared.hoursMin).toBeUndefined();
      expect(cleared.hoursMax).toBeUndefined();
      expect(cleared.hoursId).toBeUndefined();
    });

    it('clears category and categoryId on category clear', () => {
      const state: EquipmentFilterState = {
        equipmentType: 'BULLDOZER',
        categoryId: 'BULLDOZER',
      };
      const cleared = clearEquipmentFilter(state, 'category');
      expect(cleared.equipmentType).toBeUndefined();
      expect(cleared.categoryId).toBeUndefined();
    });
  });

  describe('Contract Verification', () => {
    it('emits ONLY keys defined in EQUIPMENT_QUERY_ALLOW_LIST', () => {
      const filters: EquipmentFilterState = {
        equipmentType: 'CRANE',
        categoryId: 'CRANE',
        listingType: 'EQUIPMENT_SALE',
        governorateId: 1,
        wilayaId: 101,
        governorate: 'مسقط',
        city: 'السيب',
        condition: 'USED',
        conditionId: 'USED',
        priceMin: '10000',
        priceMax: '50000',
        priceId: 'p-1',
        yearMin: '2016',
        yearMax: '2021',
        yearId: 'y-1',
        hoursMin: '500',
        hoursMax: '4000',
        hoursId: 'h-1',
        make: 'Caterpillar',
        model: 'CAT 320',
        sortBy: 'price_asc',
      };

      const params = buildEquipmentQueryParams(filters, 'crane');
      const allowSet = new Set<string>(EQUIPMENT_QUERY_ALLOW_LIST);

      Object.keys(params).forEach((key) => {
        expect(allowSet.has(key)).toBe(true);
      });

      expect((params as any).hoursMin).toBeUndefined();
      expect((params as any).priceId).toBeUndefined();
      expect((params as any).city).toBeUndefined();
    });
  });

  describe('Route Param Parsing and Merging', () => {
    it('parses initial filters from URL params', () => {
      const initial = parseEquipmentInitialFilters({
        type: 'rental',
        equipmentType: 'FORKLIFT',
      });
      expect(initial.listingType).toBe('EQUIPMENT_RENT');
      expect(initial.equipmentType).toBe('FORKLIFT');
    });

    it('merges route params into existing filter state without wiping selections (G-07)', () => {
      const existing: EquipmentFilterState = {
        equipmentType: 'GENERATOR',
        priceMin: '500',
        priceMax: '2000',
      };
      const merged = mergeEquipmentRouteParams(existing, { type: 'sale' });
      expect(merged.equipmentType).toBe('GENERATOR');
      expect(merged.priceMin).toBe('500');
      expect(merged.priceMax).toBe('2000');
      expect(merged.listingType).toBe('EQUIPMENT_SALE');
    });
  });
});
