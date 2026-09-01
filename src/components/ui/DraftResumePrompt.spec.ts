import { hasMeaningfulPartData, hasMeaningfulCarData, hasMeaningfulPostData } from './DraftResumePrompt'
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
})
