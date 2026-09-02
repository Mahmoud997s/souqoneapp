import { validateStep } from './useServiceValidation';
import { defaultServiceFormData, ServiceFormData } from '../store/serviceWizardStore';

describe('useServiceValidation (Phase 2)', () => {
  let baseData: ServiceFormData;

  beforeEach(() => {
    baseData = { ...defaultServiceFormData };
  });

  describe('Step 1: Service Type & Provider Info', () => {
    it('returns error if serviceType is missing', () => {
      baseData.serviceType = null;
      baseData.providerType = 'WORKSHOP';
      baseData.providerName = 'ورشة المحركات';

      const result = validateStep(1, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.serviceType).toBe('اختر نوع الخدمة');
    });

    it('returns error if providerType is missing', () => {
      baseData.serviceType = 'MAINTENANCE';
      baseData.providerType = null;
      baseData.providerName = 'ورشة المحركات';

      const result = validateStep(1, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.providerType).toBe('اختر صفة مقدم الخدمة');
    });

    it('returns error if providerName is empty or less than 3 characters', () => {
      baseData.serviceType = 'MAINTENANCE';
      baseData.providerType = 'WORKSHOP';
      baseData.providerName = '  ';

      let result = validateStep(1, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.providerName).toBe('اسم مقدم الخدمة لازم يكون 3 أحرف على الأقل');

      baseData.providerName = 'أب';
      result = validateStep(1, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.providerName).toBe('اسم مقدم الخدمة لازم يكون 3 أحرف على الأقل');
    });

    it('returns isValid true when all Step 1 fields are valid', () => {
      baseData.serviceType = 'MAINTENANCE';
      baseData.providerType = 'WORKSHOP';
      baseData.providerName = 'ورشة الخليج';

      const result = validateStep(1, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 2: Media & Images', () => {
    it('returns error when both images and existingImages are empty', () => {
      baseData.images = [];
      baseData.existingImages = [];

      const result = validateStep(2, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.images).toBe('أضف صورة واحدة على الأقل');
    });

    it('returns isValid true when only new images are provided', () => {
      baseData.images = [{ uri: 'file://img1.jpg', isPrimary: true }];
      baseData.existingImages = [];

      const result = validateStep(2, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns isValid true when only existingImages are present (edit mode)', () => {
      baseData.images = [];
      baseData.existingImages = [{ id: 'img-1', url: 'https://img.com/1.jpg', isPrimary: true }];

      const result = validateStep(2, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 3: Title & Description', () => {
    it('returns error if title is less than 3 characters', () => {
      baseData.title = 'أب';
      baseData.description = 'وصف شامل لخدمة صيانة السيارات والمحركات';

      const result = validateStep(3, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('العنوان لازم يكون 3 أحرف على الأقل');
    });

    it('returns error if description is less than 10 characters', () => {
      baseData.title = 'صيانة مكيفات';
      baseData.description = 'قصير';

      const result = validateStep(3, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('الوصف لازم يكون 10 أحرف على الأقل');
    });

    it('returns isValid true when title and description are valid', () => {
      baseData.title = 'فحص وبرمجة كمبيوتر';
      baseData.description = 'فحص شامل لكافة الحساسات والمحركات بأحدث الأجهزة';

      const result = validateStep(3, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 4: Working Days & Hours', () => {
    it('returns isValid true unconditionally (workingDays and hours are optional)', () => {
      const result = validateStep(4, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 5: Pricing & Location', () => {
    it('returns error if priceFrom is missing or invalid', () => {
      baseData.priceFrom = null;
      baseData.governorateId = 1;
      baseData.wilayaId = 101;

      let result = validateStep(5, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.priceFrom).toBe('أدخل سعر الخدمة');

      baseData.priceFrom = 0;
      result = validateStep(5, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.priceFrom).toBe('أدخل سعر الخدمة');

      baseData.priceFrom = -5;
      result = validateStep(5, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.priceFrom).toBe('أدخل سعر الخدمة');
    });

    it('returns error if priceTo is less than priceFrom', () => {
      baseData.priceFrom = 50;
      baseData.priceTo = 30;
      baseData.governorateId = 1;
      baseData.wilayaId = 101;

      const result = validateStep(5, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.priceTo).toBe('السعر الأعلى لازم يكون أكبر من أو يساوي السعر الأدنى');
    });

    it('returns isValid true when priceTo is exactly equal to priceFrom (>= rule)', () => {
      baseData.priceFrom = 50;
      baseData.priceTo = 50;
      baseData.governorateId = 1;
      baseData.wilayaId = 101;

      const result = validateStep(5, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns isValid true when priceTo is greater than priceFrom', () => {
      baseData.priceFrom = 50;
      baseData.priceTo = 150;
      baseData.governorateId = 1;
      baseData.wilayaId = 101;

      const result = validateStep(5, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns isValid true when priceTo is omitted (null)', () => {
      baseData.priceFrom = 50;
      baseData.priceTo = null;
      baseData.governorateId = 1;
      baseData.wilayaId = 101;

      const result = validateStep(5, baseData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns error if governorateId is missing', () => {
      baseData.priceFrom = 50;
      baseData.governorateId = null;
      baseData.wilayaId = 101;

      const result = validateStep(5, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.governorateId).toBe('اختر المحافظة');
    });

    it('returns error if wilayaId is missing', () => {
      baseData.priceFrom = 50;
      baseData.governorateId = 1;
      baseData.wilayaId = null;

      const result = validateStep(5, baseData);
      expect(result.isValid).toBe(false);
      expect(result.errors.wilayaId).toBe('اختر الولاية');
    });
  });

  describe('validateStep general handling', () => {
    it('returns isValid true for Step 6 (Review) and unknown steps', () => {
      expect(validateStep(6, baseData).isValid).toBe(true);
      expect(validateStep(99, baseData).isValid).toBe(true);
    });
  });
});
