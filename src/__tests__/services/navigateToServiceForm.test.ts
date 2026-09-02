import { hasMeaningfulServiceData, navigateToServiceForm } from '../../components/ui/DraftResumePrompt'
import { useServiceWizardStore } from '../../store/serviceWizardStore'
import { useAuthStore } from '../../store/authStore'
import { router } from 'expo-router'

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}))

describe('navigateToServiceForm & hasMeaningfulServiceData (Phase 7 Entry Points)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useServiceWizardStore.getState().reset()
    useAuthStore.setState({ user: null })
  })

  describe('hasMeaningfulServiceData', () => {
    it('returns false for fresh / default state with empty formData', () => {
      const state = useServiceWizardStore.getState()
      expect(hasMeaningfulServiceData(state)).toBe(false)
    })

    it('returns false for null or undefined state', () => {
      expect(hasMeaningfulServiceData(null)).toBe(false)
      expect(hasMeaningfulServiceData(undefined)).toBe(false)
      expect(hasMeaningfulServiceData({})).toBe(false)
    })

    it('returns true when currentStep is greater than 1', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        currentStep: 2,
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })

    it('returns true when title is filled', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        formData: {
          ...useServiceWizardStore.getState().formData,
          title: 'كراج صيانة ممتاز',
        },
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })

    it('returns true when providerName is filled', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        formData: {
          ...useServiceWizardStore.getState().formData,
          providerName: 'ورشة السلام',
        },
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })

    it('returns true when description is filled', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        formData: {
          ...useServiceWizardStore.getState().formData,
          description: 'نقدم خدمات فحص كمبيوتر وتغيير زيوت وفلاتر',
        },
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })

    it('returns true when images exist in draft', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        formData: {
          ...useServiceWizardStore.getState().formData,
          images: [{ uri: 'file:///local/photo.jpg' }],
        },
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })

    it('returns true when serviceType is selected', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        formData: {
          ...useServiceWizardStore.getState().formData,
          serviceType: 'MAINTENANCE',
        },
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })

    it('returns true when priceFrom is specified', () => {
      const state = {
        ...useServiceWizardStore.getState(),
        formData: {
          ...useServiceWizardStore.getState().formData,
          priceFrom: 20,
        },
      }
      expect(hasMeaningfulServiceData(state)).toBe(true)
    })
  })

  describe('navigateToServiceForm', () => {
    it('redirects to /login when user is not authenticated (push)', () => {
      useAuthStore.setState({ user: null })
      navigateToServiceForm('push')
      expect(router.push).toHaveBeenCalledWith('/login')
      expect(router.replace).not.toHaveBeenCalled()
    })

    it('redirects to /login when user is not authenticated (replace)', () => {
      useAuthStore.setState({ user: null })
      navigateToServiceForm('replace')
      expect(router.replace).toHaveBeenCalledWith('/login')
      expect(router.push).not.toHaveBeenCalled()
    })

    it('redirects to /services/drafts when user is logged in and has meaningful draft', () => {
      useAuthStore.setState({ user: { id: 'u1', email: 'test@example.com' } as any })
      useServiceWizardStore.getState().setField('title', 'خدمة برمجة مفاتيح')

      navigateToServiceForm('push')
      expect(router.push).toHaveBeenCalledWith('/services/drafts')
    })

    it('redirects to /services/drafts with replace when requested', () => {
      useAuthStore.setState({ user: { id: 'u1', email: 'test@example.com' } as any })
      useServiceWizardStore.getState().setField('providerName', 'كراج النور')

      navigateToServiceForm('replace')
      expect(router.replace).toHaveBeenCalledWith('/services/drafts')
    })

    it('resets store and redirects to /services/new when user is logged in and has no draft', () => {
      useAuthStore.setState({ user: { id: 'u1', email: 'test@example.com' } as any })
      useServiceWizardStore.getState().reset()

      navigateToServiceForm('push')
      expect(router.push).toHaveBeenCalledWith('/services/new')
      expect(useServiceWizardStore.getState().formData.title).toBe('')
      expect(useServiceWizardStore.getState().currentStep).toBe(1)
    })

    it('resets store and redirects to /services/new with replace when requested', () => {
      useAuthStore.setState({ user: { id: 'u1', email: 'test@example.com' } as any })
      useServiceWizardStore.getState().reset()

      navigateToServiceForm('replace')
      expect(router.replace).toHaveBeenCalledWith('/services/new')
    })
  })
})
