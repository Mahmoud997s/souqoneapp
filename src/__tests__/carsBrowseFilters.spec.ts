import {
  decodeSearchParam,
  parseCarsFiltersFromParams,
  mergeCarsRouteParams,
  clearCarsMake,
  clearCarsQuickFilter,
  applyCarsQuickFilter,
  buildCarsQueryParams,
  countCarsActiveFilters,
} from '../utils/browse-filters/carsBrowseFilters';
import { CARS_QUERY_ALLOWED_KEYS } from '../types/contracts/carsQuery';

describe('Cars Browse Filter Logic & Contract', () => {
  it('defaults to empty filters when no query params are present', () => {
    const filters = parseCarsFiltersFromParams({});
    expect(filters).toEqual({});
    expect(Object.keys(filters).length).toBe(0);
    expect(filters.listingType).toBeUndefined();
    expect(filters.condition).toBeUndefined();
  });

  it('maps "used" type strictly to condition=USED without forcing listingType=SALE', () => {
    const filters = parseCarsFiltersFromParams({ type: 'used' });
    expect(filters).toEqual({ condition: 'USED' });
    expect(filters.listingType).toBeUndefined();
  });

  it('maps "new" type strictly to condition=NEW without forcing listingType=SALE', () => {
    const filters = parseCarsFiltersFromParams({ type: 'new' });
    expect(filters).toEqual({ condition: 'NEW' });
    expect(filters.listingType).toBeUndefined();
  });

  it('maps "sale" type strictly to listingType=SALE', () => {
    const filters = parseCarsFiltersFromParams({ type: 'sale' });
    expect(filters).toEqual({ listingType: 'SALE' });
    expect(filters.condition).toBeUndefined();
  });

  it('maps "rental" or "rent" type to listingType=RENTAL', () => {
    expect(parseCarsFiltersFromParams({ type: 'rental' })).toEqual({ listingType: 'RENTAL' });
    expect(parseCarsFiltersFromParams({ type: 'rent' })).toEqual({ listingType: 'RENTAL' });
  });

  it('maps "wanted" type to listingType=WANTED', () => {
    const filters = parseCarsFiltersFromParams({ type: 'wanted' });
    expect(filters).toEqual({ listingType: 'WANTED' });
  });

  it('merges incoming route params without blowing away existing filter state (G-07)', () => {
    const existing = {
      priceMin: '5000',
      priceMax: '12000',
      governorateId: 1,
    };
    const incoming = { make: 'Toyota', brandId: 'toyota-123' };
    const merged = mergeCarsRouteParams(existing, incoming);
    expect(merged.priceMin).toBe('5000');
    expect(merged.priceMax).toBe('12000');
    expect(merged.governorateId).toBe(1);
    expect(merged.make).toBe('Toyota');
    expect(merged.makeId).toBe('toyota-123');
  });

  describe('F-03: clearCarsMake and cascading model/trim removal', () => {
    it('clears make, makeId, model, modelId, and trim in one clearMake operation', () => {
      const state = {
        make: 'Toyota',
        makeId: 'toyota-id',
        model: 'Land Cruiser',
        modelId: 'lc-id',
        trim: 'VXR',
        priceMax: '30000',
      };
      const cleared = clearCarsMake(state);
      expect(cleared.make).toBeUndefined();
      expect(cleared.makeId).toBeUndefined();
      expect(cleared.model).toBeUndefined();
      expect(cleared.modelId).toBeUndefined();
      expect(cleared.trim).toBeUndefined();
      expect(cleared.priceMax).toBe('30000');
    });

    it('clearCarsQuickFilter("make") delegates to clearCarsMake and clears model and trim', () => {
      const state = {
        make: 'Nissan',
        makeId: 'nissan-id',
        model: 'Patrol',
        modelId: 'patrol-id',
        trim: 'Platinum',
      };
      const cleared = clearCarsQuickFilter(state, 'make');
      expect(cleared.make).toBeUndefined();
      expect(cleared.makeId).toBeUndefined();
      expect(cleared.model).toBeUndefined();
      expect(cleared.modelId).toBeUndefined();
      expect(cleared.trim).toBeUndefined();
    });

    it('buildCarsQueryParams after clearing make leaves no model or trim in emitted params', () => {
      const state = {
        make: 'Toyota',
        makeId: 'toyota-id',
        model: 'Camry',
        modelId: 'camry-id',
        trim: 'GLX',
      };
      const cleared = clearCarsQuickFilter(state, 'make');
      const query = buildCarsQueryParams(cleared, '');
      expect(query.make).toBeUndefined();
      expect(query.model).toBeUndefined();
      expect(query.trim).toBeUndefined();
    });
  });

  describe('countCarsActiveFilters', () => {
    it('calculates activeFiltersCount correctly without double counting make', () => {
      const filters = { makeId: 'toyota', make: 'Toyota' };
      const selectedBrandId = 'toyota';
      expect(countCarsActiveFilters(filters, selectedBrandId)).toBe(1);
    });
  });

  describe('decodeSearchParam', () => {
    it('returns empty string when search param is absent or undefined', () => {
      expect(decodeSearchParam(undefined)).toBe('');
      expect(decodeSearchParam('')).toBe('');
      expect(decodeSearchParam('   ')).toBe('');
    });

    it('returns trimmed search query when plain text is provided', () => {
      expect(decodeSearchParam('كامري')).toBe('كامري');
      expect(decodeSearchParam('  تويوتا لاندكروزر  ')).toBe('تويوتا لاندكروزر');
    });

    it('decodes URL-encoded Arabic characters correctly', () => {
      expect(decodeSearchParam('%D8%AA%D9%88%D9%8A%D9%88%D8%AA%D8%A7')).toBe('تويوتا');
      expect(decodeSearchParam('%D9%86%D9%8A%D8%B3%D8%A7%D9%86%20%D8%A8%D8%A7%D8%AA%D8%B1%D9%88%D9%84')).toBe('نيسان باترول');
    });
  });

  describe('CarsQuery Contract Allow-list', () => {
    it('emits ONLY keys present in the CarsQuery allow-list', () => {
      const complexFilters = {
        make: 'Toyota',
        makeId: 'toyota-id', // Internal: should NOT be emitted
        model: 'Camry',
        modelId: 'camry-id', // Internal: should NOT be emitted
        priceId: 'p-1', // Internal: should NOT be emitted
        priceMin: '5000',
        priceMax: '15000',
        yearMin: 2020,
        yearMax: 2024,
        bodyType: 'SEDAN',
        governorateId: 1,
        wilayaId: 10,
        governorate: 'مسقط', // Internal: should NOT be emitted
        city: 'السيب', // Internal: should NOT be emitted
        sortBy: 'price',
        sortOrder: 'asc',
      };

      const query = buildCarsQueryParams(complexFilters, 'لكزس', undefined, 20);
      const emittedKeys = Object.keys(query);

      const allowedSet = new Set<string>(CARS_QUERY_ALLOWED_KEYS);
      emittedKeys.forEach((key) => {
        expect(allowedSet.has(key)).toBe(true);
      });

      expect(query.search).toBe('لكزس');
      expect(query.limit).toBe(20);
      expect((query as any).makeId).toBeUndefined();
      expect((query as any).modelId).toBeUndefined();
      expect((query as any).priceId).toBeUndefined();
      expect((query as any).city).toBeUndefined();
      expect((query as any).governorate).toBeUndefined();
    });
  });
});
