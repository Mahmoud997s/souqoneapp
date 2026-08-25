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
