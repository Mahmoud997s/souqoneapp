import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep,
} from './useBusValidation';
import { BusWizardData } from '../store/busWizardStore';

const mockDefaultData: BusWizardData = {
  busListingType: '',
  busType: '',
  make: '',
  model: '',
  manufacturerId: null,
  modelId: null,
  year: '',
  capacity: '',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '',
  plateNumber: '',
  features: [],
  price: '',
  currency: 'OMR',
  isPriceNegotiable: false,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: 'COMPANY',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: '',
  description: '',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '',
  whatsapp: '',
};

describe('useBusValidation', () => {
  describe('Step 1: Type & Category Validation', () => {
    it('fails when busListingType or busType are missing', () => {
      const result = validateStep1(mockDefaultData);
      expect(result.isValid).toBe(false);
      expect(result.errors.busListingType).toBe('الرجاء اختيار نوع الإعلان');
      expect(result.errors.busType).toBe('الرجاء اختيار فئة الحافلة');
    });

    it('passes when both busListingType and busType are selected', () => {
      const result = validateStep1({
        ...mockDefaultData,
        busListingType: 'BUS_SALE',
        busType: 'COASTER',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 2: Images Validation', () => {
    it('fails when images and existingImages are empty', () => {
      const result = validateStep2(mockDefaultData);
      expect(result.isValid).toBe(false);
      expect(result.errors.images).toBe('يرجى إضافة صورة واحدة على الأقل للاستمرار');
    });

    it('passes when new images exist', () => {
      const result = validateStep2({
        ...mockDefaultData,
        images: ['https://example.com/bus1.jpg'],
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('passes when existingImages exist', () => {
      const result = validateStep2({
        ...mockDefaultData,
        existingImages: [{ id: '1', url: 'https://example.com/bus1.jpg' }],
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 3: Specs Validation', () => {
    it('fails when specs fields are empty', () => {
      const result = validateStep3(mockDefaultData);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('الرجاء كتابة العنوان');
      expect(result.errors.description).toBe('الرجاء كتابة الوصف');
      expect(result.errors.make).toBe('الرجاء اختيار الماركة');
      expect(result.errors.model).toBe('الرجاء إدخال الموديل');
      expect(result.errors.year).toBe('الرجاء إدخال سنة الصنع');
      expect(result.errors.capacity).toBe('الرجاء إدخال عدد المقاعد');
      expect(result.errors.mileage).toBe('الرجاء إدخال الممشى');
    });

    it('passes when all required specs are provided', () => {
      const result = validateStep3({
        ...mockDefaultData,
        title: 'حافلة تويوتا للبيع',
        description: 'حافلة بحالة ممتازة وجاهزة للاستخدام',
        make: 'Toyota',
        model: 'Coaster',
        year: '2022',
        capacity: '30',
        mileage: '50000',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Step 4: Pricing & Contract Validation', () => {
    it('validates BUS_SALE requires price and condition', () => {
      const invalid = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_SALE',
        condition: '',
        price: '',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.price).toBe('الرجاء إدخال السعر');
      expect(invalid.errors.condition).toBe('الرجاء اختيار حالة الحافلة');

      const valid = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_SALE',
        condition: 'USED',
        price: '18000',
      });
      expect(valid.isValid).toBe(true);
    });

    it('validates BUS_RENT requires either dailyPrice or monthlyPrice', () => {
      const invalid = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_RENT',
        dailyPrice: '',
        monthlyPrice: '',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.dailyPrice).toBe('الرجاء إدخال الإيجار اليومي أو الشهري');

      const validDaily = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_RENT',
        dailyPrice: '50',
      });
      expect(validDaily.isValid).toBe(true);

      const validMonthly = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_RENT',
        monthlyPrice: '800',
      });
      expect(validMonthly.isValid).toBe(true);
    });

    it('validates BUS_SALE_WITH_CONTRACT requires contract details and price', () => {
      const invalid = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: '',
        condition: '',
        contractType: '',
        contractClient: '',
        contractMonthly: '',
        contractDuration: '',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.price).toBe('الرجاء إدخال السعر');
      expect(invalid.errors.condition).toBe('الرجاء اختيار حالة الحافلة');
      expect(invalid.errors.contractType).toBe('الرجاء اختيار نوع العقد');
      expect(invalid.errors.contractClient).toBe('الرجاء إدخال الجهة');
      expect(invalid.errors.contractMonthly).toBe('الرجاء إدخال القيمة');
      expect(invalid.errors.contractDuration).toBe('الرجاء إدخال المدة المتبقية');

      const valid = validateStep4({
        ...mockDefaultData,
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: '25000',
        condition: 'USED',
        contractType: 'SCHOOL',
        contractClient: 'مدرسة مسقط',
        contractMonthly: '600',
        contractDuration: '12',
      });
      expect(valid.isValid).toBe(true);
    });
  });

  describe('Step 5: Location & Contact Validation', () => {
    it('fails when governorateId, wilayaId, or contactPhone are missing', () => {
      const result = validateStep5(mockDefaultData);
      expect(result.isValid).toBe(false);
      expect(result.errors.governorateId).toBe('الرجاء اختيار المحافظة');
      expect(result.errors.wilayaId).toBe('الرجاء اختيار الولاية');
      expect(result.errors.contactPhone).toBe('الرجاء إدخال رقم الجوال');
    });

    it('passes when governorateId, wilayaId, and contactPhone are provided', () => {
      const result = validateStep5({
        ...mockDefaultData,
        governorateId: 1,
        wilayaId: 2,
        contactPhone: '96899999999',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('validateStep master function', () => {
    it('routes correctly per step number', () => {
      expect(validateStep(1, mockDefaultData).isValid).toBe(false);
      expect(validateStep(2, mockDefaultData).isValid).toBe(false);
      expect(validateStep(3, mockDefaultData).isValid).toBe(false);
      expect(validateStep(6, mockDefaultData).isValid).toBe(true);
    });
  });
});
