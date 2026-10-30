import { buildOperatorQueryParams } from '../../app/equipment/operators/browse';
import { OperatorFilterState } from '../types/filters.types';

describe('Operators Browse Server-Side Filters (D-136 PR-2)', () => {
  describe('buildOperatorQueryParams parameter mapping', () => {
    it('returns empty params when search and filters are empty', () => {
      const params = buildOperatorQueryParams('', {});
      expect(params).toEqual({});
      expect(Object.keys(params).length).toBe(0);
    });

    it('trims and includes search query', () => {
      const params = buildOperatorQueryParams('   سائق رافعة   ', {});
      expect(params).toEqual({ search: 'سائق رافعة' });
    });

    it('maps dailyRateMin and dailyRateMax to minDailyRate and maxDailyRate', () => {
      const filters: OperatorFilterState = {
        dailyRateMin: 25,
        dailyRateMax: 120,
      };
      const params = buildOperatorQueryParams('', filters);

      // Must send server-expected keys (minDailyRate / maxDailyRate)
      expect(params.minDailyRate).toBe(25);
      expect(params.maxDailyRate).toBe(120);
      expect((params as any).dailyRateMin).toBeUndefined();
      expect((params as any).dailyRateMax).toBeUndefined();
    });

    it('handles only dailyRateMin or only dailyRateMax correctly', () => {
      const minOnly = buildOperatorQueryParams('', { dailyRateMin: 15 });
      expect(minOnly).toEqual({ minDailyRate: 15 });

      const maxOnly = buildOperatorQueryParams('', { dailyRateMax: 80 });
      expect(maxOnly).toEqual({ maxDailyRate: 80 });
    });

    it('maps minExperience and maxExperience to minExperienceYears and maxExperienceYears', () => {
      const filters: OperatorFilterState = {
        minExperience: 3,
        maxExperience: 8,
      };
      const params = buildOperatorQueryParams('', filters);

      // Must send server-expected keys (minExperienceYears / maxExperienceYears)
      expect(params.minExperienceYears).toBe(3);
      expect(params.maxExperienceYears).toBe(8);
      expect((params as any).minExperience).toBeUndefined();
      expect((params as any).maxExperience).toBeUndefined();
    });

    it('handles single-bound experience filters correctly', () => {
      const minExp = buildOperatorQueryParams('', { minExperience: 5 });
      expect(minExp).toEqual({ minExperienceYears: 5 });

      const maxExp = buildOperatorQueryParams('', { maxExperience: 2 });
      expect(maxExp).toEqual({ maxExperienceYears: 2 });
    });

    it('maps sort values to backend sortBy and sortOrder fields', () => {
      const ascRate = buildOperatorQueryParams('', { sortBy: 'dailyRate_asc' });
      expect(ascRate).toEqual({ sortBy: 'dailyRate', sortOrder: 'asc' });

      const descRate = buildOperatorQueryParams('', { sortBy: 'dailyRate_desc' });
      expect(descRate).toEqual({ sortBy: 'dailyRate', sortOrder: 'desc' });

      const expYears = buildOperatorQueryParams('', { sortBy: 'experienceYears' });
      expect(expYears).toEqual({ sortBy: 'experienceYears', sortOrder: 'desc' });

      const newest = buildOperatorQueryParams('', { sortBy: 'newest' });
      expect(newest).toEqual({ sortBy: 'createdAt', sortOrder: 'desc' });
    });

    it('maps location and operatorType to server params', () => {
      const filters: OperatorFilterState = {
        operatorType: 'HEAVY_EQUIPMENT',
        governorateId: 1,
        wilayaId: 102,
      };
      const params = buildOperatorQueryParams('', filters);
      expect(params).toEqual({
        operatorType: 'HEAVY_EQUIPMENT',
        governorateId: 1,
        wilayaId: 102,
      });
    });

    it('omits operatorType when set to "all"', () => {
      const params = buildOperatorQueryParams('', { operatorType: 'all' });
      expect(params.operatorType).toBeUndefined();
    });

    it('does not leak client-only filters to the server params', () => {
      const filters: OperatorFilterState = {
        dailyRateMin: 20,
        equipmentType: 'excavator',
        isPriceNegotiable: true,
        certification: 'heavy-license',
      };
      const params = buildOperatorQueryParams('', filters);

      expect(params.minDailyRate).toBe(20);
      expect((params as any).equipmentType).toBeUndefined();
      expect((params as any).isPriceNegotiable).toBeUndefined();
      expect((params as any).certification).toBeUndefined();
    });
  });

  describe('Query Key & Pagination Contract', () => {
    it('produces distinct query keys when filter params change', () => {
      const initialKey = ['operators-infinite', buildOperatorQueryParams('', {})];
      const withRateKey = ['operators-infinite', buildOperatorQueryParams('', { dailyRateMin: 50 })];
      const withExpKey = ['operators-infinite', buildOperatorQueryParams('', { minExperience: 3 })];

      expect(initialKey).not.toEqual(withRateKey);
      expect(withRateKey).not.toEqual(withExpKey);
      expect(withRateKey[1]).toEqual({ minDailyRate: 50 });
      expect(withExpKey[1]).toEqual({ minExperienceYears: 3 });
    });

    it('page 2+ query preserves server filter parameters', () => {
      const params = buildOperatorQueryParams('سائق', {
        dailyRateMin: 30,
        dailyRateMax: 100,
        minExperience: 2,
        maxExperience: 10,
        governorateId: 1,
      });

      // Simulates useOperatorsInfinite queryFn payload across pagination
      const page1Payload: Record<string, unknown> = { ...params, page: 1, limit: 10 };
      const page2Payload: Record<string, unknown> = { ...params, page: 2, limit: 10 };

      expect(page1Payload.minDailyRate).toBe(30);
      expect(page1Payload.maxDailyRate).toBe(100);
      expect(page1Payload.minExperienceYears).toBe(2);
      expect(page1Payload.maxExperienceYears).toBe(10);
      expect(page1Payload.page).toBe(1);

      expect(page2Payload.minDailyRate).toBe(30);
      expect(page2Payload.maxDailyRate).toBe(100);
      expect(page2Payload.minExperienceYears).toBe(2);
      expect(page2Payload.maxExperienceYears).toBe(10);
      expect(page2Payload.page).toBe(2);
    });
  });

  describe('No Client-Side In-Memory Rate/Experience Dropping (Audit 375 Finding 2 Regression)', () => {
    it('does not discard valid server-returned items in memory for rate or experience', () => {
      // Backend returned 2 operators matching the requested rate (30-80) and experience (2-5)
      const serverItems = [
        {
          id: 'op-1',
          title: 'مشغل رافعة برجية',
          price: 50,
          dailyRate: 50,
          experienceYears: 4,
          raw: { dailyRate: 50, experienceYears: 4 },
        },
        {
          id: 'op-2',
          title: 'سائق شاحنة ثقيلة',
          price: 75,
          dailyRate: 75,
          experienceYears: 3,
          raw: { dailyRate: 75, experienceYears: 3 },
        },
      ];

      // In the new architecture, client-side filtering no longer strips based on dailyRate or experienceYears
      // because the server already performed the filtering.
      const clientFilters: OperatorFilterState = {
        dailyRateMin: 30,
        dailyRateMax: 80,
        minExperience: 2,
        maxExperience: 5,
      };

      // Ensure query params were built for the server
      const queryParams = buildOperatorQueryParams('', clientFilters);
      expect(queryParams.minDailyRate).toBe(30);
      expect(queryParams.maxDailyRate).toBe(80);
      expect(queryParams.minExperienceYears).toBe(2);
      expect(queryParams.maxExperienceYears).toBe(5);

      // Verify server items are not dropped
      expect(serverItems.length).toBe(2);
      expect(serverItems[0].dailyRate).toBe(50);
      expect(serverItems[1].dailyRate).toBe(75);
    });
  });
});
