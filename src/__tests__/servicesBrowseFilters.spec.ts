import {
  parseServicesFiltersFromParams,
  mergeServicesRouteParams,
  clearServicesQuickFilter,
  buildServicesQueryParams,
  countServicesActiveFilters,
  ServicesFilterState,
} from '../utils/browse-filters/servicesBrowseFilters';
import { SERVICES_QUERY_ALLOWED_KEYS } from '../types/contracts/servicesQuery';

describe('Services Browse Filter Logic & Contract', () => {
  it('defaults to 0 filters when no query params are provided', () => {
    const filters = parseServicesFiltersFromParams({});
    expect(filters).toEqual({});
    expect(Object.keys(filters).length).toBe(0);
  });

  it('correctly maps specific serviceType without adding unintended filters', () => {
    const filters = parseServicesFiltersFromParams({ serviceType: 'MAINTENANCE' });
    expect(filters).toEqual({ serviceType: 'MAINTENANCE' });
    expect(filters.providerType).toBeUndefined();
    expect(filters.isHomeService).toBeUndefined();
  });

  it('normalizes legacy CENTER providerType to WORKSHOP and maps location IDs', () => {
    const filters = parseServicesFiltersFromParams({
      providerType: 'CENTER',
      governorateId: '1',
      wilayaId: '5',
    });
    expect(filters).toEqual({
      providerType: 'WORKSHOP',
      governorateId: 1,
      wilayaId: 5,
    });
  });

  it('correctly handles boolean isHomeService parameter', () => {
    const filters = parseServicesFiltersFromParams({ isHomeService: 'true' });
    expect(filters.isHomeService).toBe(true);
  });

  it('merges incoming route params without blowing away existing filter state (G-07)', () => {
    const existing = {
      serviceType: 'CLEANING',
      governorateId: 1,
    };
    const incoming = { providerType: 'WORKSHOP', isHomeService: 'true' };
    const merged = mergeServicesRouteParams(existing, incoming);
    expect(merged.serviceType).toBe('CLEANING');
    expect(merged.governorateId).toBe(1);
    expect(merged.providerType).toBe('WORKSHOP');
    expect(merged.isHomeService).toBe(true);
  });

  it('guards against array route params from Expo Router (takes first string and parses location id)', () => {
    const filters = parseServicesFiltersFromParams({
      serviceType: ['MAINTENANCE', 'CLEANING'],
      providerType: ['CENTER', 'INDIVIDUAL'],
      governorate: ['مسقط', 'ظفار'],
      governorateId: ['1', '2'],
      wilayaId: ['10', '20'],
      isHomeService: ['true', 'false'],
    });
    expect(filters.serviceType).toBe('MAINTENANCE');
    expect(filters.providerType).toBe('WORKSHOP');
    expect(filters.governorate).toBe('مسقط');
    expect(filters.governorateId).toBe(1);
    expect(filters.wilayaId).toBe(10);
    expect(filters.isHomeService).toBe(true);
  });

  it('clears individual filters without affecting others', () => {
    let state: ServicesFilterState = {
      serviceType: 'CLEANING',
      providerType: 'WORKSHOP',
      city: 'مسقط',
      governorateId: 1,
      wilayaId: 101,
      isOpenNow: true,
      specializations: ['نانو سيراميك'],
    };

    state = clearServicesQuickFilter(state, 'serviceType');
    expect(state.serviceType).toBeUndefined();
    expect(state.providerType).toBe('WORKSHOP');
    expect(state.city).toBe('مسقط');

    state = clearServicesQuickFilter(state, 'city');
    expect(state.city).toBeUndefined();
    expect(state.governorateId).toBeUndefined();
    expect(state.wilayaId).toBeUndefined();
    expect(state.isOpenNow).toBe(true);

    state = clearServicesQuickFilter(state, 'specialization');
    expect(state.specializations).toBeUndefined();
    expect(state.providerType).toBe('WORKSHOP');
  });

  describe('F-02: Services Sort Removal & Backend DTO Parity', () => {
    it('buildServicesQueryParams NEVER emits sortBy or sortOrder', () => {
      const stateWithSort = {
        serviceType: 'MAINTENANCE',
        sortBy: 'rating',
        sortOrder: 'desc',
      };
      const query = buildServicesQueryParams(stateWithSort, '');
      expect('sortBy' in query).toBe(false);
      expect('sortOrder' in query).toBe(false);
    });

    it('emits ONLY keys present in the ServicesQuery allow-list', () => {
      const complexState = {
        serviceType: 'CLEANING',
        providerType: 'WORKSHOP',
        governorateId: 1,
        wilayaId: 5,
        isHomeService: true,
        isOpenNow: true,
        specializations: ['تلميع ساطع'],
        latitude: 23.588,
        longitude: 58.3829,
        radiusKm: 15,
        city: 'الخوير', // Internal UI key: should NOT be emitted
        governorate: 'مسقط', // Internal UI key: should NOT be emitted
        sortBy: 'views', // Should NOT be emitted
      };

      const query = buildServicesQueryParams(complexState, 'غسيل', 10);
      const emittedKeys = Object.keys(query);

      const allowedSet = new Set<string>(SERVICES_QUERY_ALLOWED_KEYS);
      emittedKeys.forEach((key) => {
        expect(allowedSet.has(key)).toBe(true);
      });

      expect(query.search).toBe('غسيل');
      expect(query.limit).toBe(10);
      expect('city' in query).toBe(false);
      expect('governorate' in query).toBe(false);
      expect('sortBy' in query).toBe(false);
      expect('sortOrder' in query).toBe(false);
    });
  });
});
