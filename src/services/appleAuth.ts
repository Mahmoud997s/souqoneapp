import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { AppleLoginPayload } from '../types/auth.types'

export interface AppleNoncePair {
  rawNonce: string
  hashedNonce: string
}

export interface AppleReauthResult {
  appleIdentityToken: string
  appleNonce: string
  appleAuthorizationCode: string
}

/**
 * Checks if Apple Authentication is available on this device.
 * Always returns false on non-iOS platforms.
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false
  }
  try {
    return await AppleAuthentication.isAvailableAsync()
  } catch {
    return false
  }
}

/**
 * Generates a cryptographically strong random rawNonce (UUID v4)
 * and its SHA-256 hex digest (hashedNonce) for Apple OpenID Connect flow.
 */
export async function generateAppleNonce(): Promise<AppleNoncePair> {
  const rawNonce = Crypto.randomUUID()
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  )
  return { rawNonce, hashedNonce }
}

/**
 * Checks if the error was caused by user cancelling the Apple authentication prompt.
 */
export function isAppleAuthCancelled(error: any): boolean {
  return error?.code === 'ERR_REQUEST_CANCELED'
}

/**
 * Initiates Sign in with Apple for login / registration.
 * Requests FULL_NAME and EMAIL scopes.
 * Returns AppleLoginPayload if successful, or null if user cancelled.
 */
export async function signInWithApple(): Promise<AppleLoginPayload | null> {
  const { rawNonce, hashedNonce } = await generateAppleNonce()

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    })

    if (!credential.identityToken) {
      throw new Error('لم يتم استلام رمز التحقق من Apple')
    }

    return {
      identityToken: credential.identityToken,
      nonce: rawNonce,
      fullName: credential.fullName
        ? {
            givenName: credential.fullName.givenName ?? undefined,
            familyName: credential.fullName.familyName ?? undefined,
          }
        : undefined,
      authorizationCode: credential.authorizationCode ?? undefined,
    }
  } catch (err: any) {
    if (isAppleAuthCancelled(err)) {
      return null
    }
    throw err
  }
}

/**
 * Performs Apple re-authentication for sensitive actions like account deletion.
 * Validates that authorizationCode is present (required for token revocation).
 * Returns credentials or null if cancelled.
 */
export async function performAppleReauth(): Promise<AppleReauthResult | null> {
  const { rawNonce, hashedNonce } = await generateAppleNonce()

  try {
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
    })

    if (!credential.identityToken || !credential.authorizationCode) {
      throw new Error('لم يتم استلام رمز التفويض من Apple لإلغاء الحساب')
    }

    return {
      appleIdentityToken: credential.identityToken,
      appleNonce: rawNonce,
      appleAuthorizationCode: credential.authorizationCode,
    }
  } catch (err: any) {
    if (isAppleAuthCancelled(err)) {
      return null
    }
    throw err
  }
}

export {
  AppleAuthenticationButton,
  AppleAuthenticationButtonType,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationScope,
} from 'expo-apple-authentication'

export { AppleAuthentication }
