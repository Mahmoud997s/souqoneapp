import { useTransportWizardStore } from './transportWizardStore';

describe('transportWizardStore', () => {
  beforeEach(() => {
    useTransportWizardStore.getState().reset();
  });

  describe('setFromLocation', () => {
    it('sets all 4 from-location fields correctly', () => {
      useTransportWizardStore.getState().setFromLocation(1, 101, 'مسقط', 'السيب');

      const { data } = useTransportWizardStore.getState();
      expect(data.fromGovernorateId).toBe(1);
      expect(data.fromWilayaId).toBe(101);
      expect(data.fromGovernorateNameAr).toBe('مسقط');
      expect(data.fromWilayaNameAr).toBe('السيب');
    });

    it('does not touch the to-location fields', () => {
      useTransportWizardStore.getState().setFromLocation(1, 101, 'مسقط', 'السيب');

      const { data } = useTransportWizardStore.getState();
      expect(data.toGovernorateId).toBeNull();
      expect(data.toWilayaId).toBeNull();
      expect(data.toGovernorateNameAr).toBe('');
      expect(data.toWilayaNameAr).toBe('');
    });

    it('preserves other unrelated fields already set on the store', () => {
      useTransportWizardStore.getState().setField('cargoDescription', 'أثاث منزلي');
      useTransportWizardStore.getState().setFromLocation(1, 101, 'مسقط', 'السيب');

      expect(useTransportWizardStore.getState().data.cargoDescription).toBe('أثاث منزلي');
    });
  });

  describe('setToLocation', () => {
    it('sets all 4 to-location fields correctly', () => {
      useTransportWizardStore.getState().setToLocation(2, 201, 'ظفار', 'صلالة');

      const { data } = useTransportWizardStore.getState();
      expect(data.toGovernorateId).toBe(2);
      expect(data.toWilayaId).toBe(201);
      expect(data.toGovernorateNameAr).toBe('ظفار');
      expect(data.toWilayaNameAr).toBe('صلالة');
    });

    it('does not touch the from-location fields', () => {
      useTransportWizardStore.getState().setToLocation(2, 201, 'ظفار', 'صلالة');

      const { data } = useTransportWizardStore.getState();
      expect(data.fromGovernorateId).toBeNull();
      expect(data.fromWilayaId).toBeNull();
      expect(data.fromGovernorateNameAr).toBe('');
      expect(data.fromWilayaNameAr).toBe('');
    });

    it('can be set independently after setFromLocation without overwriting it', () => {
      useTransportWizardStore.getState().setFromLocation(1, 101, 'مسقط', 'السيب');
      useTransportWizardStore.getState().setToLocation(2, 201, 'ظفار', 'صلالة');

      const { data } = useTransportWizardStore.getState();
      expect(data.fromGovernorateId).toBe(1);
      expect(data.fromWilayaId).toBe(101);
      expect(data.toGovernorateId).toBe(2);
      expect(data.toWilayaId).toBe(201);
    });
  });

  describe('reset', () => {
    it('clears all location fields back to null/empty string', () => {
      useTransportWizardStore.getState().setFromLocation(1, 101, 'مسقط', 'السيب');
      useTransportWizardStore.getState().setToLocation(2, 201, 'ظفار', 'صلالة');

      useTransportWizardStore.getState().reset();

      const { data } = useTransportWizardStore.getState();
      expect(data.fromGovernorateId).toBeNull();
      expect(data.fromWilayaId).toBeNull();
      expect(data.fromGovernorateNameAr).toBe('');
      expect(data.fromWilayaNameAr).toBe('');
      expect(data.toGovernorateId).toBeNull();
      expect(data.toWilayaId).toBeNull();
      expect(data.toGovernorateNameAr).toBe('');
      expect(data.toWilayaNameAr).toBe('');
    });

    it('also resets currentStep to 1 and clears errors', () => {
      useTransportWizardStore.getState().setStep(3);
      useTransportWizardStore.getState().setErrors({ fromGovernorateId: 'مطلوب' });

      useTransportWizardStore.getState().reset();

      expect(useTransportWizardStore.getState().currentStep).toBe(1);
      expect(useTransportWizardStore.getState().errors).toEqual({});
    });
  });
});
