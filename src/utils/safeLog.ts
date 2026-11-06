export interface SafeErrorInfo {
  name?: string
  message: string
  status?: number
  code?: string
}

const ALLOWED_ERROR_NAMES = new Set([
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

const MACHINE_CODE_REGEX = /^[A-Z0-9_.-]{1,40}$/
const REDACT_URL = /https?:\/\/[^\s"'<>]+/gi
const REDACT_BEARER = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi
const REDACT_JWT = /\bey[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+\b/g
const REDACT_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const REDACT_HEX_OR_LONG_NUM = /\b([0-9a-fA-F]{24,}|\d{8,})\b/g

function sanitizeErrorMessage(raw: string): string {
  if (typeof raw !== 'string') return 'Unknown error'
  const trimmed = raw.trim()
  if (trimmed.length === 0) return 'Unknown error'

  const redacted = trimmed
    .replace(REDACT_URL, '[REDACTED_URL]')
    .replace(REDACT_BEARER, 'Bearer [REDACTED_TOKEN]')
    .replace(REDACT_JWT, '[REDACTED_JWT]')
    .replace(REDACT_EMAIL, '[REDACTED_EMAIL]')
    .replace(REDACT_HEX_OR_LONG_NUM, '[REDACTED_NUMBER]')

  return redacted.slice(0, 200)
}

/**
 * Sanitizes any error object (especially AxiosError) so that request config,
 * headers (including Authorization bearer tokens), request payloads, and
 * response data are completely stripped before logging.
 *
 * Hardened per D-230 / A-041:
 * - status: numeric only (100..599).
 * - code: machine-code pattern only (/^[A-Z0-9_.-]{1,40}$/); prefers error.code.
 * - name: allowlist of standard error names (fallback 'Error').
 * - message: fixed category string for AxiosError ('Network request failed');
 *   redacts URLs, Bearer/JWT tokens, emails, and long numbers; capped at 200 chars.
 */
export function safeErrorInfo(err: unknown): SafeErrorInfo {
  if (!err) {
    return { message: 'Unknown error' }
  }

  if (typeof err === 'string') {
    return { message: sanitizeErrorMessage(err) }
  }

  const obj = err as Record<string, any>

  const isAxios =
    Boolean(obj.isAxiosError) ||
    obj.name === 'AxiosError' ||
    Boolean(obj.config && (obj.response || obj.request))

  const message = isAxios
    ? 'Network request failed'
    : sanitizeErrorMessage(typeof obj.message === 'string' ? obj.message : '')

  const info: SafeErrorInfo = { message }

  if (typeof obj.name === 'string' && obj.name.trim().length > 0) {
    info.name = ALLOWED_ERROR_NAMES.has(obj.name.trim()) ? obj.name.trim() : 'Error'
  } else if (err instanceof Error) {
    info.name = 'Error'
  }

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

  const rawCode =
    typeof obj.code === 'string' && obj.code.trim().length > 0
      ? obj.code.trim()
      : typeof obj.response?.data?.code === 'string' && obj.response.data.code.trim().length > 0
        ? obj.response.data.code.trim()
        : undefined

  if (rawCode && MACHINE_CODE_REGEX.test(rawCode)) {
    info.code = rawCode
  }

  return info
}

const formatTag = (tag: string): string =>
  tag.startsWith('[') && tag.endsWith(']') ? tag : `[${tag}]`

/**
 * Safely logs an error message and sanitized error info only in development (__DEV__).
 * In production builds, this is a complete no-op.
 */
export function logError(tag: string, err: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(formatTag(tag), safeErrorInfo(err))
  }
}

/**
 * Safely logs a warning message and sanitized error info only in development (__DEV__).
 * In production builds, this is a complete no-op.
 */
export function logWarn(tag: string, err: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(formatTag(tag), safeErrorInfo(err))
  }
}

/**
 * Safely logs an info message and sanitized error info only in development (__DEV__).
 * In production builds, this is a complete no-op.
 */
export function logInfo(tag: string, err: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(formatTag(tag), safeErrorInfo(err))
  }
}
