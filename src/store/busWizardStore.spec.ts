import { useBusWizardStore } from './busWizardStore';

describe('busWizardStore', () => {
  beforeEach(() => {
    useBusWizardStore.getState().reset();
  });

  it('initial state has governorateId: null', () => {
    expect(useBusWizardStore.getState().data.governorateId).toBeNull();
    expect(useBusWizardStore.getState().data.wilayaId).toBeNull();
  });

  it('setLocation sets governorateId, wilayaId, governorateNameAr, wilayaNameAr correctly', () => {
    useBusWizardStore.getState().setLocation(1, 2, 'Muscat', 'Seeb');
    
    const state = useBusWizardStore.getState().data;
    expect(state.governorateId).toBe(1);
    expect(state.wilayaId).toBe(2);
    expect(state.governorateNameAr).toBe('Muscat');
    expect(state.wilayaNameAr).toBe('Seeb');
  });

  it('reset() clears all location fields back to null/empty string', () => {
    useBusWizardStore.getState().setLocation(1, 2, 'Muscat', 'Seeb');
    useBusWizardStore.getState().reset();
    
    const state = useBusWizardStore.getState().data;
    expect(state.governorateId).toBeNull();
    expect(state.wilayaId).toBeNull();
    expect(state.governorateNameAr).toBe('');
    expect(state.wilayaNameAr).toBe('');
  });
});
