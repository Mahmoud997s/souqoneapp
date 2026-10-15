import { useCarrierWizardStore } from './carrierWizardStore';

describe('carrierWizardStore', () => {
  beforeEach(() => {
    useCarrierWizardStore.getState().reset();
  });

  it('initial state has whatsappEnabled: false', () => {
    const state = useCarrierWizardStore.getState();
    expect(state.whatsappEnabled).toBe(false);
    expect(state.companyName).toBe('');
    expect(state.bio).toBe('');
  });

  it('updates whatsappEnabled via setField', () => {
    useCarrierWizardStore.getState().setField('whatsappEnabled', true);
    expect(useCarrierWizardStore.getState().whatsappEnabled).toBe(true);
  });

  it('resets state properly', () => {
    useCarrierWizardStore.getState().setField('whatsappEnabled', true);
    useCarrierWizardStore.getState().setField('companyName', 'شركة النقل');
    useCarrierWizardStore.getState().reset();

    const state = useCarrierWizardStore.getState();
    expect(state.whatsappEnabled).toBe(false);
    expect(state.companyName).toBe('');
  });
});
