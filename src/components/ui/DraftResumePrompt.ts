import { dialogService } from '../../store/dialogStore'

/**
 * Checks if a draft exists with meaningful data and prompts the user to resume or discard it.
 * Designed to be reusable across vertical stores (Cars, Equipment, Operators, etc).
 */
export function showDraftResumePrompt(config: {
  onResume: () => void
  onDiscard: () => void
}) {
  dialogService.show({
    type: 'confirm',
    title: 'استكمال المسودة',
    message: 'يبدو أن لديك إعلان غير مكتمل سابقاً. هل تود استكمال البيانات أم البدء من جديد؟',
    actions: [
      {
        text: 'البدء من جديد',
        style: 'destructive',
        onPress: config.onDiscard,
      },
      {
        text: 'استكمال الإعلان',
        style: 'default',
        onPress: config.onResume,
      },
    ],
  })
}

/**
 * Meaningful data definition for postStore (Cars, Parts, Services, Transport, Jobs, Buses)
 * A draft is meaningful if it has more than just the category selected.
 */
export function hasMeaningfulPostData(data: any): boolean {
  if (!data) return false
  
  // Check common generic fields
  if (data.title || data.price || data.description) {
    return true
  }

  // Check details object for vertical-specific fields
  const details = data.details || {}
  if (
    details.make || 
    details.model || 
    details.partCategory || 
    details.serviceType || 
    details.busType || 
    details.listingType
  ) {
    return true
  }

  return false
}

/**
 * Meaningful data definition for carWizardStore
 * A draft is meaningful if it has more than just empty strings in its core fields.
 */
export function hasMeaningfulCarData(state: any): boolean {
  if (!state || !state.formData) return false
  
  const data = state.formData
  if (data.title || data.price || data.description || data.brandId || data.model || (data.images && data.images.length > 0)) {
    return true
  }

  return false
}

export function navigateToCarForm(method: 'push' | 'replace' = 'push'): void {
  const { router } = require('expo-router')
  const { useAuthStore } = require('../../store/authStore')
  const { useCarWizardStore } = require('../../store/carWizardStore')

  if (!useAuthStore.getState().user) {
    method === 'replace' ? router.replace('/login') : router.push('/login')
    return
  }

  const state = useCarWizardStore.getState()
  if (state.isDraft && hasMeaningfulCarData(state)) {
    method === 'replace' ? router.replace('/cars/drafts') : router.push('/cars/drafts')
  } else {
    state.resetForm()
    method === 'replace' ? router.replace('/cars/new') : router.push('/cars/new')
  }
}

/**
 * Meaningful data definition for partWizardStore
 * A draft is meaningful if step > 1 or title is filled or images exist.
 */
export function hasMeaningfulPartData(state: any): boolean {
  if (!state || !state.formData) return false

  if (state.currentStep > 1) return true

  const data = state.formData
  if (
    (data.title && data.title.trim().length > 0) ||
    (data.images && data.images.length > 0) ||
    (data.description && data.description.trim().length > 0) ||
    data.price != null ||
    data.partNumber
  ) {
    return true
  }

  return false
}

export function navigateToPartForm(method: 'push' | 'replace' = 'push'): void {
  const { router } = require('expo-router')
  const { useAuthStore } = require('../../store/authStore')
  const { usePartWizardStore } = require('../../store/partWizardStore')

  if (!useAuthStore.getState().user) {
    method === 'replace' ? router.replace('/login') : router.push('/login')
    return
  }

  const state = usePartWizardStore.getState()
  if (hasMeaningfulPartData(state)) {
    method === 'replace' ? router.replace('/parts/drafts') : router.push('/parts/drafts')
  } else {
    state.reset()
    method === 'replace' ? router.replace('/parts/new') : router.push('/parts/new')
  }
}

/**
 * Meaningful data definition for serviceWizardStore
 * A draft is meaningful if step > 1 or title is filled or images exist or providerName / description / serviceType are filled.
 */
export function hasMeaningfulServiceData(state: any): boolean {
  if (!state || !state.formData) return false

  if (state.currentStep > 1) return true

  const data = state.formData
  if (
    (data.title && data.title.trim().length > 0) ||
    (data.images && data.images.length > 0) ||
    (data.description && data.description.trim().length > 0) ||
    (data.providerName && data.providerName.trim().length > 0) ||
    data.serviceType != null ||
    data.priceFrom != null
  ) {
    return true
  }

  return false
}

export function navigateToServiceForm(method: 'push' | 'replace' = 'push'): void {
  const { router } = require('expo-router')
  const { useAuthStore } = require('../../store/authStore')
  const { useServiceWizardStore } = require('../../store/serviceWizardStore')

  if (!useAuthStore.getState().user) {
    method === 'replace' ? router.replace('/login') : router.push('/login')
    return
  }

  const state = useServiceWizardStore.getState()
  if (hasMeaningfulServiceData(state)) {
    method === 'replace' ? router.replace('/services/drafts') : router.push('/services/drafts')
  } else {
    state.reset()
    method === 'replace' ? router.replace('/services/new') : router.push('/services/new')
  }
}

