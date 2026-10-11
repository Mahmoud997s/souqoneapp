import * as SecureStore from 'expo-secure-store';
import {
  needsVerification,
  pickVerificationToken,
  resolveVerifiedSession,
} from '../utils/verificationFlow';
import { usePendingVerificationStore } from '../store/pendingVerificationStore';
import { isAuthExcludedUrl, apiClient } from '../api/client';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('AUTH-VERIFY-GATE Verification Flow Suite', () => {
  describe('1. needsVerification', () => {
    it('returns true when data.requiresVerification is true, even with tokens', () => {
      const data = {
        accessToken: 'legacy-acc',
        refreshToken: 'legacy-ref',
        requiresVerification: true,
        user: { id: '1', isVerified: false },
      };
      expect(needsVerification(data)).toBe(true);
    });

    it('returns true when data.user.isVerified is false, even if requiresVerification is missing', () => {
      const data = {
        accessToken: 'legacy-acc',
        refreshToken: 'legacy-ref',
        user: { id: '1', isVerified: false },
      };
      expect(needsVerification(data)).toBe(true);
    });

    it('returns true when data is new backend format (requiresVerification: true, verificationToken, no tokens)', () => {
      const data = {
        requiresVerification: true,
        verificationToken: 'v-token-123',
        emailSent: true,
        user: { email: 'user@example.com' },
      };
      expect(needsVerification(data)).toBe(true);
    });

    it('returns false when user is verified and requiresVerification is not true', () => {
      const data = {
        accessToken: 'valid-acc',
        refreshToken: 'valid-ref',
        user: { id: '1', isVerified: true },
      };
      expect(needsVerification(data)).toBe(false);
    });

    it('returns false for null or undefined input', () => {
      expect(needsVerification(null)).toBe(false);
      expect(needsVerification(undefined)).toBe(false);
    });
  });

  describe('2. pickVerificationToken', () => {
    it('picks verificationToken when present (new backend)', () => {
      const data = {
        verificationToken: 'new-v-token',
        accessToken: 'should-not-pick',
      };
      expect(pickVerificationToken(data)).toBe('new-v-token');
    });

    it('falls back to accessToken when verificationToken is absent (legacy backend)', () => {
      const data = {
        accessToken: 'legacy-token',
      };
      expect(pickVerificationToken(data)).toBe('legacy-token');
    });

    it('returns undefined if neither is present', () => {
      expect(pickVerificationToken({})).toBeUndefined();
      expect(pickVerificationToken(null)).toBeUndefined();
    });
  });

  describe('3. resolveVerifiedSession', () => {
    it('returns new tokens and user from verify response (new backend)', () => {
      const verifyRes = {
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
        user: { id: 'u1', email: 'a@b.com', isVerified: true },
      };
      const pending = {
        email: 'a@b.com',
        token: 'v-token',
        user: { email: 'a@b.com' },
      };
      const session = resolveVerifiedSession(verifyRes, pending);
      expect(session).toEqual({
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
        user: { id: 'u1', email: 'a@b.com', isVerified: true },
      });
    });

    it('falls back to pending tokens and marks user as isVerified: true (legacy backend)', () => {
      const verifyRes = {
        message: 'البريد موثق بالفعل',
      };
      const pending = {
        email: 'a@b.com',
        token: 'legacy-acc',
        accessToken: 'legacy-acc',
        refreshToken: 'legacy-ref',
        user: { id: 'u1', email: 'a@b.com', isVerified: false },
      };
      const session = resolveVerifiedSession(verifyRes, pending);
      expect(session).toEqual({
        accessToken: 'legacy-acc',
        refreshToken: 'legacy-ref',
        user: { id: 'u1', email: 'a@b.com', isVerified: true },
      });
    });

    it('returns null if neither response nor pending has complete tokens', () => {
      const verifyRes = { message: 'success' };
      const pending = { email: 'a@b.com', token: 'v-token' };
      expect(resolveVerifiedSession(verifyRes, pending)).toBeNull();
    });
  });

  describe('4. pendingVerificationStore', () => {
    beforeEach(() => {
      usePendingVerificationStore.getState().clear();
      jest.clearAllMocks();
    });

    it('sets and clears pending state in memory without touching SecureStore', () => {
      const sample = {
        email: 'test@example.com',
        token: 'sample-token',
        accessToken: 'acc',
        refreshToken: 'ref',
        user: { id: '1' },
      };

      usePendingVerificationStore.getState().setPending(sample);
      expect(usePendingVerificationStore.getState().pending).toEqual(sample);

      usePendingVerificationStore.getState().clear();
      expect(usePendingVerificationStore.getState().pending).toBeNull();

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('5. client.ts excluded URLs and Authorization header preservation', () => {
    it('isAuthExcludedUrl returns true for /auth/verify-email and /auth/resend-verification', () => {
      expect(isAuthExcludedUrl('/auth/verify-email')).toBe(true);
      expect(isAuthExcludedUrl('https://api.example.com/auth/verify-email')).toBe(true);
      expect(isAuthExcludedUrl('/auth/resend-verification')).toBe(true);
      expect(isAuthExcludedUrl('https://api.example.com/auth/resend-verification')).toBe(true);
    });

    it('does not replace explicit Authorization header in request interceptor', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');

      // Test using a mock config through interceptors
      const interceptors = (apiClient.interceptors.request as any).handlers;
      const primaryHandler = interceptors[0]?.fulfilled;

      if (primaryHandler) {
        const configWithCustomAuth = {
          headers: { Authorization: 'Bearer explicit-verification-token' },
        } as any;

        const result = await primaryHandler(configWithCustomAuth);
        expect(result.headers.Authorization).toBe('Bearer explicit-verification-token');

        const configWithoutAuth = {
          headers: {},
        } as any;
        const result2 = await primaryHandler(configWithoutAuth);
        expect(result2.headers.Authorization).toBe('Bearer stored-token');
      }
    });
  });
});
