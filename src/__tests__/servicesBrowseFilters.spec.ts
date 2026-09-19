describe('Services Browse Filter Logic', () => {
  function parseServicesFiltersFromParams(params: {
    q?: string;
    serviceType?: string;
    providerType?: string;
    governorate?: string;
    governorateId?: string;
    wilayaId?: string;
    isHomeService?: string;
  }) {
    const initial: Record<string, any> = {};
    if (params.serviceType) initial.serviceType = params.serviceType;
    if (params.providerType) {
      initial.providerType = params.providerType === 'CENTER' ? 'WORKSHOP' : params.providerType;
    }
    if (params.governorate) initial.governorate = params.governorate;
    if (params.governorateId) {
      const parsed = parseInt(String(params.governorateId), 10);
      if (!isNaN(parsed) && parsed > 0) initial.governorateId = parsed;
    }
    if (params.wilayaId) {
      const parsed = parseInt(String(params.wilayaId), 10);
      if (!isNaN(parsed) && parsed > 0) initial.wilayaId = parsed;
    }
    if (params.isHomeService === 'true') initial.isHomeService = true;
    return initial;
  }

  function clearQuickFilter(filters: Record<string, any>, filterId: string) {
    const next = { ...filters };
    if (filterId === 'serviceType') delete next.serviceType;
    if (filterId === 'providerType') delete next.providerType;
    if (filterId === 'specialization' || filterId === 'specializations') delete next.specializations;
    if (filterId === 'isOpenNow') delete next.isOpenNow;
    if (filterId === 'isHomeService') delete next.isHomeService;
    if (filterId === 'sort') {
      delete next.sortBy;
      delete next.sortOrder;
    }
    if (filterId === 'city' || filterId === 'gov') {
      delete next.governorateId;
      delete next.wilayaId;
      delete next.governorate;
      delete next.city;
    }
    return next;
  }

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

  it('clears individual filters without affecting others', () => {
    let state: Record<string, any> = {
      serviceType: 'CLEANING',
      providerType: 'WORKSHOP',
      city: 'مسقط',
      governorateId: 1,
      wilayaId: 101,
      isOpenNow: true,
      sortBy: 'rating',
      specializations: ['نانو سيراميك'],
    };

    state = clearQuickFilter(state, 'serviceType');
    expect(state.serviceType).toBeUndefined();
    expect(state.providerType).toBe('WORKSHOP');
    expect(state.city).toBe('مسقط');

    state = clearQuickFilter(state, 'city');
    expect(state.city).toBeUndefined();
    expect(state.governorateId).toBeUndefined();
    expect(state.wilayaId).toBeUndefined();
    expect(state.isOpenNow).toBe(true);

    state = clearQuickFilter(state, 'sort');
    expect(state.sortBy).toBeUndefined();

    state = clearQuickFilter(state, 'specialization');
    expect(state.specializations).toBeUndefined();
    expect(state.providerType).toBe('WORKSHOP');
  });
});
