import { QueryClient } from '@tanstack/react-query'
import {
  buildCarListingPayload,
  validateAllCarStepsBeforeSubmit,
  extractImageUrlsFromCarFormData,
} from '../../utils/cars/carWizardSubmitHelpers'
import { invalidateCarListingQueries } from '../../utils/listing-detail/queryKeys'
import { invalidateBusListingQueries } from '../../utils/listing-detail/busQueryKeys'
import { invalidateEquipmentListingQueries } from '../../utils/listing-detail/equipmentQueryKeys'
import { invalidateOperatorListingQueries } from '../../utils/listing-detail/operatorQueryKeys'
import { invalidatePartListingQueries } from '../../screens/parts/hooks/partQueryKeys'
import { invalidateServiceListingQueries } from '../../screens/services/hooks/serviceQueryKeys'
import { CarFormData } from '../../types/carForm.types'

describe('Phase 6 Cars & Parts Types & Domain Invalidation (D-288 / P6-1)', () => {
  const baseFormData: CarFormData = {
    title: 'تويوتا كامري 2022',
    description: 'سيارة بحالة ممتازة وخالية من الحوادث',
    listingType: 'SALE',
    condition: 'USED',
    year: '2022',
    price: '7500',
    mileage: '45000',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    bodyType: 'SEDAN',
    exteriorColor: 'WHITE',
    interior: 'BEIGE',
    engineSize: '2.5L',
    horsepower: '204',
    doors: '4',
    seats: '5',
    driveType: 'FWD',
    features: ['SUNROOF', 'CRUISE_CONTROL'],
    currency: 'OMR',
    isPriceNegotiable: true,
    dailyPrice: '',
    monthlyPrice: '',
    withDriver: false,
    depositAmount: '',
    minRentalDays: '',
    kmLimitPerDay: '',
    cancellationPolicy: '',
    deliveryAvailable: false,
    insuranceIncluded: false,
    whatsappEnabled: true,
    governorateId: 1,
    wilayaId: 101,
    latitude: 23.588,
    longitude: 58.3829,
    brandId: 'brand-toyota',
    carModelId: 'model-camry',
    carTrimId: 'trim-le',
    make: 'تويوتا',
    model: 'كامري',
    trim: 'LE',
    images: [{ uri: 'file://local-image-1.jpg' }],
    existingImages: [{ id: 'img-1', url: 'https://cdn.souqone.com/car1.jpg' }],
    removedImageIds: [],
  }

  describe('Part A: carWizardSubmitHelpers pure logic', () => {
    it('extracts image URLs reliably from existingImages', () => {
      const urls = extractImageUrlsFromCarFormData([
        'https://cdn.souqone.com/img1.jpg',
        { url: 'https://cdn.souqone.com/img2.jpg' },
        { uri: 'https://cdn.souqone.com/img3.jpg' },
      ])
      expect(urls).toEqual([
        'https://cdn.souqone.com/img1.jpg',
        'https://cdn.souqone.com/img2.jpg',
        'https://cdn.souqone.com/img3.jpg',
      ])
    })

    it('returns empty array if existingImages is empty or undefined', () => {
      expect(extractImageUrlsFromCarFormData(undefined)).toEqual([])
      expect(extractImageUrlsFromCarFormData([])).toEqual([])
    })

    it('validates all steps and passes valid form data', () => {
      const res = validateAllCarStepsBeforeSubmit(baseFormData)
      expect(res.isValid).toBe(true)
      expect(res.invalidStep).toBeNull()
      expect(res.errors).toEqual({})
    })

    it('catches missing title in step 1', () => {
      const invalidData = { ...baseFormData, title: '' }
      const res = validateAllCarStepsBeforeSubmit(invalidData)
      expect(res.isValid).toBe(false)
      expect(res.invalidStep).toBe(1)
      expect(res.errors.title).toBeDefined()
    })

    it('catches missing images for SALE listing in step 2', () => {
      const invalidData: CarFormData = {
        ...baseFormData,
        images: [],
        existingImages: [],
      }
      const res = validateAllCarStepsBeforeSubmit(invalidData)
      expect(res.isValid).toBe(false)
      expect(res.invalidStep).toBe(2)
      expect(res.errors.images).toBeDefined()
    })

    it('allows WANTED listing without images', () => {
      const wantedData: CarFormData = {
        ...baseFormData,
        listingType: 'WANTED',
        images: [],
        existingImages: [],
      }
      const res = validateAllCarStepsBeforeSubmit(wantedData)
      expect(res.isValid).toBe(true)
      expect(res.invalidStep).toBeNull()
    })

    it('builds correct SALE payload with numeric conversions and trimmed fields', () => {
      const payload = buildCarListingPayload(baseFormData, ['https://cdn.souqone.com/car1.jpg'])
      expect(payload.title).toBe('تويوتا كامري 2022')
      expect(payload.listingType).toBe('SALE')
      expect(payload.price).toBe(7500)
      expect(payload.mileage).toBe(45000)
      expect(payload.year).toBe(2022)
      expect(payload.horsepower).toBe(204)
      expect(payload.doors).toBe(4)
      expect(payload.seats).toBe(5)
      expect(payload.images).toEqual(['https://cdn.souqone.com/car1.jpg'])
    })

    it('builds correct RENTAL payload setting price to 0 and preserving rental terms', () => {
      const rentalData: CarFormData = {
        ...baseFormData,
        listingType: 'RENTAL',
        dailyPrice: '25',
        monthlyPrice: '600',
        withDriver: true,
        depositAmount: '100',
        minRentalDays: '2',
        kmLimitPerDay: '300',
        cancellationPolicy: 'FREE_24H',
        deliveryAvailable: true,
        insuranceIncluded: true,
      }
      const payload = buildCarListingPayload(rentalData, ['https://cdn.souqone.com/car1.jpg'])
      expect(payload.listingType).toBe('RENTAL')
      expect(payload.price).toBe(0)
      expect(payload.dailyPrice).toBe(25)
      expect(payload.monthlyPrice).toBe(600)
      expect(payload.withDriver).toBe(true)
      expect(payload.depositAmount).toBe(100)
      expect(payload.minRentalDays).toBe(2)
      expect(payload.kmLimitPerDay).toBe(300)
      expect(payload.deliveryAvailable).toBe(true)
      expect(payload.insuranceIncluded).toBe(true)
    })
  })

  describe('Part C: Domain Invalidation Verification (A-034 Domain Ownership)', () => {
    let queryClient: QueryClient
    let invalidateSpy: jest.SpyInstance

    beforeEach(() => {
      queryClient = new QueryClient()
      invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
    })

    it('verifies car domain invalidation prefixes', async () => {
      await invalidateCarListingQueries(queryClient, 'car-123')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listing', 'car-123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['car-listings-infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['car-listings'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-cars'] })
    })

    it('verifies part domain invalidation prefixes', async () => {
      await invalidatePartListingQueries(queryClient, 'part-456')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts-detail', 'part-456'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts-item', 'part-456'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts-infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-parts'] })
    })

    it('verifies service domain invalidation prefixes', async () => {
      await invalidateServiceListingQueries(queryClient, 'service-789')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services-infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-services'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services-detail', 'service-789'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['service', 'service-789'] })
    })

    it('verifies equipment domain invalidation prefixes', async () => {
      await invalidateEquipmentListingQueries(queryClient, 'eq-101')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-detail', 'eq-101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-item', 'eq-101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-equipment'] })
    })

    it('verifies bus domain invalidation prefixes', async () => {
      await invalidateBusListingQueries(queryClient, 'bus-202')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bus-detail', 'bus-202'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bus', 'bus-202'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['buses'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['buses_infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-buses'] })
    })

    it('verifies operator domain invalidation prefixes', async () => {
      await invalidateOperatorListingQueries(queryClient, 'op-303')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operator-detail', 'op-303'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operator-item', 'op-303'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'op-303'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operators'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operators-infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-operators'] })
    })
  })
})
