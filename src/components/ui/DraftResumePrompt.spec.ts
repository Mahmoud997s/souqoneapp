import { hasMeaningfulPartData, hasMeaningfulBusData, hasMeaningfulCarData, hasMeaningfulPostData, hasMeaningfulEquipmentData } from './DraftResumePrompt'
import { defaultPartFormData } from '../../store/partWizardStore'

describe('DraftResumePrompt Helper Functions', () => {
  describe('hasMeaningfulPartData', () => {
    it('returns false for completely empty/default state at step 1', () => {
      const state = {
        formData: { ...defaultPartFormData, title: '', images: [], description: '', price: null, partNumber: '' },
        currentStep: 1,
      }
      expect(hasMeaningfulPartData(state)).toBe(false)
    })

    it('returns true when currentStep > 1 even if fields are empty', () => {
      const state = {
        formData: { ...defaultPartFormData },
        currentStep: 2,
      }
      expect(hasMeaningfulPartData(state)).toBe(true)
    })

    it('returns true when title is provided', () => {
      const state = {
        formData: { ...defaultPartFormData, title: 'سفايف كامري أصلية' },
        currentStep: 1,
      }
      expect(hasMeaningfulPartData(state)).toBe(true)
    })

    it('returns true when images are added', () => {
      const state = {
        formData: { ...defaultPartFormData, images: [{ uri: 'file://img.jpg' }] },
        currentStep: 1,
      }
      expect(hasMeaningfulPartData(state)).toBe(true)
    })

    it('returns true when description is provided', () => {
      const state = {
        formData: { ...defaultPartFormData, description: 'حالة ممتازة' },
        currentStep: 1,
      }
      expect(hasMeaningfulPartData(state)).toBe(true)
    })

    it('returns true when price is provided', () => {
      const state = {
        formData: { ...defaultPartFormData, price: 45 },
        currentStep: 1,
      }
      expect(hasMeaningfulPartData(state)).toBe(true)
    })

    it('returns true when partNumber is provided', () => {
      const state = {
        formData: { ...defaultPartFormData, partNumber: '04465-33470' },
        currentStep: 1,
      }
      expect(hasMeaningfulPartData(state)).toBe(true)
    })

    it('returns false for null/undefined state', () => {
      expect(hasMeaningfulPartData(null)).toBe(false)
      expect(hasMeaningfulPartData(undefined)).toBe(false)
    })
  })

  describe('hasMeaningfulBusData', () => {
    const emptyBusData = {
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
    }

    it('returns false for completely empty/default state at step 1', () => {
      const state = {
        data: emptyBusData,
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(state)).toBe(false)
    })

    it('returns false when in editMode even with data', () => {
      const state = {
        data: { ...emptyBusData, title: 'حافلة تويوتا كوستر' },
        currentStep: 1,
        editMode: true,
      }
      expect(hasMeaningfulBusData(state)).toBe(false)
    })

    it('returns true when currentStep > 1', () => {
      const state = {
        data: emptyBusData,
        currentStep: 2,
        editMode: false,
      }
      expect(hasMeaningfulBusData(state)).toBe(true)
    })

    it('returns true when title is provided', () => {
      const state = {
        data: { ...emptyBusData, title: 'حافلة تويوتا كوستر 30 راكب' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(state)).toBe(true)
    })

    it('returns true when images are added', () => {
      const state = {
        data: { ...emptyBusData, images: [{ uri: 'file://bus.jpg' }] },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(state)).toBe(true)
    })

    it('returns true when make or model is provided', () => {
      const stateMake = {
        data: { ...emptyBusData, make: 'Toyota' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(stateMake)).toBe(true)

      const stateModel = {
        data: { ...emptyBusData, model: 'Coaster' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(stateModel)).toBe(true)
    })

    it('returns true when sale or rental prices are provided', () => {
      const statePrice = {
        data: { ...emptyBusData, price: '12000' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(statePrice)).toBe(true)

      const stateDaily = {
        data: { ...emptyBusData, dailyPrice: '35' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(stateDaily)).toBe(true)

      const stateMonthly = {
        data: { ...emptyBusData, monthlyPrice: '600' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(stateMonthly)).toBe(true)
    })

    it('returns true when contractClient is provided', () => {
      const stateContract = {
        data: { ...emptyBusData, contractClient: 'وزارة التربية والتعليم' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(stateContract)).toBe(true)
    })

    it('returns true when description is provided', () => {
      const stateDesc = {
        data: { ...emptyBusData, description: 'حافلة نظيفة جدا بحالة الوكالة' },
        currentStep: 1,
        editMode: false,
      }
      expect(hasMeaningfulBusData(stateDesc)).toBe(true)
    })

    it('returns false for null/undefined state or missing data', () => {
      expect(hasMeaningfulBusData(null)).toBe(false)
      expect(hasMeaningfulBusData(undefined)).toBe(false)
      expect(hasMeaningfulBusData({})).toBe(false)
    })
  })

  describe('hasMeaningfulEquipmentData', () => {
    const emptyEquipmentFormData = {
      title: '',
      description: '',
      equipmentType: '',
      listingType: 'EQUIPMENT_SALE',
      make: '',
      model: '',
      year: '',
      condition: 'USED',
      capacity: '',
      power: '',
      weight: '',
      hoursUsed: '',
      features: [],
      price: '',
      dailyPrice: '',
      monthlyPrice: '',
      isPriceNegotiable: false,
      withOperator: false,
      deliveryAvailable: false,
      budgetMin: '',
      budgetMax: '',
      rentalDuration: '',
      quantity: '1',
      siteDetails: '',
      governorateId: null,
      wilayaId: null,
      governorate: '',
      city: '',
      latitude: null,
      longitude: null,
      contactPhone: '',
      whatsapp: '',
      images: [],
      existingImages: [],
      removedImageIds: [],
      editMode: false,
      editListingId: undefined,
    }

    it('returns false for completely empty/default state at step 1', () => {
      const state = {
        formData: emptyEquipmentFormData,
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(false)
    })

    it('returns false when in editMode (formData.editMode or state.editMode) even with data', () => {
      const stateFormDataEdit = {
        formData: { ...emptyEquipmentFormData, title: 'حفار كوماتسو', editMode: true },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateFormDataEdit)).toBe(false)

      const stateRootEdit = {
        formData: { ...emptyEquipmentFormData, title: 'حفار كوماتسو' },
        currentStep: 1,
        editMode: true,
      }
      expect(hasMeaningfulEquipmentData(stateRootEdit)).toBe(false)
    })

    it('returns true when currentStep > 1', () => {
      const state = {
        formData: emptyEquipmentFormData,
        currentStep: 2,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(true)
    })

    it('returns true when ONLY title: "حفار كوماتسو" is present with all other fields empty', () => {
      const state = {
        formData: { ...emptyEquipmentFormData, title: 'حفار كوماتسو' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(true)
    })

    it('returns true when title is provided', () => {
      const state = {
        formData: { ...emptyEquipmentFormData, title: 'لودر كاتربيلر بحالة ممتازة' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(true)
    })

    it('returns true when equipmentType is provided', () => {
      const state = {
        formData: { ...emptyEquipmentFormData, equipmentType: 'EXCAVATOR' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(true)
    })

    it('returns true when images are added', () => {
      const state = {
        formData: { ...emptyEquipmentFormData, images: [{ uri: 'file://loader.jpg' }] },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(true)
    })

    it('returns true when make or model is provided', () => {
      const stateMake = {
        formData: { ...emptyEquipmentFormData, make: 'Komatsu' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateMake)).toBe(true)

      const stateModel = {
        formData: { ...emptyEquipmentFormData, model: 'PC200' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateModel)).toBe(true)
    })

    it('returns true when sale or rental prices or budgetMax are provided', () => {
      const statePrice = {
        formData: { ...emptyEquipmentFormData, price: '35000' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(statePrice)).toBe(true)

      const stateDaily = {
        formData: { ...emptyEquipmentFormData, dailyPrice: '50' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateDaily)).toBe(true)

      const stateMonthly = {
        formData: { ...emptyEquipmentFormData, monthlyPrice: '1200' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateMonthly)).toBe(true)

      const stateBudget = {
        formData: { ...emptyEquipmentFormData, budgetMax: '2000' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateBudget)).toBe(true)
    })

    it('returns true when location (governorateId or wilayaId) is provided', () => {
      const stateGov = {
        formData: { ...emptyEquipmentFormData, governorateId: 'gov-1' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateGov)).toBe(true)

      const stateWilaya = {
        formData: { ...emptyEquipmentFormData, wilayaId: 'wilaya-1' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateWilaya)).toBe(true)
    })

    it('returns true when features array is non-empty', () => {
      const state = {
        formData: { ...emptyEquipmentFormData, features: ['AIR_CONDITIONING', 'GPS'] },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(state)).toBe(true)
    })

    it('returns true when description is provided', () => {
      const stateDesc = {
        formData: { ...emptyEquipmentFormData, description: 'معدة جاهزة للعمل فورا' },
        currentStep: 1,
      }
      expect(hasMeaningfulEquipmentData(stateDesc)).toBe(true)
    })

    it('returns false for null/undefined state or missing formData', () => {
      expect(hasMeaningfulEquipmentData(null)).toBe(false)
      expect(hasMeaningfulEquipmentData(undefined)).toBe(false)
      expect(hasMeaningfulEquipmentData({})).toBe(false)
    })
  })
})

