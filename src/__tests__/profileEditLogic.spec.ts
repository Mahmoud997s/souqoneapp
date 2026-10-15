import {
  validateProfileForm,
  buildProfilePatch,
  hasProfileUnsavedChanges,
  shouldBlockForFailedAvatarUpload,
  ProfileOriginalData,
} from '../utils/profileValidation'

describe('Profile Edit Logic & Validation Suite', () => {
  const baseOriginal: ProfileOriginalData = {
    displayName: 'محمود أحمد',
    phone: '91234567',
    bio: 'نبذة شخصية قديمة',
    governorateId: 1,
    wilayaId: 10,
    avatarUrl: 'https://example.com/avatar.jpg',
  }

  /* ─────────────────────────────────────────────────────────────
   * 1. validateProfileForm
   * ───────────────────────────────────────────────────────────── */
  describe('1. validateProfileForm', () => {
    it('passes for a valid complete profile input', () => {
      const res = validateProfileForm(
        {
          displayName: 'سعيد العماني',
          phone: '91234567',
          bio: 'تاجر سيارات ومعدات',
        },
        baseOriginal
      )
      expect(res.isValid).toBe(true)
      expect(res.errors).toEqual({})
    })

    describe('Display Name validation', () => {
      it('fails when displayName is empty', () => {
        const res = validateProfileForm(
          { displayName: '   ', phone: '91234567', bio: '' },
          baseOriginal
        )
        expect(res.isValid).toBe(false)
        expect(res.errors.displayName).toBe('الاسم مطلوب')
      })

      it('fails when displayName is shorter than 2 characters', () => {
        const res = validateProfileForm(
          { displayName: 'أ', phone: '91234567', bio: '' },
          baseOriginal
        )
        expect(res.isValid).toBe(false)
        expect(res.errors.displayName).toBe('الاسم يجب أن يكون بين 2 و 50 حرفاً')
      })

      it('fails when displayName is longer than 50 characters', () => {
        const longName = 'أ'.repeat(51)
        const res = validateProfileForm(
          { displayName: longName, phone: '91234567', bio: '' },
          baseOriginal
        )
        expect(res.isValid).toBe(false)
        expect(res.errors.displayName).toBe('الاسم يجب أن يكون بين 2 و 50 حرفاً')
      })

      it('fails when displayName contains "<" or ">"', () => {
        const resWithTag = validateProfileForm(
          { displayName: 'محمود <script>', phone: '91234567', bio: '' },
          baseOriginal
        )
        expect(resWithTag.isValid).toBe(false)
        expect(resWithTag.errors.displayName).toBe('الاسم يحتوي على رموز غير مسموحة (< >)')
      })
    })

    describe('Bio validation', () => {
      it('passes when bio is empty or under 500 characters', () => {
        const res = validateProfileForm(
          { displayName: 'سالم', phone: '91234567', bio: 'أ'.repeat(500) },
          baseOriginal
        )
        expect(res.isValid).toBe(true)
        expect(res.errors.bio).toBeUndefined()
      })

      it('fails when bio exceeds 500 characters', () => {
        const res = validateProfileForm(
          { displayName: 'سالم', phone: '91234567', bio: 'أ'.repeat(501) },
          baseOriginal
        )
        expect(res.isValid).toBe(false)
        expect(res.errors.bio).toBe('النبذة يجب ألا تتجاوز 500 حرف')
      })
    })

    describe('Phone validation & legacy preservation', () => {
      it('fails when phone is empty (phone is required and cannot be deleted)', () => {
        const res = validateProfileForm(
          { displayName: 'سالم', phone: '   ', bio: '' },
          baseOriginal
        )
        expect(res.isValid).toBe(false)
        expect(res.errors.phone).toBe('رقم الهاتف مطلوب')
      })

      it('preserves unchanged legacy stored phone without blocking other edits', () => {
        const legacyOriginal: ProfileOriginalData = {
          displayName: 'قديم',
          phone: '+968 12345678', // Non-standard legacy number in DB
          bio: 'قديم',
        }
        // User only updates displayName, leaves legacy phone untouched
        const res = validateProfileForm(
          { displayName: 'اسم جديد صالح', phone: '+968 12345678', bio: 'قديم' },
          legacyOriginal
        )
        expect(res.isValid).toBe(true)
        expect(res.errors.phone).toBeUndefined()
      })

      it('rejects an invalid Omani phone when the user altered the phone', () => {
        const res = validateProfileForm(
          { displayName: 'سالم', phone: '12345678', bio: '' },
          baseOriginal
        )
        expect(res.isValid).toBe(false)
        expect(res.errors.phone).toBe('رقم عماني غير صحيح (8 أرقام يبدأ بـ 9 أو 7)')
      })

      it('accepts a valid Omani phone starting with 7 or 9 (including Arabic-Indic digits)', () => {
        const res9 = validateProfileForm(
          { displayName: 'سالم', phone: '99887766', bio: '' },
          baseOriginal
        )
        expect(res9.isValid).toBe(true)

        const res7 = validateProfileForm(
          { displayName: 'سالم', phone: '71234567', bio: '' },
          baseOriginal
        )
        expect(res7.isValid).toBe(true)

        const resArabic = validateProfileForm(
          { displayName: 'سالم', phone: '٩٩٨٨٧٧٦٦', bio: '' },
          baseOriginal
        )
        expect(resArabic.isValid).toBe(true)
      })
    })
  })

  /* ─────────────────────────────────────────────────────────────
   * 2. buildProfilePatch
   * ───────────────────────────────────────────────────────────── */
  describe('2. buildProfilePatch', () => {
    it('sends null when bio is explicitly cleared', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: '   ', // Cleared by user
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })

      expect(patch.bio).toBeNull()
      expect(patch.displayName).toBeUndefined()
      expect(patch.phone).toBeUndefined()
      expect(patch.avatarUrl).toBeUndefined()
    })

    it('sends trimmed text when bio is updated', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: '   نبذة جديدة ومميزة   ',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })

      expect(patch.bio).toBe('نبذة جديدة ومميزة')
    })

    it('does NOT send phone or avatarUrl when they are untouched', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود الجديد',
        phone: '91234567', // Untouched
        bio: 'نبذة شخصية قديمة', // Untouched
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged', // Untouched
      })

      expect(patch.displayName).toBe('محمود الجديد')
      expect(patch.phone).toBeUndefined()
      expect(patch.avatarUrl).toBeUndefined()
      expect(patch.bio).toBeUndefined()
      expect(patch.governorateId).toBeUndefined()
      expect(patch.wilayaId).toBeUndefined()
    })

    it('sends +968 followed by 8 digits when phone is changed', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '٩٩١١٢٢٣٣',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })

      expect(patch.phone).toBe('+96899112233')
    })

    it('does NOT send phone in patch when stored phone is +96891234567 and form phone is 91234567 (unchanged)', () => {
      const originalWithPlus: ProfileOriginalData = {
        ...baseOriginal,
        phone: '+96891234567',
      }
      const patch = buildProfilePatch(originalWithPlus, {
        displayName: 'محمود الجديد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })

      expect(patch.displayName).toBe('محمود الجديد')
      expect(patch.phone).toBeUndefined()
    })

    it('does NOT send phone in patch when stored phone is 8-digits 91234567 and form phone is 91234567 (unchanged)', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود الجديد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })

      expect(patch.displayName).toBe('محمود الجديد')
      expect(patch.phone).toBeUndefined()
    })

    it('does NOT send phone in patch when legacy non-standard phone is unchanged', () => {
      const legacyOriginal: ProfileOriginalData = {
        ...baseOriginal,
        phone: '12345',
      }
      const patch = buildProfilePatch(legacyOriginal, {
        displayName: 'محمود الجديد',
        phone: '12345',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })

      expect(patch.displayName).toBe('محمود الجديد')
      expect(patch.phone).toBeUndefined()
    })

    it('sends null for avatarUrl when avatar is deleted', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'deleted',
      })

      expect(patch.avatarUrl).toBeNull()
    })

    it('sends new uploaded URL when avatar is uploaded', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'uploaded',
        uploadedAvatarUrl: 'https://cdn.souqone.om/uploads/new_avatar.jpg',
      })

      expect(patch.avatarUrl).toBe('https://cdn.souqone.om/uploads/new_avatar.jpg')
    })

    describe('Avatar handling (3 states: new, deleted, unchanged)', () => {
      it('State 1 - New image uploaded: sends newly uploaded URL and does not re-send old URL', () => {
        const patch = buildProfilePatch(baseOriginal, {
          displayName: 'محمود أحمد',
          phone: '91234567',
          bio: 'نبذة شخصية قديمة',
          governorateId: 1,
          wilayaId: 10,
          avatarAction: 'uploaded',
          uploadedAvatarUrl: 'https://cdn.souqone.om/uploads/new_avatar.jpg',
        })
        expect(patch.avatarUrl).toBe('https://cdn.souqone.om/uploads/new_avatar.jpg')
      })

      it('State 2 - Deleted image: sends null to clear avatar from backend database', () => {
        const patch = buildProfilePatch(baseOriginal, {
          displayName: 'محمود أحمد',
          phone: '91234567',
          bio: 'نبذة شخصية قديمة',
          governorateId: 1,
          wilayaId: 10,
          avatarAction: 'deleted',
        })
        expect(patch.avatarUrl).toBeNull()
      })

      it('State 3 - Unchanged image: completely omits avatarUrl to protect Google users and avoid redundant writes', () => {
        const patch = buildProfilePatch(baseOriginal, {
          displayName: 'محمود أحمد (تعديل الاسم فقط)',
          phone: '91234567',
          bio: 'نبذة شخصية قديمة',
          governorateId: 1,
          wilayaId: 10,
          avatarAction: 'unchanged',
        })
        expect(patch.avatarUrl).toBeUndefined()
        expect('avatarUrl' in patch).toBe(false)
      })
    })

    it('sends governorateId and wilayaId together when location is updated with valid numbers', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 2,
        wilayaId: 15,
        avatarAction: 'unchanged',
      })

      expect(patch.governorateId).toBe(2)
      expect(patch.wilayaId).toBe(15)
    })

    it('does NOT send partial or null location IDs when one is missing', () => {
      const patch = buildProfilePatch(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 2,
        wilayaId: null, // Wilaya not selected
        avatarAction: 'unchanged',
      })

      expect(patch.governorateId).toBeUndefined()
      expect(patch.wilayaId).toBeUndefined()
    })
  })

  /* ─────────────────────────────────────────────────────────────
   * 3. hasProfileUnsavedChanges
   * ───────────────────────────────────────────────────────────── */
  describe('3. hasProfileUnsavedChanges', () => {
    it('returns false when current values match original', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(false)
    })

    it('returns false when differences are only leading/trailing whitespace', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: '  محمود أحمد  ',
        phone: '  91234567  ',
        bio: '  نبذة شخصية قديمة  ',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(false)
    })

    it('returns true when displayName is edited', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود مصطفى',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(true)
    })

    it('returns true when phone is edited', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '99887766',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(true)
    })

    it('returns true when bio is cleared', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: '',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(true)
    })

    it('returns true when location changes', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 3,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(true)
    })

    it('returns false when stored phone has +968 prefix and form phone is 8 digits without prefix', () => {
      const originalWithPlus: ProfileOriginalData = {
        ...baseOriginal,
        phone: '+96891234567',
      }
      const changed = hasProfileUnsavedChanges(originalWithPlus, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(false)
    })

    it('returns false when stored phone is 8 digits and form phone matches', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(false)
    })

    it('returns false when legacy non-standard phone is untouched', () => {
      const legacyOriginal: ProfileOriginalData = {
        ...baseOriginal,
        phone: '12345',
      }
      const changed = hasProfileUnsavedChanges(legacyOriginal, {
        displayName: 'محمود أحمد',
        phone: '12345',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'unchanged',
      })
      expect(changed).toBe(false)
    })

    it('returns true when avatarAction is "deleted"', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'deleted',
      })
      expect(changed).toBe(true)
    })

    it('returns true when avatarAction is "uploaded"', () => {
      const changed = hasProfileUnsavedChanges(baseOriginal, {
        displayName: 'محمود أحمد',
        phone: '91234567',
        bio: 'نبذة شخصية قديمة',
        governorateId: 1,
        wilayaId: 10,
        avatarAction: 'uploaded',
      })
      expect(changed).toBe(true)
    })
  })

  /* ─────────────────────────────────────────────────────────────
   * 4. shouldBlockForFailedAvatarUpload
   * ───────────────────────────────────────────────────────────── */
  describe('4. shouldBlockForFailedAvatarUpload', () => {
    it('returns true when avatarAction is "uploaded" and uploadedAvatarUrl is null, undefined, or empty', () => {
      expect(shouldBlockForFailedAvatarUpload('uploaded', null)).toBe(true)
      expect(shouldBlockForFailedAvatarUpload('uploaded', undefined)).toBe(true)
      expect(shouldBlockForFailedAvatarUpload('uploaded', '')).toBe(true)
      expect(shouldBlockForFailedAvatarUpload('uploaded', '   ')).toBe(true)
    })

    it('returns false when avatarAction is "uploaded" and a valid uploadedAvatarUrl is provided', () => {
      expect(
        shouldBlockForFailedAvatarUpload('uploaded', 'https://cdn.souqone.om/uploads/avatar.jpg')
      ).toBe(false)
    })

    it('returns false when avatarAction is "unchanged" even if url is null', () => {
      expect(shouldBlockForFailedAvatarUpload('unchanged', null)).toBe(false)
      expect(shouldBlockForFailedAvatarUpload('unchanged', undefined)).toBe(false)
    })

    it('returns false when avatarAction is "deleted" even if url is null', () => {
      expect(shouldBlockForFailedAvatarUpload('deleted', null)).toBe(false)
      expect(shouldBlockForFailedAvatarUpload('deleted', undefined)).toBe(false)
    })
  })
})
