import {
  buildPartsQueryParams,
  clearPartsFilter,
  parsePartsInitialFilters,
  mergePartsRouteParams,
  PartsFilterState,
} from '../partsBrowseFilters';
import { PARTS_QUERY_ALLOW_LIST } from '../../../types/contracts/partsQuery';

describe('Parts Browse Pure Filters & Contract (D-185)', () => {
  describe('buildPartsQueryParams', () => {
    it('returns default limit when filters are empty', () => {
      const params = buildPartsQueryParams({});
      expect(params).toEqual({ limit: 30 });
    });

    it('trims search query and ignores empty whitespace', () => {
      const params = buildPartsQueryParams({}, '   مساعدات كامري   ');
      expect(params.search).toBe('مساعدات كامري');

      const empty = buildPartsQueryParams({}, '   ');
      expect(empty.search).toBeUndefined();
    });

    it('maps category to partCategory and preserves make and condition', () => {
      const filters: PartsFilterState = {
        category: 'BRAKES',
        make: 'Toyota',
        condition: 'NEW',
      };
      const params = buildPartsQueryParams(filters);
      expect(params.partCategory).toBe('BRAKES');
      expect(params.make).toBe('Toyota');
      expect(params.condition).toBe('NEW');
    });

    it('maps boolean filters isOriginal and isScrap', () => {
      const filters: PartsFilterState = {
        isOriginal: true,
        isScrap: true,
      };
      const params = buildPartsQueryParams(filters);
      expect(params.isOriginal).toBe(true);
      expect(params.isScrap).toBe(true);
    });

    it('converts valid price bounds to numeric strings', () => {
      const filters: PartsFilterState = {
        priceMin: '15.5',
        priceMax: '120',
      };
      const params = buildPartsQueryParams(filters);
      expect(params.minPrice).toBe('15.5');
      expect(params.maxPrice).toBe('120');
    });

    it('maps sortBy and defaults sortOrder to DESC', () => {
      const filters: PartsFilterState = {
        sortBy: 'price',
      };
      const params = buildPartsQueryParams(filters);
      expect(params.sortBy).toBe('price');
      expect(params.sortOrder).toBe('DESC');
    });

    // ─── TEETH TEST FOR F-01 ──────────────────────────────────────────────
    it('TEETH (F-01): accepts numeric governorateId and wilayaId but rejects legacy string codes', () => {
      // 1. Numeric ID from locationsApi.getGovernorates() must be sent
      const validLocation: PartsFilterState = {
        governorateId: 1,
        wilayaId: 101,
      };
      const validParams = buildPartsQueryParams(validLocation);
      expect(validParams.governorateId).toBe('1');
      expect(validParams.wilayaId).toBe('101');

      // 2. Legacy string code 'OM_MUS' from GOVERNORATE_OPTIONS must NEVER be emitted
      // because backend QueryPartsDto enforces @IsNumberString() which throws 400
      const invalidLegacy: PartsFilterState = {
        governorateId: 'OM_MUS' as any,
        city: 'مسقط',
      };
      const invalidParams = buildPartsQueryParams(invalidLegacy);
      expect(invalidParams.governorateId).toBeUndefined();
      expect((invalidParams as any).city).toBeUndefined();
    });
  });

  describe('clearPartsFilter', () => {
    it('TEETH (F-01): clearing city or governorate removes all location keys together', () => {
      const state: PartsFilterState = {
        city: 'مسقط',
        governorate: 'مسقط',
        governorateId: 1,
        wilayaId: 101,
        category: 'ENGINE',
      };

      const cleared = clearPartsFilter(state, 'city');
      expect(cleared.city).toBeUndefined();
      expect(cleared.governorate).toBeUndefined();
      expect(cleared.governorateId).toBeUndefined();
      expect(cleared.wilayaId).toBeUndefined();
      expect(cleared.category).toBe('ENGINE');
    });

    it('clears make and makeId on make clear', () => {
      const state: PartsFilterState = {
        make: 'Nissan',
        makeId: 'nissan-id',
        category: 'BODY',
      };
      const cleared = clearPartsFilter(state, 'make');
      expect(cleared.make).toBeUndefined();
      expect(cleared.makeId).toBeUndefined();
      expect(cleared.category).toBe('BODY');
    });

    it('clears price range and priceId on price clear', () => {
      const state: PartsFilterState = {
        priceMin: '10',
        priceMax: '50',
        priceId: 'p-1',
      };
      const cleared = clearPartsFilter(state, 'price');
      expect(cleared.priceMin).toBeUndefined();
      expect(cleared.priceMax).toBeUndefined();
      expect(cleared.priceId).toBeUndefined();
    });

    it('clears sort parameters on sort clear', () => {
      const state: PartsFilterState = {
        sortBy: 'price',
        sortOrder: 'ASC',
      };
      const cleared = clearPartsFilter(state, 'sort');
      expect(cleared.sortBy).toBeUndefined();
      expect(cleared.sortOrder).toBeUndefined();
    });
  });

  describe('Contract Verification', () => {
    it('emits ONLY keys defined in PARTS_QUERY_ALLOW_LIST', () => {
      const filters: PartsFilterState = {
        category: 'LIGHTS',
        make: 'Honda',
        makeId: 'honda-1',
        condition: 'USED',
        priceMin: '5',
        priceMax: '50',
        priceId: 'range-1',
        governorateId: 2,
        wilayaId: 104,
        city: 'صلالة',
        governorate: 'ظفار',
        sortBy: 'newest',
        sortOrder: 'DESC',
        isOriginal: true,
        isScrap: false,
        hasWarranty: true,
        compatibleVehicleType: 'CAR',
        partNumber: '12345-ABC',
      };

      const params = buildPartsQueryParams(filters, 'lamp');
      const allowSet = new Set<string>(PARTS_QUERY_ALLOW_LIST);

      Object.keys(params).forEach((key) => {
        expect(allowSet.has(key)).toBe(true);
      });

      // Confirm UI-only fields are never in query params
      expect((params as any).makeId).toBeUndefined();
      expect((params as any).priceId).toBeUndefined();
      expect((params as any).city).toBeUndefined();
      expect((params as any).governorate).toBeUndefined();
    });
  });

  describe('Route Param Parsing and Merging', () => {
    it('parses initial filters from URL params with strict positive integer location IDs', () => {
      const initial = parsePartsInitialFilters({
        category: 'TRANSMISSION',
        isOriginal: 'true',
        isScrap: 'true',
        make: 'Toyota',
        priceMin: '100',
        priceMax: '500',
        governorateId: ' 3 ',
        wilayaId: '102',
      });

      expect(initial.category).toBe('TRANSMISSION');
      expect(initial.isOriginal).toBe(true);
      expect(initial.isScrap).toBe(true);
      expect(initial.make).toBe('Toyota');
      expect(initial.priceMin).toBe('100');
      expect(initial.priceMax).toBe('500');
      expect(initial.governorateId).toBe(3);
      expect(initial.wilayaId).toBe(102);
    });

    it('rejects invalid or non-positive location IDs in initial and merged filters', () => {
      const invalidInitial = parsePartsInitialFilters({
        governorateId: '0',
        wilayaId: '-5',
      });
      expect(invalidInitial.governorateId).toBeUndefined();
      expect(invalidInitial.wilayaId).toBeUndefined();

      const invalidMerged = mergePartsRouteParams({}, {
        governorateId: '1.5',
        wilayaId: '  ',
      });
      expect(invalidMerged.governorateId).toBeUndefined();
      expect(invalidMerged.wilayaId).toBeUndefined();
    });

    it('merges route params into existing filter state without wiping selections (G-07)', () => {
      const existing: PartsFilterState = {
        category: 'FILTERS',
        priceMin: '10',
        priceMax: '40',
        governorateId: 1,
      };

      const merged = mergePartsRouteParams(existing, { make: 'Toyota' });
      expect(merged.category).toBe('FILTERS');
      expect(merged.priceMin).toBe('10');
      expect(merged.priceMax).toBe('40');
      expect(merged.governorateId).toBe(1);
      expect(merged.make).toBe('Toyota');
    });
  });
});
