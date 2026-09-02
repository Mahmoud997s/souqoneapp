import {
  useServiceWizardStore,
  defaultServiceFormData,
  mergeServiceWizardState,
  ServiceFormData,
} from './serviceWizardStore';

describe('serviceWizardStore (Phase 1)', () => {
  beforeEach(() => {
    useServiceWizardStore.getState().reset();
  });

  describe('1. Initial Default Values', () => {
    it('has all default values matching expected types and empty/null states', () => {
      const state = useServiceWizardStore.getState();

      expect(state.currentStep).toBe(1);
      expect(state.formData.serviceType).toBeNull();
      expect(state.formData.providerType).toBeNull();
      expect(state.formData.providerName).toBe('');

      expect(state.formData.images).toEqual([]);
      expect(state.formData.existingImages).toEqual([]);
      expect(state.formData.removedImageIds).toEqual([]);

      expect(state.formData.title).toBe('');
      expect(state.formData.description).toBe('');
      expect(state.formData.specializations).toEqual([]);
      expect(state.formData.isHomeService).toBe(false);

      expect(state.formData.workingDays).toEqual([]);
      expect(state.formData.workingHoursOpen).toBeNull();
      expect(state.formData.workingHoursClose).toBeNull();

      expect(state.formData.priceFrom).toBeNull();
      expect(state.formData.priceTo).toBeNull();
      expect(state.formData.currency).toBe('OMR');
      expect(state.formData.governorateId).toBeNull();
      expect(state.formData.wilayaId).toBeNull();
      expect(state.formData.governorateNameAr).toBe('');
      expect(state.formData.wilayaNameAr).toBe('');
      expect(state.formData.address).toBe('');
      expect(state.formData.latitude).toBeNull();
      expect(state.formData.longitude).toBeNull();
      expect(state.formData.contactPhone).toBe('');
      expect(state.formData.whatsapp).toBe('');
      expect(state.formData.website).toBe('');

      expect(state.formData.editMode).toBe(false);
      expect(state.formData.editListingId).toBeNull();
    });
  });

  describe('2. setEditMode', () => {
    it('fills all fields correctly and activates edit mode', () => {
      const mockServiceData: Partial<ServiceFormData> = {
        serviceType: 'MAINTENANCE',
        providerType: 'WORKSHOP',
        providerName: 'كراج النجوم لصيانة المحركات',
        title: 'صيانة وفحص شامل للسيارات اليابانية',
        description: 'نوفر فحص وبرمجة كمبيوتر بأحدث الأجهزة مع ضمان',
        specializations: ['تغيير زيت وفلاتر', 'ميكانيكا عامة'],
        isHomeService: true,
        workingDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
        workingHoursOpen: '08:00',
        workingHoursClose: '20:00',
        priceFrom: 25,
        priceTo: 100,
        currency: 'OMR',
        governorateId: 1,
        wilayaId: 101,
        governorateNameAr: 'مسقط',
        wilayaNameAr: 'السيب',
        address: 'شارع رقم 8، المعبيلة الصناعية',
        latitude: 23.588,
        longitude: 58.3829,
        contactPhone: '91234567',
        whatsapp: '91234567',
        website: 'https://garage.om',
        existingImages: [{ id: 'img-1', url: 'https://img.com/1.jpg', isPrimary: true }],
      };

      useServiceWizardStore.getState().setEditMode('srv-12345', mockServiceData);

      const state = useServiceWizardStore.getState().formData;
      expect(state.editMode).toBe(true);
      expect(state.editListingId).toBe('srv-12345');
      expect(state.serviceType).toBe('MAINTENANCE');
      expect(state.providerType).toBe('WORKSHOP');
      expect(state.providerName).toBe('كراج النجوم لصيانة المحركات');
      expect(state.title).toBe('صيانة وفحص شامل للسيارات اليابانية');
      expect(state.description).toBe('نوفر فحص وبرمجة كمبيوتر بأحدث الأجهزة مع ضمان');
      expect(state.specializations).toEqual(['تغيير زيت وفلاتر', 'ميكانيكا عامة']);
      expect(state.isHomeService).toBe(true);
      expect(state.workingDays).toEqual(['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
      expect(state.workingHoursOpen).toBe('08:00');
      expect(state.workingHoursClose).toBe('20:00');
      expect(state.priceFrom).toBe(25);
      expect(state.priceTo).toBe(100);
      expect(state.governorateId).toBe(1);
      expect(state.wilayaId).toBe(101);
      expect(state.governorateNameAr).toBe('مسقط');
      expect(state.wilayaNameAr).toBe('السيب');
      expect(state.address).toBe('شارع رقم 8، المعبيلة الصناعية');
      expect(state.latitude).toBe(23.588);
      expect(state.longitude).toBe(58.3829);
      expect(state.contactPhone).toBe('91234567');
      expect(state.whatsapp).toBe('91234567');
      expect(state.website).toBe('https://garage.om');
      expect(state.existingImages).toEqual([{ id: 'img-1', url: 'https://img.com/1.jpg', isPrimary: true }]);
    });

    it('does not leak images/removedImageIds left over from an abandoned draft into an unrelated listing edit', () => {
      // Simulate: user started a new service, picked an image, then abandoned the draft —
      // the store still holds that stale image (this is the exact repro from the bug report).
      useServiceWizardStore.getState().setField('images', [{ uri: 'file://abandoned-draft-image.jpg' }]);
      useServiceWizardStore.getState().setField('removedImageIds', ['stale-removed-id']);

      // Now edit a completely different, unrelated listing. Its `data` (matching the real
      // call sites in app/services/[id].tsx and app/post/edit/[id].tsx) never includes
      // `images` or `removedImageIds` — only `existingImages`.
      const unrelatedServiceData: Partial<ServiceFormData> = {
        title: 'خدمة أخرى غير مرتبطة',
        existingImages: [{ id: 'real-1', url: 'https://img.com/real.jpg', isPrimary: true }],
      };

      useServiceWizardStore.getState().setEditMode('srv-unrelated-999', unrelatedServiceData);

      const state = useServiceWizardStore.getState().formData;
      expect(state.images).toEqual([]);
      expect(state.removedImageIds).toEqual([]);
      expect(state.existingImages).toEqual([{ id: 'real-1', url: 'https://img.com/real.jpg', isPrimary: true }]);
      expect(state.title).toBe('خدمة أخرى غير مرتبطة');
      expect(state.editListingId).toBe('srv-unrelated-999');
    });
  });

  describe('3. reset', () => {
    it('restores all fields and current step back to default values', () => {
      useServiceWizardStore.getState().setField('title', 'خدمة تجريبية');
      useServiceWizardStore.getState().setField('providerName', 'مركز الصيانة');
      useServiceWizardStore.getState().setLocation(2, 202, 'ظفار', 'صلالة');
      useServiceWizardStore.getState().goToStep(4);

      useServiceWizardStore.getState().reset();

      const state = useServiceWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.formData).toEqual(defaultServiceFormData);
    });
  });

  describe('4. Field updates and setLocation', () => {
    it('setField updates a single field cleanly', () => {
      useServiceWizardStore.getState().setField('providerName', 'فني متنقل للتكييف');
      expect(useServiceWizardStore.getState().formData.providerName).toBe('فني متنقل للتكييف');
    });

    it('setFields updates multiple fields simultaneously', () => {
      useServiceWizardStore.getState().setFields({
        priceFrom: 15,
        priceTo: 50,
        isHomeService: true,
      });

      const state = useServiceWizardStore.getState().formData;
      expect(state.priceFrom).toBe(15);
      expect(state.priceTo).toBe(50);
      expect(state.isHomeService).toBe(true);
    });

    it('setLocation sets governorate and wilaya IDs and Arabic names', () => {
      useServiceWizardStore.getState().setLocation(1, 102, 'مسقط', 'بوشر');

      const state = useServiceWizardStore.getState().formData;
      expect(state.governorateId).toBe(1);
      expect(state.wilayaId).toBe(102);
      expect(state.governorateNameAr).toBe('مسقط');
      expect(state.wilayaNameAr).toBe('بوشر');
    });
  });

  describe('5. Step Navigation', () => {
    it('navigates forward, backward and to specific step correctly', () => {
      expect(useServiceWizardStore.getState().currentStep).toBe(1);

      useServiceWizardStore.getState().nextStep();
      expect(useServiceWizardStore.getState().currentStep).toBe(2);

      useServiceWizardStore.getState().nextStep();
      expect(useServiceWizardStore.getState().currentStep).toBe(3);

      useServiceWizardStore.getState().prevStep();
      expect(useServiceWizardStore.getState().currentStep).toBe(2);

      useServiceWizardStore.getState().prevStep();
      expect(useServiceWizardStore.getState().currentStep).toBe(1);

      useServiceWizardStore.getState().prevStep(); // Should clamp at minimum 1
      expect(useServiceWizardStore.getState().currentStep).toBe(1);

      useServiceWizardStore.getState().goToStep(5);
      expect(useServiceWizardStore.getState().currentStep).toBe(5);
    });
  });

  describe('6. mergeServiceWizardState helper', () => {
    it('merges persisted draft data with default values safely', () => {
      const persistedState = {
        formData: {
          title: 'خدمة مسودة محفوظة',
          serviceType: 'CLEANING',
          providerName: 'مغسلة النور',
        },
        currentStep: 3,
      };

      const currentState = useServiceWizardStore.getState();
      const merged = mergeServiceWizardState(persistedState, currentState);

      expect(merged.currentStep).toBe(3);
      expect(merged.formData.title).toBe('خدمة مسودة محفوظة');
      expect(merged.formData.serviceType).toBe('CLEANING');
      expect(merged.formData.providerName).toBe('مغسلة النور');
      expect(merged.formData.currency).toBe('OMR');
      expect(merged.formData.editMode).toBe(false);
      expect(merged.formData.editListingId).toBeNull();
    });
  });
});
