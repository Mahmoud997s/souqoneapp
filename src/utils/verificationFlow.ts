export interface AuthResponseLike {
  accessToken?: string
  refreshToken?: string
  verificationToken?: string
  requiresVerification?: boolean
  emailSent?: boolean
  user?: {
    id?: string
    email?: string
    username?: string
    isVerified?: boolean
    [key: string]: any
  }
}

export interface PendingVerificationState {
  email?: string
  token?: string
  accessToken?: string
  refreshToken?: string
  user?: any
}

export interface VerifiedSession {
  accessToken: string
  refreshToken: string
  user: any
}

/**
 * Returns true if login/register response requires email verification:
 * - If requiresVerification is explicitly true, OR
 * - If user.isVerified is explicitly false,
 * even if tokens are returned (backward-compatibility with legacy backend).
 * Returns false if user.isVerified is true and requiresVerification is not true.
 */
export function needsVerification(data: AuthResponseLike | null | undefined): boolean {
  if (!data) return false
  if (data.requiresVerification === true) return true
  if (data.user && data.user.isVerified === false) return true
  return false
}

/**
 * Picks verification token:
 * Uses new verificationToken if present, falls back to legacy accessToken, or undefined.
 */
export function pickVerificationToken(data: AuthResponseLike | null | undefined): string | undefined {
  if (!data) return undefined
  return data.verificationToken || data.accessToken || undefined
}

/**
 * Resolves session upon successful verification:
 * 1. If verifyResponseData has accessToken and refreshToken (new backend format), returns them with user.
 * 2. If verifyResponseData does NOT have tokens, but pending has accessToken and refreshToken (legacy backend format),
 *    returns pending tokens with pending.user updated with isVerified: true.
 * 3. Otherwise returns null.
 */
export function resolveVerifiedSession(
  verifyResponseData: any,
  pending: PendingVerificationState | null | undefined
): VerifiedSession | null {
  if (verifyResponseData?.accessToken && verifyResponseData?.refreshToken) {
    const user = verifyResponseData.user ?? (pending?.user ? { ...pending.user, isVerified: true } : undefined)
    return {
      accessToken: verifyResponseData.accessToken,
      refreshToken: verifyResponseData.refreshToken,
      user,
    }
  }

  if (pending?.accessToken && pending?.refreshToken) {
    const user = pending.user ? { ...pending.user, isVerified: true } : undefined
    return {
      accessToken: pending.accessToken,
      refreshToken: pending.refreshToken,
      user,
    }
  }

  return null
}
