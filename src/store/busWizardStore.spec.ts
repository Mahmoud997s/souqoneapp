import { useBusWizardStore } from './busWizardStore';

describe('busWizardStore', () => {
  beforeEach(() => {
    useBusWizardStore.getState().reset();
  });

  it('initial state has governorateId: null and editMode: false', () => {
    const state = useBusWizardStore.getState();
    expect(state.data.governorateId).toBeNull();
    expect(state.data.wilayaId).toBeNull();
    expect(state.editMode).toBe(false);
    expect(state.editListingId).toBeNull();
  });

  it('setLocation sets governorateId, wilayaId, governorateNameAr, wilayaNameAr correctly', () => {
    useBusWizardStore.getState().setLocation(1, 2, 'Muscat', 'Seeb');
    
    const state = useBusWizardStore.getState().data;
    expect(state.governorateId).toBe(1);
    expect(state.wilayaId).toBe(2);
    expect(state.governorateNameAr).toBe('Muscat');
    expect(state.wilayaNameAr).toBe('Seeb');
  });

  it('setEditMode correctly updates data, editMode, and editListingId', () => {
    useBusWizardStore.getState().setEditMode('bus-101', {
      title: 'حافلة تويوتا كوستر للبيع',
      make: 'Toyota',
      model: 'Coaster',
      price: '15000',
      busListingType: 'BUS_SALE',
      busType: 'COASTER',
    });

    const state = useBusWizardStore.getState();
    expect(state.editMode).toBe(true);
    expect(state.editListingId).toBe('bus-101');
    expect(state.data.title).toBe('حافلة تويوتا كوستر للبيع');
    expect(state.data.make).toBe('Toyota');
    expect(state.data.model).toBe('Coaster');
    expect(state.data.price).toBe('15000');
    expect(state.data.busListingType).toBe('BUS_SALE');
    expect(state.data.busType).toBe('COASTER');
  });

  it('reset() clears all location fields, data, editMode, and editListingId back to initial state', () => {
    useBusWizardStore.getState().setEditMode('bus-101', {
      title: 'حافلة تجريبية',
    });
    useBusWizardStore.getState().setLocation(1, 2, 'Muscat', 'Seeb');
    useBusWizardStore.getState().reset();
    
    const state = useBusWizardStore.getState();
    expect(state.editMode).toBe(false);
    expect(state.editListingId).toBeNull();
    expect(state.data.title).toBe('');
    expect(state.data.governorateId).toBeNull();
    expect(state.data.wilayaId).toBeNull();
    expect(state.data.governorateNameAr).toBe('');
    expect(state.data.wilayaNameAr).toBe('');
  });

  it('partialize persists data, currentStep, editMode, and editListingId even in editMode', () => {
    useBusWizardStore.getState().setEditMode('bus-999', {
      title: 'حافلة قيد التعديل',
      price: '22000',
    });
    useBusWizardStore.getState().setStep(3);

    const currentState = useBusWizardStore.getState();
    const partializeFn = useBusWizardStore.persist.getOptions().partialize;
    
    if (partializeFn) {
      const persisted = partializeFn(currentState) as any;
      expect(persisted.editMode).toBe(true);
      expect(persisted.editListingId).toBe('bus-999');
      expect(persisted.currentStep).toBe(3);
      expect(persisted.data.title).toBe('حافلة قيد التعديل');
      expect(persisted.data.price).toBe('22000');
    }
  });
});
