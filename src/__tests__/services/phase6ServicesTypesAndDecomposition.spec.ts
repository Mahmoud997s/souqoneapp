import {
  buildServiceListingPayload,
  validateAllServiceStepsBeforeSubmit,
  extractImageUrlsFromServiceFormData,
} from '../../utils/services/serviceWizardSubmitHelpers'
import { ServiceFormData } from '../../store/serviceWizardStore'

describe('Phase 6 Services Types & Decomposition (D-291 / P6-4)', () => {
  const baseServiceFormData: ServiceFormData = {
    serviceType: 'MAINTENANCE',
    providerType: 'WORKSHOP',
    providerName: 'كراج النجوم الذهبية',
    images: [{ uri: 'file://local-service-1.jpg' }],
    existingImages: [{ id: 'srv-img-1', url: 'https://cdn.souqone.com/srv1.jpg' }],
    removedImageIds: [],
    title: 'صيانة وتصليح محركات متكاملة',
    description: 'فحص كمبيوتر وصيانة شاملة للسيارات الألمانية واليابانية بأحدث الأجهزة',
    specializations: ['ENGINE_REPAIR', 'ELECTRICAL_DIAGNOSTICS'],
    isHomeService: false,
    workingDays: ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
    workingHoursOpen: '08:00',
    workingHoursClose: '20:00',
    priceFrom: 20,
    priceTo: 150,
    currency: 'OMR',
    governorateId: 1,
    wilayaId: 101,
    governorateNameAr: 'مسقط',
    wilayaNameAr: 'السيب',
    address: 'المعبيلة الصناعية - شارع 10',
    latitude: 23.645,
    longitude: 58.123,
    whatsappEnabled: true,
    website: 'https://stars-garage.om',
  }

  describe('extractImageUrlsFromServiceFormData', () => {
    it('extracts urls from mixed string and object existing images', () => {
      const urls = extractImageUrlsFromServiceFormData([
        'https://cdn.souqone.com/direct.jpg',
        { url: 'https://cdn.souqone.com/obj-url.jpg' },
        { uri: 'https://cdn.souqone.com/obj-uri.jpg' },
      ])
      expect(urls).toEqual([
        'https://cdn.souqone.com/direct.jpg',
        'https://cdn.souqone.com/obj-url.jpg',
        'https://cdn.souqone.com/obj-uri.jpg',
      ])
    })

    it('returns empty array when images array is null or empty', () => {
      expect(extractImageUrlsFromServiceFormData(undefined)).toEqual([])
      expect(extractImageUrlsFromServiceFormData([])).toEqual([])
    })
  })

  describe('validateAllServiceStepsBeforeSubmit', () => {
    it('passes completely valid form data across all 5 steps', () => {
      const res = validateAllServiceStepsBeforeSubmit(baseServiceFormData)
      expect(res.isValid).toBe(true)
      expect(res.invalidStep).toBeNull()
      expect(res.errors).toEqual({})
    })

    it('catches missing serviceType in step 1', () => {
      const invalidData = { ...baseServiceFormData, serviceType: null }
      const res = validateAllServiceStepsBeforeSubmit(invalidData)
      expect(res.isValid).toBe(false)
      expect(res.invalidStep).toBe(1)
      expect(res.errors.serviceType).toBeDefined()
    })

    it('catches missing images in step 2', () => {
      const invalidData = {
        ...baseServiceFormData,
        images: [],
        existingImages: [],
      }
      const res = validateAllServiceStepsBeforeSubmit(invalidData)
      expect(res.isValid).toBe(false)
      expect(res.invalidStep).toBe(2)
      expect(res.errors.images).toBeDefined()
    })

    it('catches missing title in step 3', () => {
      const invalidData = { ...baseServiceFormData, title: '' }
      const res = validateAllServiceStepsBeforeSubmit(invalidData)
      expect(res.isValid).toBe(false)
      expect(res.invalidStep).toBe(3)
      expect(res.errors.title).toBeDefined()
    })

    it('catches missing priceFrom in step 5', () => {
      const invalidData = { ...baseServiceFormData, priceFrom: null }
      const res = validateAllServiceStepsBeforeSubmit(invalidData)
      expect(res.isValid).toBe(false)
      expect(res.invalidStep).toBe(5)
      expect(res.errors.priceFrom).toBeDefined()
    })
  })

  describe('buildServiceListingPayload', () => {
    it('builds clean service payload with numeric conversions, trimmed fields and preserves working hours', () => {
      const payload = buildServiceListingPayload(baseServiceFormData, [
        'https://cdn.souqone.com/srv1.jpg',
      ])

      expect(payload.title).toBe('صيانة وتصليح محركات متكاملة')
      expect(payload.serviceType).toBe('MAINTENANCE')
      expect(payload.providerType).toBe('WORKSHOP')
      expect(payload.providerName).toBe('كراج النجوم الذهبية')
      expect(payload.priceFrom).toBe(20)
      expect(payload.priceTo).toBe(150)
      expect(payload.governorateId).toBe(1)
      expect(payload.wilayaId).toBe(101)
      expect(payload.workingHoursOpen).toBe('08:00')
      expect(payload.workingHoursClose).toBe('20:00')
      expect(payload.workingDays).toEqual([
        'SATURDAY',
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
      ])
      expect(payload.images).toEqual(['https://cdn.souqone.com/srv1.jpg'])
    })

    it('handles edit mode resetting optional hours to null when cleared', () => {
      const editFormData: ServiceFormData = {
        ...baseServiceFormData,
        editMode: true,
        editListingId: 'srv-123',
        workingHoursOpen: null,
        workingHoursClose: null,
      }
      const payload = buildServiceListingPayload(editFormData, [])
      expect(payload.workingHoursOpen).toBeNull()
      expect(payload.workingHoursClose).toBeNull()
    })
  })
})
