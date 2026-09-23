describe('Cars Browse Filter Logic', () => {
  function decodeSearchParam(search?: string): string {
    if (!search) return '';
    try {
      return decodeURIComponent(search).trim();
    } catch {
      return search.trim();
    }
  }

  function parseFiltersFromParams(params: {
    type?: string;
    condition?: string;
    featured?: string;
    isPremium?: string;
    make?: string;
    brandId?: string;
  }) {
    const initialFilters: Record<string, any> = {};
    const t = params.type?.toLowerCase();

    if (t === 'used') {
      initialFilters.condition = 'USED';
    } else if (t === 'new') {
      initialFilters.condition = 'NEW';
    } else if (t === 'wanted') {
      initialFilters.listingType = 'WANTED';
    } else if (t === 'rental' || t === 'rent') {
      initialFilters.listingType = 'RENTAL';
    } else if (t === 'sale') {
      initialFilters.listingType = 'SALE';
    }

    if (params.condition) {
      initialFilters.condition = params.condition.toUpperCase();
    }

    if (params.featured === 'true' || params.isPremium === 'true') {
      initialFilters.isPremium = true;
    }

    if (params.make) {
      initialFilters.make = params.make;
    }

    if (params.brandId) {
      initialFilters.makeId = params.brandId;
    }

    return initialFilters;
  }

  it('defaults to empty filters when no query params are present', () => {
    const filters = parseFiltersFromParams({});
    expect(filters).toEqual({});
    expect(Object.keys(filters).length).toBe(0);
    expect(filters.listingType).toBeUndefined();
    expect(filters.condition).toBeUndefined();
  });

  it('maps "used" type strictly to condition=USED without forcing listingType=SALE', () => {
    const filters = parseFiltersFromParams({ type: 'used' });
    expect(filters).toEqual({ condition: 'USED' });
    expect(filters.listingType).toBeUndefined();
  });

  it('maps "new" type strictly to condition=NEW without forcing listingType=SALE', () => {
    const filters = parseFiltersFromParams({ type: 'new' });
    expect(filters).toEqual({ condition: 'NEW' });
    expect(filters.listingType).toBeUndefined();
  });

  it('maps "sale" type strictly to listingType=SALE', () => {
    const filters = parseFiltersFromParams({ type: 'sale' });
    expect(filters).toEqual({ listingType: 'SALE' });
    expect(filters.condition).toBeUndefined();
  });

  it('maps "rental" or "rent" type to listingType=RENTAL', () => {
    expect(parseFiltersFromParams({ type: 'rental' })).toEqual({ listingType: 'RENTAL' });
    expect(parseFiltersFromParams({ type: 'rent' })).toEqual({ listingType: 'RENTAL' });
  });

  it('maps "wanted" type to listingType=WANTED', () => {
    const filters = parseFiltersFromParams({ type: 'wanted' });
    expect(filters).toEqual({ listingType: 'WANTED' });
  });

  it('calculates activeFiltersCount correctly without double counting make', () => {
    const filters: Record<string, any> = { makeId: 'toyota', make: 'Toyota' };
    const selectedBrandId = 'toyota';

    let count = 0;
    if (selectedBrandId || filters.makeId || filters.make) count++;
    const skipKeys = new Set(['makeId', 'make', 'modelId']);
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') count++;
    });

    expect(count).toBe(1);
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
});
