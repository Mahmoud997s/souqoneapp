import { useAuthStore } from '../store/authStore'
import { promptProfilePhoneRequired } from './profilePhoneGuard'

/**
 * assertOwnerHasPhoneForEdit
 * Helper to ensure the listing owner has a verified phone number registered
 * in their profile before navigating to edit routes.
 * If the user's phone is missing, prompts them to add it and returns false.
 * Returns true if the phone is present.
 */
export function assertOwnerHasPhoneForEdit(): boolean {
  const user = useAuthStore.getState().user
  const phone = user?.phone?.trim()

  if (!phone) {
    promptProfilePhoneRequired()
    return false
  }

  return true
}
