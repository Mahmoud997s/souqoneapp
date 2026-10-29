import { useJobPostStore } from './jobPostStore';

describe('jobPostStore', () => {
  beforeEach(() => {
    useJobPostStore.getState().reset();
  });

  it('initial state has governorateId: null', () => {
    expect(useJobPostStore.getState().governorateId).toBeNull();
    expect(useJobPostStore.getState().wilayaId).toBeNull();
  });

  it('setLocation sets all 4 fields correctly', () => {
    useJobPostStore.getState().setLocation(5, 10, 'GovName', 'WilName');
    
    const state = useJobPostStore.getState();
    expect(state.governorateId).toBe(5);
    expect(state.wilayaId).toBe(10);
    expect(state.governorateNameAr).toBe('GovName');
    expect(state.wilayaNameAr).toBe('WilName');
  });

  it('reset() clears location fields', () => {
    useJobPostStore.getState().setLocation(5, 10, 'GovName', 'WilName');
    useJobPostStore.getState().reset();
    
    const state = useJobPostStore.getState();
    expect(state.governorateId).toBeNull();
    expect(state.wilayaId).toBeNull();
    expect(state.governorateNameAr).toBe('');
    expect(state.wilayaNameAr).toBe('');
  });
});
