import { validateStep } from './usePartValidation';
import { defaultPartFormData, PartFormData } from '../store/partWizardStore';

describe('usePartValidation', () => {
  let baseData: PartFormData;

  beforeEach(() => {
    baseData = { ...defaultPartFormData };
  });

  // Step 1
  it('Step 1: Returns invalid if listingType is missing', () => {
    baseData.listingType = null;
    const result = validateStep(1, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.listingType).toBe('اختر نوع الإعلان');
  });

  it('Step 1: Returns valid if all required fields are present', () => {
    baseData.listingType = 'SPARE_PART_SALE'; 
    const result = validateStep(1, baseData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  // Step 3
  it('Step 3: Returns invalid if title is less than 3 chars', () => {
    baseData.title = 'ab';
    baseData.description = 'This is a valid description';
    const result = validateStep(3, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('Step 3: Returns invalid if description is less than 10 chars', () => {
    baseData.title = 'Valid title';
    baseData.description = 'short';
    const result = validateStep(3, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.description).toBeDefined();
  });

  // Step 4
  it('Step 4: Returns invalid if yearTo < yearFrom', () => {
    baseData.yearFrom = 2020;
    baseData.yearTo = 2019;
    const result = validateStep(4, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.yearTo).toBe('سنة النهاية أكبر من سنة البداية');
  });

  it('Step 4: Returns valid if yearTo === yearFrom', () => {
    baseData.yearFrom = 2020;
    baseData.yearTo = 2020;
    const result = validateStep(4, baseData);
    expect(result.isValid).toBe(true);
  });

  it('Step 4: Returns valid if yearFrom and yearTo are null', () => {
    baseData.yearFrom = null;
    baseData.yearTo = null;
    const result = validateStep(4, baseData);
    expect(result.isValid).toBe(true);
  });

  // Step 5
  it('Step 5: Returns invalid if price is 0', () => {
    baseData.price = 0;
    baseData.governorateId = 1;
    baseData.wilayaId = 1;
    const result = validateStep(5, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.price).toBe('أدخل سعر القطعة');
  });

  it('Step 5: Returns invalid if price is -10', () => {
    baseData.price = -10;
    baseData.governorateId = 1;
    baseData.wilayaId = 1;
    const result = validateStep(5, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.price).toBe('أدخل سعر القطعة');
  });

  it('Step 5: Returns valid if price is 50', () => {
    baseData.price = 50;
    baseData.governorateId = 1;
    baseData.wilayaId = 1;
    const result = validateStep(5, baseData);
    expect(result.isValid).toBe(true);
  });

  it('Step 5: Returns invalid if governorateId is null', () => {
    baseData.price = 50;
    baseData.governorateId = null;
    baseData.wilayaId = 1;
    const result = validateStep(5, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.governorateId).toBe('اختر المحافظة');
  });

  it('Step 5: Returns invalid if wilayaId is null', () => {
    baseData.price = 50;
    baseData.governorateId = 1;
    baseData.wilayaId = null;
    const result = validateStep(5, baseData);
    expect(result.isValid).toBe(false);
    expect(result.errors.wilayaId).toBe('اختر الولاية');
  });
});
