import {
  isProfilePhoneRequiredError,
  promptProfilePhoneRequired,
  PROFILE_PHONE_REQUIRED_CODE,
  PROFILE_PHONE_REQUIRED_MESSAGE,
} from './profilePhoneGuard'
import { dialogService } from '../store/dialogStore'
import { router } from 'expo-router'

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn(),
  },
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}))

describe('profilePhoneGuard util', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isProfilePhoneRequiredError', () => {
    it('returns false for null/undefined or non-object', () => {
      expect(isProfilePhoneRequiredError(null)).toBe(false)
      expect(isProfilePhoneRequiredError(undefined)).toBe(false)
      expect(isProfilePhoneRequiredError('error')).toBe(false)
      expect(isProfilePhoneRequiredError({})).toBe(false)
    })

    it('matches error.response.data.code', () => {
      const err = { response: { data: { code: 'PROFILE_PHONE_REQUIRED' } } }
      expect(isProfilePhoneRequiredError(err)).toBe(true)
    })

    it('matches error.response.data.message.code', () => {
      const err = { response: { data: { message: { code: 'PROFILE_PHONE_REQUIRED' } } } }
      expect(isProfilePhoneRequiredError(err)).toBe(true)
    })

    it('matches error.response.data.message as string with code', () => {
      const err = { response: { data: { message: 'PROFILE_PHONE_REQUIRED' } } }
      expect(isProfilePhoneRequiredError(err)).toBe(true)
    })

    it('matches error.response.data.message as string with arabic message', () => {
      const err = {
        response: {
          data: {
            message: 'لازم تضيف رقم هاتفك في بروفايلك الأول عشان المشترين يقدروا يتواصلوا معاك',
          },
        },
      }
      expect(isProfilePhoneRequiredError(err)).toBe(true)
    })

    it('returns false for other error codes', () => {
      const err = { response: { data: { code: 'VALIDATION_FAILED', message: 'Something else' } } }
      expect(isProfilePhoneRequiredError(err)).toBe(false)
    })
  })

  describe('promptProfilePhoneRequired', () => {
    it('calls dialogService.confirm with correct Arabic text and navigation callback', () => {
      promptProfilePhoneRequired()

      expect(dialogService.confirm).toHaveBeenCalledTimes(1)
      const [title, message, onConfirm, confirmText, cancelText] = (dialogService.confirm as jest.Mock).mock.calls[0]
      expect(title).toBe('إضافة رقم الهاتف مطلوبة')
      expect(message).toBe(PROFILE_PHONE_REQUIRED_MESSAGE)
      expect(confirmText).toBe('أضف رقمك')
      expect(cancelText).toBe('إلغاء')

      // Execute confirmation callback
      onConfirm()
      expect(router.push).toHaveBeenCalledWith('/profile/edit-profile')
    })
  })
})
