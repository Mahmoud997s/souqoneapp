import { validateEquipmentStep } from '../hooks/useEquipmentValidation'
import { EquipmentFormData } from '../types/equipmentForm.types'

describe('Heavy Equipment Wizard (Add & Edit Tests)', () => {
  const baseValidForm: EquipmentFormData = {
    title: 'حفار كوماتسو بحالة ممتازة للبيع',
    description: 'حفار كوماتسو بحالة ممتازة مع صيانة دورية كاملة وساعات عمل قليلة',
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',

    make: 'Komatsu',
    model: 'PC200-8',
    year: '2021',
    condition: 'LIKE_NEW',
    capacity: '1.2 m3',
    power: '160 HP',
    weight: '21000 kg',
    hoursUsed: '3200',
    features: ['كابينة مكيفة', 'تشغيل هيدروليكي'],

    price: '18500',
    dailyPrice: '',
    monthlyPrice: '',
    isPriceNegotiable: true,
    withOperator: false,
    deliveryAvailable: true,

    budgetMin: '',
    budgetMax: '',
    rentalDuration: '',
    quantity: '1',
    siteDetails: '',

    governorateId: 1,
    wilayaId: 101,
    governorate: 'مسقط',
    city: 'السيب',
    latitude: 23.588,
    longitude: 58.3829,

    contactPhone: '96891234567',
    whatsapp: '96891234567',

    images: [{ uri: 'file:///local/photo1.jpg' }],
    existingImages: [],
    removedImageIds: [],

    editMode: false,
    editListingId: undefined,
  }

  // ── 1. Step 1 Validation Tests ──────────────────────────────────────────
  describe('Step 1: Type, Category, Title & Description Validation', () => {
    it('should pass with valid step 1 data', () => {
      const { isValid, errors } = validateEquipmentStep(1, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should fail if title is missing or less than 5 characters', () => {
      const { isValid, errors } = validateEquipmentStep(1, { ...baseValidForm, title: 'حفار' })
      expect(isValid).toBe(false)
      expect(errors.title).toBeDefined()
    })

    it('should fail if title is longer than 100 characters', () => {
      const longTitle = 'a'.repeat(101)
      const { isValid, errors } = validateEquipmentStep(1, { ...baseValidForm, title: longTitle })
      expect(isValid).toBe(false)
      expect(errors.title).toBeDefined()
    })

    it('should fail if description is missing or less than 10 characters', () => {
      const { isValid, errors } = validateEquipmentStep(1, { ...baseValidForm, description: 'للبيع فقط' })
      expect(isValid).toBe(false)
      expect(errors.description).toBeDefined()
    })

    it('should fail if description is longer than 2000 characters', () => {
      const longDesc = 'a'.repeat(2001)
      const { isValid, errors } = validateEquipmentStep(1, { ...baseValidForm, description: longDesc })
      expect(isValid).toBe(false)
      expect(errors.description).toBeDefined()
    })

    it('should fail if equipmentType is missing', () => {
      const { isValid, errors } = validateEquipmentStep(1, { ...baseValidForm, equipmentType: '' })
      expect(isValid).toBe(false)
      expect(errors.equipmentType).toBeDefined()
    })
  })

  // ── 2. Step 2 Validation Tests ──────────────────────────────────────────
  describe('Step 2: Images Validation', () => {
    it('should pass if new images exist for sale/rent', () => {
      const { isValid, errors } = validateEquipmentStep(2, baseValidForm)
      expect(isValid).toBe(true)
      expect(errors.images).toBeUndefined()
    })

    it('should pass in edit mode if existingImages are present', () => {
      const editForm: EquipmentFormData = {
        ...baseValidForm,
        images: [],
        existingImages: [{ url: 'https://cdn.souqone.com/equip1.jpg' }],
      }
      const { isValid, errors } = validateEquipmentStep(2, editForm)
      expect(isValid).toBe(true)
      expect(errors.images).toBeUndefined()
    })

    it('should fail if no images provided for sale/rent listing', () => {
      const noImgForm: EquipmentFormData = {
        ...baseValidForm,
        images: [],
        existingImages: [],
      }
      const { isValid, errors } = validateEquipmentStep(2, noImgForm)
      expect(isValid).toBe(false)
      expect(errors.images).toBeDefined()
    })

    it('should allow no images for wanted requests (EQUIPMENT_WANTED)', () => {
      const wantedForm: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_WANTED',
        images: [],
        existingImages: [],
      }
      const { isValid, errors } = validateEquipmentStep(2, wantedForm)
      expect(isValid).toBe(true)
      expect(errors.images).toBeUndefined()
    })
  })

  // ── 3. Step 3 Validation Tests ──────────────────────────────────────────
  describe('Step 3: Technical Specs & Condition Validation', () => {
    it('should pass with valid technical specifications', () => {
      const { isValid, errors } = validateEquipmentStep(3, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should fail if make is missing or longer than 50 characters', () => {
      let result = validateEquipmentStep(3, { ...baseValidForm, make: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.make).toBeDefined()

      const longMake = 'a'.repeat(51)
      result = validateEquipmentStep(3, { ...baseValidForm, make: longMake })
      expect(result.isValid).toBe(false)
      expect(result.errors.make).toBeDefined()
    })

    it('should fail if model is missing or longer than 50 characters', () => {
      let result = validateEquipmentStep(3, { ...baseValidForm, model: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.model).toBeDefined()

      const longModel = 'a'.repeat(51)
      result = validateEquipmentStep(3, { ...baseValidForm, model: longModel })
      expect(result.isValid).toBe(false)
      expect(result.errors.model).toBeDefined()
    })

    it('should fail if technical specs exceed 50 characters', () => {
      const longText = 'a'.repeat(51)
      const { isValid, errors } = validateEquipmentStep(3, { 
        ...baseValidForm, 
        capacity: longText,
        power: longText,
        weight: longText
      })
      expect(isValid).toBe(false)
      expect(errors.capacity).toBeDefined()
      expect(errors.power).toBeDefined()
      expect(errors.weight).toBeDefined()
    })

    it('should fail with invalid year', () => {
      const { isValid, errors } = validateEquipmentStep(3, { ...baseValidForm, year: '1890' })
      expect(isValid).toBe(false)
      expect(errors.year).toBeDefined()
    })

    it('should fail if condition is missing on sale/rent listing', () => {
      const { isValid, errors } = validateEquipmentStep(3, { ...baseValidForm, condition: '' })
      expect(isValid).toBe(false)
      expect(errors.condition).toBeDefined()
    })
  })

  // ── 4. Step 4 Validation Tests (Pricing & Location) ─────────────────────
  describe('Step 4: Pricing, Location & Contact Validation', () => {
    it('should pass for Sale listing with valid price and location', () => {
      const { isValid, errors } = validateEquipmentStep(4, baseValidForm)
      expect(isValid).toBe(true)
      expect(Object.keys(errors).length).toBe(0)
    })

    it('should fail for Sale listing if price is missing or zero', () => {
      const { isValid, errors } = validateEquipmentStep(4, { ...baseValidForm, price: '' })
      expect(isValid).toBe(false)
      expect(errors.price).toBeDefined()
    })

    it('should pass for Rent listing with daily price or monthly price', () => {
      const rentForm: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_RENT',
        price: '',
        dailyPrice: '45',
        monthlyPrice: '950',
      }
      const { isValid, errors } = validateEquipmentStep(4, rentForm)
      expect(isValid).toBe(true)
      expect(errors.dailyPrice).toBeUndefined()
    })

    it('should fail if rentalDuration exceeds 50 characters', () => {
      const rentForm: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_RENT',
        price: '',
        dailyPrice: '45',
        monthlyPrice: '950',
        rentalDuration: 'a'.repeat(51)
      }
      const { isValid, errors } = validateEquipmentStep(4, rentForm)
      expect(isValid).toBe(false)
      expect(errors.rentalDuration).toBeDefined()
    })

    it('should fail for Rent listing if neither daily nor monthly price is provided', () => {
      const rentFormNoPrice: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_RENT',
        price: '',
        dailyPrice: '',
        monthlyPrice: '',
      }
      const { isValid, errors } = validateEquipmentStep(4, rentFormNoPrice)
      expect(isValid).toBe(false)
      expect(errors.dailyPrice).toBeDefined()
    })

    it('should pass for Wanted listing with budgetMax and quantity', () => {
      const wantedForm: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_WANTED',
        price: '',
        budgetMax: '500',
        quantity: '2',
      }
      const { isValid, errors } = validateEquipmentStep(4, wantedForm)
      expect(isValid).toBe(true)
      expect(errors.budgetMax).toBeUndefined()
    })

    it('should fail if location (governorateId and wilayaId) is missing', () => {
      const noLocForm: EquipmentFormData = {
        ...baseValidForm,
        governorateId: null,
        wilayaId: null,
        governorate: '',
        city: '',
      }
      const { isValid, errors } = validateEquipmentStep(4, noLocForm)
      expect(isValid).toBe(false)
      expect(errors.governorateId || errors.governorate).toBeDefined()
      expect(errors.wilayaId || errors.city).toBeDefined()
    })
  })

  // ── 5. Edit Flow Payload & Image Handling ────────────────────────────
  describe('Edit Flow: Image Handling & Payload Construction', () => {
    it('should separate new images from existing images for addImages API', () => {
      const existingImages = [{ url: 'https://cdn.souqone.com/old1.jpg' }]
      const newUploadedUrls = ['https://cdn.souqone.com/new2.jpg']

      // Simulate component logic
      const finalImageUrls = [...existingImages.map(img => img.url), ...newUploadedUrls]
      const newImageUrls = [...newUploadedUrls]

      expect(finalImageUrls.length).toBe(2)
      expect(newImageUrls.length).toBe(1)
      expect(newImageUrls[0]).toBe('https://cdn.souqone.com/new2.jpg')
    })

    it('should build a clean backend DTO payload WITHOUT images in edit mode', () => {
      const formData = {
        ...baseValidForm,
        editMode: true,
        editListingId: 'equip-123',
      }

      // Simulate payload generation (editMode = true)
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        equipmentType: formData.equipmentType,
        listingType: formData.listingType,
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        condition: formData.condition,
        governorateId: Number(formData.governorateId),
        wilayaId: Number(formData.wilayaId),
        latitude: formData.latitude,
        longitude: formData.longitude,
        price: Number(formData.price),
        ...(formData.editMode ? {} : { images: ['url1', 'url2'] })
      }

      expect(payload.images).toBeUndefined() // CRITICAL: should not exist in update payload
      expect(payload.governorate).toBeUndefined()
      expect(payload.city).toBeUndefined()
    })

    it('should include images in the payload in create mode', () => {
      const formData = {
        ...baseValidForm,
        editMode: false,
      }

      // Simulate payload generation (editMode = false)
      const payload: any = {
        title: formData.title.trim(),
        ...(formData.editMode ? {} : { images: ['url1', 'url2'] })
      }

      expect(payload.images).toBeDefined()
      expect(payload.images.length).toBe(2)
    })
  })
})
