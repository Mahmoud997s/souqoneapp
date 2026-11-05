export interface SafeErrorInfo {
  name?: string
  message: string
  status?: number
  code?: string
}

/**
 * Sanitizes any error object (especially AxiosError) so that request config,
 * headers (including Authorization bearer tokens), request payloads, and
 * response data are completely stripped before logging.
 */
export function safeErrorInfo(err: unknown): SafeErrorInfo {
  if (!err) {
    return { message: 'Unknown error' }
  }

  if (typeof err === 'string') {
    return { message: err }
  }

  const obj = err as Record<string, any>
  const info: SafeErrorInfo = {
    message:
      typeof obj.message === 'string' && obj.message.trim().length > 0
        ? obj.message
        : 'Unknown error',
  }

  if (typeof obj.name === 'string' && obj.name.trim().length > 0) {
    info.name = obj.name
  }

  const status =
    typeof obj.response?.status === 'number'
      ? obj.response.status
      : typeof obj.status === 'number'
        ? obj.status
        : undefined
  if (typeof status === 'number') {
    info.status = status
  }

  const code =
    typeof obj.code === 'string'
      ? obj.code
      : typeof obj.response?.data?.code === 'string'
        ? obj.response.data.code
        : undefined
  if (typeof code === 'string' && code.trim().length > 0) {
    info.code = code
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
