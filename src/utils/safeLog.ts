export interface SafeErrorInfo {
  name?: string
  message: string
  status?: number
  code?: string
}

export const ALLOWED_ERROR_NAMES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'AxiosError',
  'CanceledError',
  'NetworkError',
])

export const ALLOWED_ERROR_CODES = new Set([
  'ERR_BAD_REQUEST',
  'ERR_BAD_RESPONSE',
  'ERR_NETWORK',
  'ERR_CANCELED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'USER_BLOCKED',
  'USER_SUSPENDED',
  'ACCOUNT_BANNED',
  'INVALID_CREDENTIALS',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_SERVER_ERROR',
])

const REDACT_URL = /https?:\/\/[^\s"'<>]+/gi
const REDACT_BEARER = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi
const REDACT_JWT = /\bey[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+\b/g
const REDACT_QUERY_SECRET = /(?:[?&]|\b)(token|key|password|secret|auth|bearer)=([^&\s"'<>]+)/gi
const REDACT_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const REDACT_ARABIC_INDIC_NUM = /[\u0660-\u0669]{7,}/g
const REDACT_PHONE_GROUPS = /(?:\+?\d[\d\s\-().]{5,}\d)/g
const REDACT_HEX_OR_LONG_NUM = /\b([0-9a-fA-F]{24,}|\d{8,})\b/g

function sanitizeDevMessage(raw: string): string {
  try {
    if (typeof raw !== 'string') return 'Unknown error'
    const trimmed = raw.trim()
    if (trimmed.length === 0) return 'Unknown error'

    let sanitized = trimmed
      .replace(REDACT_URL, '[REDACTED_URL]')
      .replace(REDACT_BEARER, 'Bearer [REDACTED_TOKEN]')
      .replace(REDACT_JWT, '[REDACTED_JWT]')
      .replace(REDACT_QUERY_SECRET, '$1=[REDACTED_SECRET]')
      .replace(REDACT_EMAIL, '[REDACTED_EMAIL]')
      .replace(REDACT_ARABIC_INDIC_NUM, '[REDACTED_NUMBER]')
      .replace(REDACT_HEX_OR_LONG_NUM, '[REDACTED_NUMBER]')
      .replace(REDACT_PHONE_GROUPS, (match) => {
        // Only redact if actual numeric digit count is 7 or more
        const digits = match.replace(/\D/g, '')
        return digits.length >= 7 ? '[REDACTED_PHONE]' : match
      })

    return sanitized.slice(0, 200)
  } catch {
    return 'Unknown error'
  }
}

function resolveMessage(isAxios: boolean, rawMessage: unknown): string {
  try {
    const isDev = typeof __DEV__ !== 'undefined' && Boolean(__DEV__)
    if (!isDev) {
      return isAxios ? 'Network request failed' : 'Error'
    }
    if (isAxios) {
      return 'Network request failed'
    }
    return sanitizeDevMessage(typeof rawMessage === 'string' ? rawMessage : '')
  } catch {
    return 'Unknown error'
  }
}

/**
 * Sanitizes any error object so that sensitive data, tokens, and payloads
 * are completely stripped before logging.
 *
 * Hardened per D-231 (never-throw guarantee, prod fixed category, code allowlist):
 * - NEVER throws: fully wrapped in defensive try/catch; returns safe fallback.
 * - In production (!__DEV__): message is fixed category ('Network request failed' or 'Error').
 * - In DEV: message redacted (URLs, tokens, JWTs, query secrets, emails, phones, Arabic digits).
 * - name: allowlist of standard error names (fallback 'Error').
 * - status: numeric only (100..599).
 * - code: strict allowlist of machine error codes only; entity IDs strictly rejected.
 */
export function safeErrorInfo(err: unknown): SafeErrorInfo {
  try {
    if (!err) {
      return { message: 'Unknown error' }
    }

    const isDev = typeof __DEV__ !== 'undefined' && Boolean(__DEV__)

    if (typeof err === 'string') {
      return { message: isDev ? sanitizeDevMessage(err) : 'Error' }
    }

    const obj = err as Record<string, any>

    let isAxios = false
    try {
      isAxios =
        Boolean(obj.isAxiosError) ||
        obj.name === 'AxiosError' ||
        Boolean(obj.config && (obj.response || obj.request))
    } catch {
      isAxios = false
    }

    let rawMsg = ''
    try {
      rawMsg = typeof obj.message === 'string' ? obj.message : ''
    } catch {
      rawMsg = ''
    }

    const message = resolveMessage(isAxios, rawMsg)
    const info: SafeErrorInfo = { message }

    try {
      if (typeof obj.name === 'string' && obj.name.trim().length > 0) {
        const trimmed = obj.name.trim()
        info.name = ALLOWED_ERROR_NAMES.has(trimmed) ? trimmed : 'Error'
      } else if (err instanceof Error) {
        info.name = 'Error'
      }
    } catch {
      // If reading name throws, leave name undefined
    }

    try {
      const rawStatus =
        typeof obj.response?.status === 'number'
          ? obj.response.status
          : typeof obj.status === 'number'
            ? obj.status
            : undefined

      if (
        typeof rawStatus === 'number' &&
        Number.isInteger(rawStatus) &&
        rawStatus >= 100 &&
        rawStatus <= 599
      ) {
        info.status = rawStatus
      }
    } catch {
      // Ignore status extraction failures
    }

    try {
      const rawCode =
        typeof obj.code === 'string' && obj.code.trim().length > 0
          ? obj.code.trim()
          : typeof obj.response?.data?.code === 'string' && obj.response.data.code.trim().length > 0
            ? obj.response.data.code.trim()
            : undefined

      if (rawCode && ALLOWED_ERROR_CODES.has(rawCode)) {
        info.code = rawCode
      }
    } catch {
      // Ignore code extraction failures
    }

    return info
  } catch {
    return { message: 'Unknown error' }
  }
}

const formatTag = (tag: string): string => {
  try {
    return tag.startsWith('[') && tag.endsWith(']') ? tag : `[${tag}]`
  } catch {
    return '[Log]'
  }
}

/**
 * Safely logs an error message and sanitized error info only in development (__DEV__).
 * In production builds, this is a complete no-op. Guaranteed to never throw.
 */
export function logError(tag: string, err: unknown): void {
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error(formatTag(tag), safeErrorInfo(err))
    }
  } catch {
    // Never propagate
  }
}

/**
 * Safely logs a warning message and sanitized error info only in development (__DEV__).
 * In production builds, this is a complete no-op. Guaranteed to never throw.
 */
export function logWarn(tag: string, err: unknown): void {
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(formatTag(tag), safeErrorInfo(err))
    }
  } catch {
    // Never propagate
  }
}

/**
 * Safely logs an info message and sanitized error info only in development (__DEV__).
 * In production builds, this is a complete no-op. Guaranteed to never throw.
 */
export function logInfo(tag: string, err: unknown): void {
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(formatTag(tag), safeErrorInfo(err))
    }
  } catch {
    // Never propagate
  }
}
