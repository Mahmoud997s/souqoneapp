import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import ChangePasswordScreen from '../../../app/profile/change-password'
import {
  validateChangePasswordInput,
  mapChangePasswordBackendErrors,
  hasChangePasswordErrors,
} from '../../utils/changePasswordErrors'
import { usersApi } from '../../api/users'
import { dialogService } from '../../store/dialogStore'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}))

jest.mock('../../api/users', () => ({
  usersApi: {
    changePassword: jest.fn(),
  },
}))

jest.mock('../../utils/storeRotatedTokens', () => ({
  storeRotatedTokens: jest.fn(),
}))

describe('ChangePassword — Field Errors and S7 Integration (D-280 / R7-2)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateChangePasswordInput (Pure Logic)', () => {
    it('returns errors when all fields are empty', () => {
      const errors = validateChangePasswordInput({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      expect(errors.currentPassword).toBe('يرجى إدخال كلمة المرور الحالية')
      expect(errors.newPassword).toBe('يرجى إدخال كلمة المرور الجديدة')
      expect(errors.confirmPassword).toBe('يرجى تأكيد كلمة المرور الجديدة')
      expect(hasChangePasswordErrors(errors)).toBe(true)
    })

    it('enforces minimum length of 8 characters for new password', () => {
      const errors = validateChangePasswordInput({
        currentPassword: 'current-valid-pass',
        newPassword: 'Ab1',
        confirmPassword: 'Ab1',
      })

      expect(errors.currentPassword).toBeUndefined()
      expect(errors.newPassword).toBe('كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل')
    })

    it('enforces uppercase letter and digit in new password', () => {
      const errors = validateChangePasswordInput({
        currentPassword: 'current-valid-pass',
        newPassword: 'lowercasepassword',
        confirmPassword: 'lowercasepassword',
      })

      expect(errors.newPassword).toBe('كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل')
    })

    it('detects mismatch between new and confirm password', () => {
      const errors = validateChangePasswordInput({
        currentPassword: 'current-valid-pass',
        newPassword: 'ValidPassword1',
        confirmPassword: 'DifferentPassword2',
      })

      expect(errors.confirmPassword).toBe('كلمة المرور الجديدة غير متطابقة مع التأكيد')
    })

    it('returns empty object when input is fully valid', () => {
      const errors = validateChangePasswordInput({
        currentPassword: 'CurrentPassword123',
        newPassword: 'NewValidPassword1',
        confirmPassword: 'NewValidPassword1',
      })

      expect(errors.currentPassword).toBeUndefined()
      expect(errors.newPassword).toBeUndefined()
      expect(errors.confirmPassword).toBeUndefined()
      expect(hasChangePasswordErrors(errors)).toBe(false)
    })
  })

  describe('mapChangePasswordBackendErrors (S7 + 429 + Generic)', () => {
    it('maps S7 fieldErrors from backend HTTP 400 response', () => {
      const s7Error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: 'البيانات المدخلة غير صحيحة',
            fieldErrors: [
              { field: 'currentPassword', code: 'TOO_SHORT' },
              { field: 'newPassword', code: 'TOO_LONG' },
            ],
          },
        },
      }

      const { fieldErrors, generalMessage } = mapChangePasswordBackendErrors(s7Error)
      expect(fieldErrors.currentPassword).toBe('يرجى إدخال كلمة المرور الحالية')
      expect(fieldErrors.newPassword).toBe('كلمة المرور الجديدة يجب ألا تتجاوز ٧٢ حرفاً')
      expect(generalMessage).toBeUndefined()
    })

    it('maps 429 rate limit to generalMessage without leaking passwords', () => {
      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
            window: 'DAILY',
            limit: 5,
          },
        },
      }

      const { fieldErrors, generalMessage } = mapChangePasswordBackendErrors(rateLimitError)
      expect(fieldErrors.currentPassword).toBeUndefined()
      expect(fieldErrors.newPassword).toBeUndefined()
      expect(generalMessage).toContain('وصلت للحد اليومي')
    })

    it('maps network offline failure to generalMessage', () => {
      const networkError = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
      }

      const { generalMessage } = mapChangePasswordBackendErrors(networkError)
      expect(generalMessage).toContain('تعذر الاتصال بالإنترنت')
    })

    it('never leaks password values in returned error messages', () => {
      const secretPassword = 'MySuperSecretPassword99!'
      const errorWithSecret = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: `Invalid password: ${secretPassword}`,
            fieldErrors: [{ field: 'newPassword', code: 'INVALID_FORMAT' }],
          },
        },
      }

      const { fieldErrors, generalMessage } = mapChangePasswordBackendErrors(errorWithSecret)
      expect(JSON.stringify(fieldErrors)).not.toContain(secretPassword)
      expect(String(generalMessage)).not.toContain(secretPassword)
    })
  })

  describe('ChangePasswordScreen UI Integration', () => {
    it('displays inline validation errors under AppInput and clears on edit', async () => {
      const { getByTestId, queryByText, getByText } = await render(<ChangePasswordScreen />)

      const submitButton = getByTestId('change-password-submit-button')
      await act(async () => {
        fireEvent.press(submitButton)
      })

      await waitFor(() => {
        expect(getByText('يرجى إدخال كلمة المرور الحالية')).toBeTruthy()
        expect(getByText('يرجى إدخال كلمة المرور الجديدة')).toBeTruthy()
        expect(getByText('يرجى تأكيد كلمة المرور الجديدة')).toBeTruthy()
      })

      const currentInput = getByTestId('change-password-current-input')
      await act(async () => {
        fireEvent.changeText(currentInput, 'any-current')
      })

      await waitFor(() => {
        expect(queryByText('يرجى إدخال كلمة المرور الحالية')).toBeNull()
        expect(getByText('يرجى إدخال كلمة المرور الجديدة')).toBeTruthy()
      })
    })

    it('displays S7 backend field errors under the corresponding field on 400', async () => {
      ;(usersApi.changePassword as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: 'كلمة المرور الحالية غير صحيحة',
            fieldErrors: [{ field: 'currentPassword', code: 'INVALID_VALUE' }],
          },
        },
      })

      const { getByTestId, getByText } = await render(<ChangePasswordScreen />)

      await act(async () => {
        fireEvent.changeText(getByTestId('change-password-current-input'), 'WrongPass123')
        fireEvent.changeText(getByTestId('change-password-new-input'), 'ValidNewPass1')
        fireEvent.changeText(getByTestId('change-password-confirm-input'), 'ValidNewPass1')
      })

      await act(async () => {
        fireEvent.press(getByTestId('change-password-submit-button'))
      })

      await waitFor(() => {
        expect(getByText('كلمة المرور الحالية غير صحيحة')).toBeTruthy()
      })
    })

    it('shows alert on 429 rate limit error', async () => {
      ;(usersApi.changePassword as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
            window: 'DAILY',
            limit: 5,
          },
        },
      })

      const { getByTestId } = await render(<ChangePasswordScreen />)

      await act(async () => {
        fireEvent.changeText(getByTestId('change-password-current-input'), 'OldPass123')
        fireEvent.changeText(getByTestId('change-password-new-input'), 'NewPass123')
        fireEvent.changeText(getByTestId('change-password-confirm-input'), 'NewPass123')
      })

      await act(async () => {
        fireEvent.press(getByTestId('change-password-submit-button'))
      })

      await waitFor(() => {
        expect(dialogService.alert).toHaveBeenCalledWith(
          'خطأ',
          expect.stringContaining('وصلت للحد اليومي')
        )
      })
    })
  })
})
