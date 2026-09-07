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

  it('setEditMode correctly updates all data fields including manufacturerId, modelId, contractExpiry, and currency', () => {
    useBusWizardStore.getState().setEditMode('bus-101', {
      title: 'حافلة تويوتا كوستر للبيع',
      make: 'Toyota',
      model: 'Coaster',
      manufacturerId: 'man-toyota-1',
      modelId: 'mod-coaster-2',
      price: '15000',
      currency: 'OMR',
      busListingType: 'BUS_SALE_WITH_CONTRACT',
      busType: 'COASTER',
      contractType: 'SCHOOL',
      contractClient: 'مدرسة مسقط الدولية',
      contractMonthly: '800',
      contractDuration: '24',
      contractExpiry: '2027-09-01T00:00:00.000Z',
      governorateId: 1,
      wilayaId: 101,
    });

    const state = useBusWizardStore.getState();
    expect(state.editMode).toBe(true);
    expect(state.editListingId).toBe('bus-101');
    expect(state.data.title).toBe('حافلة تويوتا كوستر للبيع');
    expect(state.data.make).toBe('Toyota');
    expect(state.data.model).toBe('Coaster');
    expect(state.data.manufacturerId).toBe('man-toyota-1');
    expect(state.data.modelId).toBe('mod-coaster-2');
    expect(state.data.price).toBe('15000');
    expect(state.data.currency).toBe('OMR');
    expect(state.data.busListingType).toBe('BUS_SALE_WITH_CONTRACT');
    expect(state.data.busType).toBe('COASTER');
    expect(state.data.contractType).toBe('SCHOOL');
    expect(state.data.contractClient).toBe('مدرسة مسقط الدولية');
    expect(state.data.contractMonthly).toBe('800');
    expect(state.data.contractDuration).toBe('24');
    expect(state.data.contractExpiry).toBe('2027-09-01T00:00:00.000Z');
    expect(state.data.governorateId).toBe(1);
    expect(state.data.wilayaId).toBe(101);
  });

  it('reset() clears all location fields, data, editMode, and editListingId back to initial defaults', () => {
    useBusWizardStore.getState().setEditMode('bus-101', {
      title: 'حافلة تجريبية',
      manufacturerId: 'man-1',
      modelId: 'mod-1',
      contractExpiry: '2027-09-01',
    });
    useBusWizardStore.getState().setLocation(1, 2, 'Muscat', 'Seeb');
    useBusWizardStore.getState().reset();
    
    const state = useBusWizardStore.getState();
    expect(state.editMode).toBe(false);
    expect(state.editListingId).toBeNull();
    expect(state.currentStep).toBe(1);
    expect(state.data.title).toBe('');
    expect(state.data.currency).toBe('OMR');
    expect(state.data.manufacturerId).toBeNull();
    expect(state.data.modelId).toBeNull();
    expect(state.data.contractExpiry).toBeNull();
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
