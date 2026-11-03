import {
  buildBusesQueryParams,
  clearBusesFilter,
  parseBusesInitialFilters,
  mergeBusesRouteParams,
  BusBrowseFilters,
} from '../busesBrowseFilters';
import { BUSES_QUERY_ALLOW_LIST } from '../../../types/contracts/busesQuery';

describe('Buses Browse Pure Filters & Contract (D-185)', () => {
  describe('buildBusesQueryParams', () => {
    it('returns empty params when filters and search are empty', () => {
      const params = buildBusesQueryParams({});
      expect(params).toEqual({});
    });

    it('trims search query', () => {
      const params = buildBusesQueryParams({}, '   حافلة كوستر   ');
      expect(params.search).toBe('حافلة كوستر');
    });

    it('maps vertical classifications and location IDs as strings', () => {
      const filters: BusBrowseFilters = {
        busListingType: 'BUS_RENT',
        busType: 'COASTER',
        make: 'Toyota',
        governorateId: 1,
        wilayaId: 102,
      };
      const params = buildBusesQueryParams(filters);
      expect(params.busListingType).toBe('BUS_RENT');
      expect(params.busType).toBe('COASTER');
      expect(params.make).toBe('Toyota');
      expect(params.governorateId).toBe('1');
      expect(params.wilayaId).toBe('102');
    });

    it('maps pricing bounds using minPrice/maxPrice or priceMin/priceMax', () => {
      const withMinMax = buildBusesQueryParams({ minPrice: '100', maxPrice: '300' });
      expect(withMinMax.minPrice).toBe('100');
      expect(withMinMax.maxPrice).toBe('300');

      const withPriceMinMax = buildBusesQueryParams({ priceMin: '50', priceMax: '200' });
      expect(withPriceMinMax.minPrice).toBe('50');
      expect(withPriceMinMax.maxPrice).toBe('200');
    });

    it('maps capacity bounds using minCapacity/maxCapacity or capacityMin/capacityMax', () => {
      const withCap = buildBusesQueryParams({ minCapacity: 15, maxCapacity: 30 });
      expect(withCap.minCapacity).toBe('15');
      expect(withCap.maxCapacity).toBe('30');
    });

    it('omits sort if newest, sends custom sort if non-default', () => {
      const defaultSort = buildBusesQueryParams({ sort: 'newest' });
      expect(defaultSort.sort).toBeUndefined();

      const customSort = buildBusesQueryParams({ sort: 'price_asc' });
      expect(customSort.sort).toBe('price_asc');
    });

    it('maps technical specs (condition, transmission, fuelType, year)', () => {
      const filters: BusBrowseFilters = {
        condition: 'USED',
        transmission: 'MANUAL',
        fuelType: 'DIESEL',
        yearMin: '2018',
        yearMax: '2023',
        isPremium: true,
      };
      const params = buildBusesQueryParams(filters);
      expect(params.condition).toBe('USED');
      expect(params.transmission).toBe('MANUAL');
      expect(params.fuelType).toBe('DIESEL');
      expect(params.yearMin).toBe('2018');
      expect(params.yearMax).toBe('2023');
      expect(params.isPremium).toBe('true');
    });
  });

  describe('clearBusesFilter', () => {
    it('clears governorate and wilaya on location clear', () => {
      const state: BusBrowseFilters = {
        governorateId: 1,
        wilayaId: 102,
        city: 'السيب',
        make: 'Hino',
      };
      const cleared = clearBusesFilter(state, 'governorate');
      expect(cleared.governorateId).toBeUndefined();
      expect(cleared.wilayaId).toBeUndefined();
      expect(cleared.city).toBeUndefined();
      expect(cleared.make).toBe('Hino');
    });

    it('clears capacity bounds on capacity clear', () => {
      const state: BusBrowseFilters = {
        minCapacity: 10,
        maxCapacity: 25,
        capacityMin: 10,
        capacityMax: 25,
        capacityId: 'c-1',
      };
      const cleared = clearBusesFilter(state, 'capacity');
      expect(cleared.minCapacity).toBeUndefined();
      expect(cleared.maxCapacity).toBeUndefined();
      expect(cleared.capacityId).toBeUndefined();
    });

    it('resets sort to newest on sort clear', () => {
      const state: BusBrowseFilters = { sort: 'price_desc' };
      const cleared = clearBusesFilter(state, 'sort');
      expect(cleared.sort).toBe('newest');
    });
  });

  describe('Contract Verification', () => {
    it('emits ONLY keys defined in BUSES_QUERY_ALLOW_LIST', () => {
      const filters: BusBrowseFilters = {
        busListingType: 'BUS_SALE',
        busType: 'MICROBUS',
        make: 'Mercedes',
        governorateId: 3,
        wilayaId: 105,
        city: 'صحار',
        minPrice: '5000',
        maxPrice: '15000',
        minCapacity: 14,
        maxCapacity: 20,
        condition: 'LIKE_NEW',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        yearMin: '2020',
        yearMax: '2024',
        sort: 'price_asc',
        isPremium: true,
      };

      const params = buildBusesQueryParams(filters, 'sprinter');
      const allowSet = new Set<string>(BUSES_QUERY_ALLOW_LIST);

      Object.keys(params).forEach((key) => {
        expect(allowSet.has(key)).toBe(true);
      });

      expect('city' in params).toBe(false);
      expect('priceId' in params).toBe(false);
      expect('capacityId' in params).toBe(false);
    });
  });

  describe('Route Param Parsing and Merging', () => {
    it('parses type and condition from URL search params', () => {
      const parsed = parseBusesInitialFilters({
        type: 'rent',
        condition: 'USED',
        featured: 'true',
      });
      expect(parsed.busListingType).toBe('BUS_RENT');
      expect(parsed.condition).toBe('USED');
      expect(parsed.isPremium).toBe(true);
    });

    it('safely handles repeated parameters (string[]) from Expo Router', () => {
      const parsed = parseBusesInitialFilters({
        type: ['', '  ', 'rent', 'sale'] as unknown as string,
        condition: ['USED', 'NEW'] as unknown as string,
        governorateId: ['2', '3'] as unknown as string,
      });
      expect(parsed.busListingType).toBe('BUS_RENT');
      expect(parsed.condition).toBe('USED');
      expect(parsed.governorateId).toBe(2);

      const emptyFirstGov = parseBusesInitialFilters({
        governorateId: ['', '2'] as unknown as string,
      });
      expect(emptyFirstGov.governorateId).toBeUndefined();

      const merged = mergeBusesRouteParams({}, {
        busListingType: ['', 'BUS_SALE', 'BUS_RENT'] as unknown as string,
        wilayaId: ['105', '106'] as unknown as string,
      });
      expect(merged.busListingType).toBe('BUS_SALE');
      expect(merged.wilayaId).toBe(105);
    });

    it('merges route params into existing state without wiping selections (G-07)', () => {
      const existing: BusBrowseFilters = {
        make: 'Isuzu',
        governorateId: 1,
        capacityMin: 20,
      };
      const merged = mergeBusesRouteParams(existing, { condition: 'NEW' });
      expect(merged.make).toBe('Isuzu');
      expect(merged.governorateId).toBe(1);
      expect(merged.capacityMin).toBe(20);
      expect(merged.condition).toBe('NEW');
    });

    it('clears retained wilayaId when route updates governorateId without an explicit wilayaId', () => {
      const existing: BusBrowseFilters = {
        governorateId: 1,
        wilayaId: 101,
      };

      const changed = mergeBusesRouteParams(existing, { governorateId: '2' });
      expect(changed.governorateId).toBe(2);
      expect(changed.wilayaId).toBeUndefined();

      const same = mergeBusesRouteParams(existing, { governorateId: '1' });
      expect(same.governorateId).toBe(1);
      expect(same.wilayaId).toBe(101);

      const withWilaya = mergeBusesRouteParams(existing, { governorateId: '2', wilayaId: '201' });
      expect(withWilaya.governorateId).toBe(2);
      expect(withWilaya.wilayaId).toBe(201);
    });
  });
});
