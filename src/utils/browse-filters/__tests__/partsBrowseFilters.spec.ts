import {
  buildPartsQueryParams,
  clearPartsFilter,
  parsePartsInitialFilters,
  mergePartsRouteParams,
  applyPartsFilter,
  normalizePartBrands,
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
      const invalidLegacy = {
        governorateId: 'OM_MUS',
        city: 'مسقط',
      } as unknown as PartsFilterState;
      const invalidParams = buildPartsQueryParams(invalidLegacy);
      expect(invalidParams.governorateId).toBeUndefined();
      expect('city' in invalidParams).toBe(false);
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
      expect('makeId' in params).toBe(false);
      expect('priceId' in params).toBe(false);
      expect('city' in params).toBe(false);
      expect('governorate' in params).toBe(false);
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

    it('rejects invalid, repeated-array, or non-positive location IDs in initial and merged filters', () => {
      const invalidInitial = parsePartsInitialFilters({
        governorateId: '0',
        wilayaId: '-5',
      });
      expect(invalidInitial.governorateId).toBeUndefined();
      expect(invalidInitial.wilayaId).toBeUndefined();

      // Repeated query params from Expo Router come as string[] (rule: takes first valid element)
      const repeatedParamInitial = parsePartsInitialFilters({
        governorateId: ['1', '2'] as unknown as string,
        wilayaId: ['101', '102'] as unknown as string,
      });
      expect(repeatedParamInitial.governorateId).toBe(1);
      expect(repeatedParamInitial.wilayaId).toBe(101);

      // toPositiveInteger evaluates the first element only
      const emptyFirstParam = parsePartsInitialFilters({
        governorateId: ['', '2'] as unknown as string,
      });
      expect(emptyFirstParam.governorateId).toBeUndefined();

      const invalidArray = parsePartsInitialFilters({
        governorateId: ['OM_MUS', '2'] as unknown as string,
        wilayaId: ['invalid', '102'] as unknown as string,
      });
      expect(invalidArray.governorateId).toBeUndefined();
      expect(invalidArray.wilayaId).toBeUndefined();

      const invalidMerged = mergePartsRouteParams({}, {
        governorateId: '1.5',
        wilayaId: '  ',
      });
      expect(invalidMerged.governorateId).toBeUndefined();
      expect(invalidMerged.wilayaId).toBeUndefined();
    });

    it('selects first non-empty string for repeated string parameters', () => {
      const initial = parsePartsInitialFilters({
        category: ['', '  ', 'TRANSMISSION', 'BRAKES'] as unknown as string,
        make: ['Toyota', 'Honda'] as unknown as string,
      });
      expect(initial.category).toBe('TRANSMISSION');
      expect(initial.make).toBe('Toyota');
    });

    it('merges route params into existing filter state without wiping selections (G-07)', () => {
      const existing: PartsFilterState = {
        category: 'FILTERS',
        priceMin: '10',
        priceMax: '40',
        governorateId: 1,
      };

      const merged = mergePartsRouteParams(existing, {
        make: 'Toyota',
        priceMin: '25',
        priceMax: '150',
        partNumber: 'OEM-991',
      });
      expect(merged.category).toBe('FILTERS');
      expect(merged.priceMin).toBe('25');
      expect(merged.priceMax).toBe('150');
      expect(merged.partNumber).toBe('OEM-991');
      expect(merged.governorateId).toBe(1);
      expect(merged.make).toBe('Toyota');
    });

    it('clears retained wilayaId when route updates governorateId without an explicit wilayaId', () => {
      const existing: PartsFilterState = {
        governorateId: 1,
        wilayaId: 101,
      };

      const changed = mergePartsRouteParams(existing, { governorateId: '2' });
      expect(changed.governorateId).toBe(2);
      expect(changed.wilayaId).toBeUndefined();

      const same = mergePartsRouteParams(existing, { governorateId: '1' });
      expect(same.governorateId).toBe(1);
      expect(same.wilayaId).toBe(101);

      const withWilaya = mergePartsRouteParams(existing, { governorateId: '2', wilayaId: '201' });
      expect(withWilaya.governorateId).toBe(2);
      expect(withWilaya.wilayaId).toBe(201);
    });
  });

  describe('applyPartsFilter', () => {
    it('applies category selection', () => {
      const res = applyPartsFilter({}, 'category', 'ENGINE');
      expect(res.category).toBe('ENGINE');
    });

    it('applies make selection with extra brandName and clears on all', () => {
      const res = applyPartsFilter({}, 'make', 'toyota', { brandName: 'تويوتا' });
      expect(res.makeId).toBe('toyota');
      expect(res.make).toBe('تويوتا');

      const cleared = applyPartsFilter(res, 'make', 'all');
      expect(cleared.makeId).toBeUndefined();
      expect(cleared.make).toBeUndefined();
    });

    it('applies condition selection', () => {
      const res = applyPartsFilter({}, 'condition', 'NEW');
      expect(res.condition).toBe('NEW');
    });

    it('applies city selection and clears wilayaId', () => {
      const initial: PartsFilterState = {
        governorateId: 1,
        wilayaId: 101,
        city: 'قديم',
        governorate: 'قديم',
      };
      const res = applyPartsFilter(initial, 'city', '2', { governorateName: 'ظفار' });
      expect(res.governorateId).toBe(2);
      expect(res.governorate).toBe('ظفار');
      expect(res.city).toBe('ظفار');
      expect(res.wilayaId).toBeUndefined();
    });

    it('applies price range selection', () => {
      const res = applyPartsFilter({}, 'price', 'p1');
      expect(res.priceId).toBe('p1');
      expect(res.priceMin).toBe('0');
      expect(res.priceMax).toBe('20');
    });

    it('applies sort selection', () => {
      const res = applyPartsFilter({}, 'sort', 'price_asc');
      expect(res.sortBy).toBe('price');
      expect(res.sortOrder).toBe('ASC');
    });
  });

  describe('normalizePartBrands (M-018 & CodeRabbit)', () => {
    it('normalizes API brands prioritizing Arabic name then English name', () => {
      const apiBrands = [
        { id: 1, name: 'Toyota', nameAr: 'تويوتا' },
        { id: 2, name: 'Nissan', nameAr: null },
      ];
      const normalized = normalizePartBrands(apiBrands);
      expect(normalized).toEqual([
        { id: '1', label: 'تويوتا', value: 'تويوتا' },
        { id: '2', label: 'Nissan', value: 'Nissan' },
      ]);
    });

    it('normalizes POPULAR_PART_MAKES fallback displaying Arabic label instead of raw ID', () => {
      const fallbackMakes = [
        { id: 'all', label: 'متوافق مع الجميع' },
        { id: 'toyota', label: 'تويوتا' },
        { id: 'nissan', label: 'نيسان' },
      ];
      const normalized = normalizePartBrands(fallbackMakes);
      expect(normalized).toEqual([
        { id: 'all', label: 'متوافق مع الجميع', value: 'متوافق مع الجميع' },
        { id: 'toyota', label: 'تويوتا', value: 'تويوتا' },
        { id: 'nissan', label: 'نيسان', value: 'نيسان' },
      ]);
      expect(normalized[1].label).not.toBe('toyota');
      expect(normalized[1].label).toBe('تويوتا');
    });

    it('make query value matches master 8cb6f9a exact behavior (preferring nameAr, then name, then label)', () => {
      const itemWithAll = { id: 10, name: 'Honda', nameAr: 'هوندا', label: 'هوندا ليبل' };
      const res = normalizePartBrands([itemWithAll]);
      expect(res[0].value).toBe('هوندا');

      const itemWithoutAr = { id: 11, name: 'Subaru', nameAr: null, label: 'سوبارو' };
      const res2 = normalizePartBrands([itemWithoutAr]);
      expect(res2[0].value).toBe('Subaru');

      const itemWithLabelOnly = { id: 'ford', label: 'فورد' };
      const res3 = normalizePartBrands([itemWithLabelOnly]);
      expect(res3[0].value).toBe('فورد');
    });
  });
});
