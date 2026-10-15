import { normalizeOmaniPhoneDigits, isValidOmaniPhone } from './authValidation'
import { UpdateProfilePayload } from '../api/users'

export interface ProfileValidationInput {
  displayName: string
  phone: string
  bio: string
}

export interface ProfileOriginalData {
  displayName?: string | null
  phone?: string | null
  bio?: string | null
  governorateId?: number | null
  wilayaId?: number | null
  avatarUrl?: string | null
  avatar?: string | null
}

export interface ProfileValidationResult {
  isValid: boolean
  errors: {
    displayName?: string
    phone?: string
    bio?: string
  }
}

export interface ProfileFormPatchData {
  displayName: string
  phone: string
  bio: string
  governorateId: number | null
  wilayaId: number | null
  avatarAction: 'unchanged' | 'deleted' | 'uploaded'
  uploadedAvatarUrl?: string | null
}

/**
 * Validates profile edit input fields aligned with backend update-profile.dto:
 * - displayName: 2-50 chars, no '<' or '>'
 * - bio: max 500 chars
 * - phone: required, cannot be cleared. Only validated for Omani format if user changed it.
 */
export function validateProfileForm(
  input: ProfileValidationInput,
  original?: ProfileOriginalData | null
): ProfileValidationResult {
  const errors: {
    displayName?: string
    phone?: string
    bio?: string
  } = {}

  // 1. Display Name
  const trimmedName = (input.displayName || '').trim()
  if (!trimmedName) {
    errors.displayName = 'الاسم مطلوب'
  } else if (trimmedName.length < 2 || trimmedName.length > 50) {
    errors.displayName = 'الاسم يجب أن يكون بين 2 و 50 حرفاً'
  } else if (/[<>]/.test(trimmedName)) {
    errors.displayName = 'الاسم يحتوي على رموز غير مسموحة (< >)'
  }

  // 2. Bio
  const rawBio = input.bio || ''
  if (rawBio.length > 500) {
    errors.bio = 'النبذة يجب ألا تتجاوز 500 حرف'
  }

  // 3. Phone (Required & Cannot be deleted)
  const rawPhoneTrimmed = (input.phone || '').trim()
  if (!rawPhoneTrimmed) {
    errors.phone = 'رقم الهاتف مطلوب'
  } else {
    // Stored phone check: only validate format if user altered the phone after normalization
    const origPhoneClean = normalizeOmaniPhoneDigits(original?.phone)
    const currPhoneClean = normalizeOmaniPhoneDigits(rawPhoneTrimmed)
    const isPhoneChanged = currPhoneClean !== origPhoneClean

    if (isPhoneChanged) {
      if (!isValidOmaniPhone(rawPhoneTrimmed)) {
        errors.phone = 'رقم عماني غير صحيح (8 أرقام يبدأ بـ 9 أو 7)'
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Pure function to construct a minimal PATCH payload sending ONLY modified fields.
 * - bio: cleared sends null, changed sends trimmed text, unchanged omitted
 * - phone: sent only if changed, formatted as +968XXXXXXXX
 * - governorateId & wilayaId: sent together only if changed and both valid positive numbers (never null)
 * - avatarUrl: sent only if changed (new uploaded URL or null if deleted); never re-sends stored URL
 */
export function buildProfilePatch(
  original: ProfileOriginalData | null | undefined,
  form: ProfileFormPatchData
): UpdateProfilePayload {
  const patch: UpdateProfilePayload = {}

  // 1. Display Name
  const origName = (original?.displayName || '').trim()
  const currName = (form.displayName || '').trim()
  if (currName !== origName && currName.length > 0) {
    patch.displayName = currName
  }

  // 2. Phone: compared normalized; sent as +968XXXXXXXX when changed
  const origPhoneClean = normalizeOmaniPhoneDigits(original?.phone)
  const currPhoneClean = normalizeOmaniPhoneDigits(form.phone)
  if (currPhoneClean !== origPhoneClean && currPhoneClean.length > 0) {
    patch.phone = `+968${currPhoneClean}`
  }

  // 3. Bio
  const origBio = (original?.bio || '').trim()
  const currBio = (form.bio || '').trim()
  if (currBio !== origBio) {
    patch.bio = currBio.length > 0 ? currBio : null
  }

  // 4. Locations: sent together only if changed and both valid non-null positive numbers
  const origGov = original?.governorateId ?? null
  const origWil = original?.wilayaId ?? null
  const currGov = form.governorateId ?? null
  const currWil = form.wilayaId ?? null

  const locationChanged = currGov !== origGov || currWil !== origWil
  if (locationChanged && currGov !== null && currWil !== null && currGov > 0 && currWil > 0) {
    patch.governorateId = currGov
    patch.wilayaId = currWil
  }

  // 5. Avatar: sent only if changed
  if (form.avatarAction === 'deleted') {
    patch.avatarUrl = null
  } else if (form.avatarAction === 'uploaded' && form.uploadedAvatarUrl) {
    patch.avatarUrl = form.uploadedAvatarUrl
  }

  return patch
}

/**
 * Checks whether user has made any unsaved edits compared to the original stored profile.
 * Handles whitespace trimming, null vs empty consistency, and avatar state.
 */
export function hasProfileUnsavedChanges(
  original: ProfileOriginalData | null | undefined,
  current: {
    displayName: string
    phone: string
    bio: string
    governorateId: number | null
    wilayaId: number | null
    avatarAction: 'unchanged' | 'deleted' | 'uploaded'
  }
): boolean {
  if (!original) return false

  const origName = (original.displayName || '').trim()
  const currName = (current.displayName || '').trim()
  if (currName !== origName) return true

  const origPhoneClean = normalizeOmaniPhoneDigits(original.phone)
  const currPhoneClean = normalizeOmaniPhoneDigits(current.phone)
  if (currPhoneClean !== origPhoneClean) return true

  const origBio = (original.bio || '').trim()
  const currBio = (current.bio || '').trim()
  if (currBio !== origBio) return true

  const origGov = original.governorateId ?? null
  const currGov = current.governorateId ?? null
  if (currGov !== origGov) return true

  const origWil = original.wilayaId ?? null
  const currWil = current.wilayaId ?? null
  if (currWil !== origWil) return true

  if (current.avatarAction === 'deleted') {
    const origAvatar = original.avatarUrl || original.avatar || null
    if (origAvatar !== null) return true
  } else if (current.avatarAction === 'uploaded') {
    return true
  }

  return false
}

/**
 * Pure guard function to determine if profile save must be blocked
 * due to failed avatar upload.
 * Returns true if user selected a new avatar upload, but no valid URL was produced.
 */
export function shouldBlockForFailedAvatarUpload(
  avatarAction: 'unchanged' | 'deleted' | 'uploaded',
  uploadedAvatarUrl?: string | null
): boolean {
  return avatarAction === 'uploaded' && (!uploadedAvatarUrl || uploadedAvatarUrl.trim().length === 0)
}

