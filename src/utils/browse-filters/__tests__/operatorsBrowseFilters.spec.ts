import {
  buildOperatorQueryParams,
  refineOperatorsClientSide,
  clearOperatorFilter,
  mergeOperatorRouteParams,
} from '../operatorsBrowseFilters';
import { OperatorFilterState } from '../../../types/filters.types';
import {
  OPERATORS_QUERY_ALLOW_LIST,
  OPERATORS_CLIENT_ONLY_KEYS,
} from '../../../types/contracts/operatorsQuery';

describe('Operators Browse Pure Filters & Contract (D-185)', () => {
  describe('buildOperatorQueryParams', () => {
    it('returns empty params when search and filters are empty', () => {
      const params = buildOperatorQueryParams('', {});
      expect(params).toEqual({});
    });

    it('trims and includes search query', () => {
      const params = buildOperatorQueryParams('   سائق رافعة   ', {});
      expect(params.search).toBe('سائق رافعة');
    });

    it('maps dailyRateMin/Max and minExperience/maxExperience to backend keys', () => {
      const filters: OperatorFilterState = {
        dailyRateMin: 25,
        dailyRateMax: 120,
        minExperience: 3,
        maxExperience: 8,
      };
      const params = buildOperatorQueryParams('', filters);
      expect(params.minDailyRate).toBe(25);
      expect(params.maxDailyRate).toBe(120);
      expect(params.minExperienceYears).toBe(3);
      expect(params.maxExperienceYears).toBe(8);
    });

    it('omits operatorType when set to "all"', () => {
      const params = buildOperatorQueryParams('', { operatorType: 'all' });
      expect(params.operatorType).toBeUndefined();
    });

    it('maps sort values to sortBy and sortOrder', () => {
      const asc = buildOperatorQueryParams('', { sortBy: 'dailyRate_asc' });
      expect(asc).toEqual({ sortBy: 'dailyRate', sortOrder: 'asc' });

      const desc = buildOperatorQueryParams('', { sortBy: 'dailyRate_desc' });
      expect(desc).toEqual({ sortBy: 'dailyRate', sortOrder: 'desc' });

      const newest = buildOperatorQueryParams('', { sortBy: 'newest' });
      expect(newest).toEqual({ sortBy: 'createdAt', sortOrder: 'desc' });
    });

    // ─── CLIENT-ONLY REFINEMENTS CONTRACT RULE ──────────────────────────
    it('omits client-only keys from backend query params', () => {
      const filters: OperatorFilterState = {
        dailyRateMin: 30,
        equipmentType: 'EXCAVATOR',
        certification: 'HEAVY_LICENSE',
        isPriceNegotiable: true,
      };
      const params = buildOperatorQueryParams('', filters);

      expect(params.minDailyRate).toBe(30);
      OPERATORS_CLIENT_ONLY_KEYS.forEach((key) => {
        expect(key in params).toBe(false);
      });
    });
  });

  describe('refineOperatorsClientSide', () => {
    const mockOperators = [
      {
        id: '1',
        title: 'مشغل حفار',
        equipmentTypes: ['EXCAVATOR', 'LOADER'],
        certifications: ['HEAVY_LICENSE'],
        isPriceNegotiable: true,
      },
      {
        id: '2',
        title: 'سائق شاحنة',
        equipmentTypes: ['TRUCK'],
        certifications: ['LIGHT_LICENSE'],
        isPriceNegotiable: false,
      },
    ];

    it('returns all items when client-only filters are empty', () => {
      const result = refineOperatorsClientSide(mockOperators, {});
      expect(result.length).toBe(2);
    });

    it('filters by equipmentType in-memory', () => {
      const result = refineOperatorsClientSide(mockOperators, { equipmentType: 'EXCAVATOR' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('filters by certification in-memory', () => {
      const result = refineOperatorsClientSide(mockOperators, { certification: 'LIGHT_LICENSE' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('filters by isPriceNegotiable in-memory', () => {
      const result = refineOperatorsClientSide(mockOperators, { isPriceNegotiable: true });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('clearOperatorFilter', () => {
    it('clears rate, experience, and client-only filters properly', () => {
      const state: OperatorFilterState = {
        dailyRateMin: 20,
        dailyRateMax: 80,
        minExperience: 2,
        equipmentType: 'BULLDOZER',
        isPriceNegotiable: true,
      };

      const clearedRate = clearOperatorFilter(state, 'rate');
      expect(clearedRate.dailyRateMin).toBeUndefined();
      expect(clearedRate.dailyRateMax).toBeUndefined();
      expect(clearedRate.minExperience).toBe(2);

      const clearedEquip = clearOperatorFilter(clearedRate, 'equipmentType');
      expect(clearedEquip.equipmentType).toBeUndefined();

      const clearedNeg = clearOperatorFilter(clearedEquip, 'negotiable');
      expect(clearedNeg.isPriceNegotiable).toBeUndefined();
    });
  });

  describe('Contract Verification', () => {
    it('emits ONLY keys defined in OPERATORS_QUERY_ALLOW_LIST', () => {
      const filters: OperatorFilterState = {
        operatorType: 'OPERATOR',
        governorateId: 1,
        wilayaId: 101,
        dailyRateMin: 25,
        dailyRateMax: 90,
        minExperience: 2,
        maxExperience: 10,
        sortBy: 'experienceYears',
        equipmentType: 'CRANE',
        certification: 'CERT_A',
        isPriceNegotiable: true,
      };

      const params = buildOperatorQueryParams('operator', filters);
      const allowSet = new Set<string>(OPERATORS_QUERY_ALLOW_LIST);

      Object.keys(params).forEach((key) => {
        expect(allowSet.has(key)).toBe(true);
      });
    });
  });

  describe('Route Param Merging (G-07)', () => {
    it('merges operator route params without resetting existing filters', () => {
      const existing: OperatorFilterState = {
        dailyRateMin: 30,
        dailyRateMax: 100,
      };
      const merged = mergeOperatorRouteParams(existing, {
        operatorType: 'TECHNICIAN',
        governorateId: '1',
      });
      expect(merged.dailyRateMin).toBe(30);
      expect(merged.dailyRateMax).toBe(100);
      expect(merged.operatorType).toBe('TECHNICIAN');
      expect(merged.governorateId).toBe(1);
    });

    it('safely handles repeated parameters (string[]) from Expo Router', () => {
      const merged = mergeOperatorRouteParams({}, {
        operatorType: ['DRIVER', 'TECHNICIAN'] as unknown as string,
        governorateId: ['2', '3'] as unknown as string,
        wilayaId: ['103', '104'] as unknown as string,
      });
      expect(merged.operatorType).toBe('DRIVER');
      expect(merged.governorateId).toBe(2);
      expect(merged.wilayaId).toBe(103);
    });
  });
});
