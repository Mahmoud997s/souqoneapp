import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import {
  isAppleAuthAvailable,
  generateAppleNonce,
  isAppleAuthCancelled,
  signInWithApple,
  performAppleReauth,
  AppleAuthError,
} from '../services/appleAuth'

describe('Apple Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Platform.OS = 'ios'
  })

  describe('generateAppleNonce (Protocol Verification & Known Vector)', () => {
    it('generates rawNonce and computes exact SHA-256 hex digest for Apple request', async () => {
      const knownRaw = 'souqone-apple-test-nonce-12345'
      // Expected SHA-256 hex lowercase:
      // echo -n "souqone-apple-test-nonce-12345" | sha256sum -> 2f8b2d1da2541cd5f29e0356c276185c33f0e80aceb74bc365ee1be4131b9909
      const expectedSha256 = '2f8b2d1da2541cd5f29e0356c276185c33f0e80aceb74bc365ee1be4131b9909'

      jest.spyOn(Crypto, 'randomUUID').mockReturnValue(knownRaw as any)

      const { rawNonce, hashedNonce } = await generateAppleNonce()

      expect(rawNonce).toBe(knownRaw)
      expect(hashedNonce).toBe(expectedSha256)
      // Must be 64-character lowercase hex string
      expect(hashedNonce).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('isAppleAuthAvailable', () => {
    it('returns true on iOS when native module is available', async () => {
      Platform.OS = 'ios'
      ;(AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true)

      const available = await isAppleAuthAvailable()
      expect(available).toBe(true)
      expect(AppleAuthentication.isAvailableAsync).toHaveBeenCalledTimes(1)
    })

    it('returns false on Android even if native check would return true', async () => {
      Platform.OS = 'android'
      const available = await isAppleAuthAvailable()
      expect(available).toBe(false)
      expect(AppleAuthentication.isAvailableAsync).not.toHaveBeenCalled()
    })

    it('returns false if native isAvailableAsync throws an error', async () => {
      Platform.OS = 'ios'
      ;(AppleAuthentication.isAvailableAsync as jest.Mock).mockRejectedValue(new Error('Simulator error'))

      const available = await isAppleAuthAvailable()
      expect(available).toBe(false)
    })
  })

  describe('isAppleAuthCancelled', () => {
    it('returns true for ERR_REQUEST_CANCELED', () => {
      expect(isAppleAuthCancelled({ code: 'ERR_REQUEST_CANCELED' })).toBe(true)
    })

    it('returns false for other error codes or null', () => {
      expect(isAppleAuthCancelled({ code: 'ERR_UNKNOWN' })).toBe(false)
      expect(isAppleAuthCancelled(new Error('Network error'))).toBe(false)
      expect(isAppleAuthCancelled(null)).toBe(false)
      expect(isAppleAuthCancelled(undefined)).toBe(false)
    })
  })

  describe('signInWithApple', () => {
    it('successfully initiates sign-in and formats AppleLoginPayload', async () => {
      const mockRawNonce = 'raw-uuid-nonce-abc-123'
      jest.spyOn(Crypto, 'randomUUID').mockReturnValue(mockRawNonce as any)

      ;(AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
        identityToken: 'mock.identity.jwt.token',
        authorizationCode: 'mock-authorization-code-xyz',
        fullName: {
          givenName: 'أحمد',
          familyName: 'المعولي',
        },
      })

      const payload = await signInWithApple()

      expect(payload).not.toBeNull()
      expect(payload).toEqual({
        identityToken: 'mock.identity.jwt.token',
        nonce: mockRawNonce, // raw nonce sent to backend
        fullName: {
          givenName: 'أحمد',
          familyName: 'المعولي',
        },
        authorizationCode: 'mock-authorization-code-xyz',
      })

      // Verify that Apple Native received the hashed nonce
      expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: expect.stringMatching(/^[a-f0-9]{64}$/),
        })
      )
    })

    it('handles silent cancellation by returning null without throwing', async () => {
      ;(AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({
        code: 'ERR_REQUEST_CANCELED',
        message: 'The user canceled the authorization attempt.',
      })

      const result = await signInWithApple()
      expect(result).toBeNull()
    })

    it('throws AppleAuthError when identityToken is missing from credentials', async () => {
      ;(AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
        identityToken: null,
      })

      await expect(signInWithApple()).rejects.toThrow(AppleAuthError)
      await expect(signInWithApple()).rejects.toThrow('لم يتم استلام رمز التحقق من Apple')
    })
  })

  describe('performAppleReauth', () => {
    it('returns complete credentials including authorizationCode for account deletion', async () => {
      const mockRawNonce = 'raw-reauth-nonce-789'
      jest.spyOn(Crypto, 'randomUUID').mockReturnValue(mockRawNonce as any)

      ;(AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
        identityToken: 'deletion.identity.jwt',
        authorizationCode: 'deletion-auth-code-apple',
      })

      const result = await performAppleReauth()

      expect(result).toEqual({
        appleIdentityToken: 'deletion.identity.jwt',
        appleNonce: mockRawNonce,
        appleAuthorizationCode: 'deletion-auth-code-apple',
      })
    })

    it('returns null on silent cancellation', async () => {
      ;(AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({
        code: 'ERR_REQUEST_CANCELED',
      })

      const result = await performAppleReauth()
      expect(result).toBeNull()
    })

    it('throws AppleAuthError if authorizationCode is missing (required for server token revocation)', async () => {
      ;(AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
        identityToken: 'deletion.identity.jwt',
        authorizationCode: null,
      })

      await expect(performAppleReauth()).rejects.toThrow(AppleAuthError)
      await expect(performAppleReauth()).rejects.toThrow('لم يتم استلام رمز التفويض من Apple لإلغاء الحساب')
    })
  })

  describe('AppleAuthError', () => {
    it('correctly sets error name and prototype', () => {
      const error = new AppleAuthError('رسالة خطأ تجريبية')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppleAuthError)
      expect(error.name).toBe('AppleAuthError')
      expect(error.message).toBe('رسالة خطأ تجريبية')
    })
  })
})
