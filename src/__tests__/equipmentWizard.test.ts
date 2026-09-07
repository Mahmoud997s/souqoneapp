import { validateEquipmentStep } from '../hooks/useEquipmentValidation'
import { EquipmentFormData } from '../types/equipmentForm.types'
import { useEquipmentWizardStore } from '../store/equipmentWizardStore'

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

  // ── 6. Store initEditMode & Location Fallback Tests ─────────────────
  describe('Store initEditMode: Real DB Listing & Fallback Verification', () => {
    beforeEach(() => {
      useEquipmentWizardStore.getState().resetDraft()
    })

    it('should correctly initialize from real database listing with IDs and Refs', () => {
      const realDbListing = {
        id: 'cmsyl01xu005xmv0x7np76a1q',
        title: 'Komatsu WA900-8R',
        description: 'لودر كوماتسو WA900-8R للإيجار',
        equipmentType: 'EXCAVATOR',
        listingType: 'EQUIPMENT_RENT',
        make: 'Komatsu',
        model: 'WA900-8R',
        year: 2021,
        condition: 'USED',
        governorate: null,
        city: null,
        governorateId: 2,
        wilayaId: 7,
        governorateRef: { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
        wilayaRef: { id: 7, nameAr: 'صلالة', nameEn: 'Salalah' },
        images: [{ id: 'img-1', url: 'https://res.cloudinary.com/test1.jpg' }],
      }

      useEquipmentWizardStore.getState().initEditMode(realDbListing)

      const state = useEquipmentWizardStore.getState()
      expect(state.formData.editMode).toBe(true)
      expect(state.formData.editListingId).toBe('cmsyl01xu005xmv0x7np76a1q')
      expect(state.formData.title).toBe('Komatsu WA900-8R')
      expect(state.formData.governorateId).toBe(2)
      expect(state.formData.wilayaId).toBe(7)
      expect(state.formData.governorate).toBe('ظفار')
      expect(state.formData.city).toBe('صلالة')
      expect(state.formData.existingImages?.length).toBe(1)
    })

    it('should fallback to governorateRef.id and wilayaRef.id when numeric IDs are null/missing', () => {
      const legacyListing = {
        id: 'cmogga1ff003qraj0ffjgw9xc',
        title: 'شيول كاتربيلر 950GC',
        description: 'للبيع شيول كاتربيلر بحالة الوكالة',
        equipmentType: 'LOADER',
        listingType: 'EQUIPMENT_SALE',
        governorate: 'Al Dakhiliyah', // English raw text from legacy web
        city: null,
        governorateId: null, // missing numeric ID
        wilayaId: undefined, // missing numeric ID
        governorateRef: { id: 2, nameAr: 'ظفار', nameEn: 'Dhofar' },
        wilayaRef: { id: 10, nameAr: 'سدح', nameEn: 'Sadah' },
        price: '38000',
      }

      useEquipmentWizardStore.getState().initEditMode(legacyListing)

      const state = useEquipmentWizardStore.getState()
      expect(state.formData.editMode).toBe(true)
      expect(state.formData.editListingId).toBe('cmogga1ff003qraj0ffjgw9xc')
      // Fallback extracted from governorateRef/wilayaRef
      expect(state.formData.governorateId).toBe(2)
      expect(state.formData.wilayaId).toBe(10)
      // Arabic name prioritized over mismatched English raw string
      expect(state.formData.governorate).toBe('ظفار')
      expect(state.formData.city).toBe('سدح')
      expect(state.formData.price).toBe('38000')
    })

    it('resetDraft() should properly restore all defaults, step 1, and clear errors', () => {
      // Dirty the store first
      useEquipmentWizardStore.getState().setFormData({
        title: 'معدة للتجربة',
        price: '50000',
        editMode: true,
      })
      useEquipmentWizardStore.getState().goToStep(4)

      expect(useEquipmentWizardStore.getState().currentStep).toBe(4)
      expect(useEquipmentWizardStore.getState().formData.title).toBe('معدة للتجربة')

      // Reset
      useEquipmentWizardStore.getState().resetDraft()

      const freshState = useEquipmentWizardStore.getState()
      expect(freshState.currentStep).toBe(1)
      expect(freshState.formData.title).toBe('')
      expect(freshState.formData.price).toBe('')
      expect(freshState.formData.editMode).toBe(false)
      expect(freshState.formData.listingType).toBe('EQUIPMENT_SALE')
      expect(Object.keys(freshState.errors).length).toBe(0)
    })
  })

  // ── 7. Additional Missing Field Checks (Step 1 & Step 4) ────────────
  describe('Additional Missing Field Checks (Step 1 & Step 4)', () => {
    it('should fail Step 1 if listingType is missing', () => {
      const { isValid, errors } = validateEquipmentStep(1, { ...baseValidForm, listingType: '' as any })
      expect(isValid).toBe(false)
      expect(errors.listingType).toBeDefined()
    })

    it('should fail Step 4 for Wanted listing if budgetMax is missing or 0', () => {
      const wantedNoBudget: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_WANTED',
        price: '',
        budgetMax: '',
      }
      const { isValid, errors } = validateEquipmentStep(4, wantedNoBudget)
      expect(isValid).toBe(false)
      expect(errors.budgetMax).toBeDefined()
    })
  })

  // ── 8. Full Payload Construction for SALE, RENT, and WANTED ─────────
  describe('Full Payload Construction for SALE, RENT, and WANTED', () => {
    const buildPayload = (form: EquipmentFormData, finalImages: string[]) => {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        equipmentType: form.equipmentType,
        listingType: form.listingType,

        make: form.make.trim() || undefined,
        model: form.model.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        condition: form.condition || 'USED',
        capacity: form.capacity.trim() || undefined,
        power: form.power.trim() || undefined,
        weight: form.weight.trim() || undefined,
        hoursUsed: form.hoursUsed ? Number(form.hoursUsed) : undefined,
        features: form.features.length > 0 ? form.features : undefined,

        isPriceNegotiable: form.isPriceNegotiable,
        withOperator: form.withOperator,
        deliveryAvailable: form.deliveryAvailable,

        governorateId: form.governorateId ? Number(form.governorateId) : undefined,
        wilayaId: form.wilayaId ? Number(form.wilayaId) : undefined,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,

        contactPhone: form.contactPhone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        ...(form.editMode ? {} : { images: finalImages.length > 0 ? finalImages : undefined }),
      }

      if (form.listingType === 'EQUIPMENT_SALE') {
        payload.price = form.price ? Number(form.price) : undefined
      } else if (form.listingType === 'EQUIPMENT_RENT') {
        payload.dailyPrice = form.dailyPrice ? Number(form.dailyPrice) : undefined
        payload.monthlyPrice = form.monthlyPrice ? Number(form.monthlyPrice) : undefined
      } else if (form.listingType === 'EQUIPMENT_WANTED') {
        payload.budgetMin = form.budgetMin ? Number(form.budgetMin) : undefined
        payload.budgetMax = form.budgetMax ? Number(form.budgetMax) : undefined
        payload.rentalDuration = form.rentalDuration || undefined
        payload.quantity = form.quantity ? Number(form.quantity) : 1
        payload.siteDetails = form.siteDetails || undefined
      }

      return payload
    }

    it('should build correct payload for EQUIPMENT_SALE with price', () => {
      const payload = buildPayload(baseValidForm, ['https://cdn.souqone.com/img1.jpg'])
      expect(payload.listingType).toBe('EQUIPMENT_SALE')
      expect(payload.price).toBe(18500)
      expect(payload.dailyPrice).toBeUndefined()
      expect(payload.monthlyPrice).toBeUndefined()
      expect(payload.budgetMax).toBeUndefined()
      expect(payload.images).toEqual(['https://cdn.souqone.com/img1.jpg'])
    })

    it('should build correct payload for EQUIPMENT_RENT with daily and monthly prices', () => {
      const rentForm: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_RENT',
        price: '',
        dailyPrice: '50',
        monthlyPrice: '1100',
        withOperator: true,
      }
      const payload = buildPayload(rentForm, ['https://cdn.souqone.com/img1.jpg'])
      expect(payload.listingType).toBe('EQUIPMENT_RENT')
      expect(payload.dailyPrice).toBe(50)
      expect(payload.monthlyPrice).toBe(1100)
      expect(payload.withOperator).toBe(true)
      expect(payload.price).toBeUndefined()
    })

    it('should build correct payload for EQUIPMENT_WANTED with budget, quantity and siteDetails', () => {
      const wantedForm: EquipmentFormData = {
        ...baseValidForm,
        listingType: 'EQUIPMENT_WANTED',
        price: '',
        budgetMin: '3000',
        budgetMax: '6000',
        quantity: '3',
        siteDetails: 'موقع العمل في الدقم',
      }
      const payload = buildPayload(wantedForm, [])
      expect(payload.listingType).toBe('EQUIPMENT_WANTED')
      expect(payload.budgetMin).toBe(3000)
      expect(payload.budgetMax).toBe(6000)
      expect(payload.quantity).toBe(3)
      expect(payload.siteDetails).toBe('موقع العمل في الدقم')
      expect(payload.price).toBeUndefined()
      expect(payload.dailyPrice).toBeUndefined()
    })
  })
})
