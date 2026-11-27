import { CHAT_EXTENSION_MIME_MAP, CHAT_MEDIA_MAX_BYTES } from '../constants/chatMedia'
import type { LocalChatMessageType } from './chatMessageType'

export type ChatMediaRuleKind = keyof typeof CHAT_MEDIA_MAX_BYTES

export function extractFileExtension(filenameOrUri: string): string {
  const clean = filenameOrUri.split('?')[0].split('#')[0]
  const lastSegment = clean.split('/').pop() ?? clean
  if (!lastSegment.includes('.')) return ''
  return lastSegment.split('.').pop()?.toLowerCase() ?? ''
}

export function resolveChatUploadMime(filenameOrUri: string): string {
  const ext = extractFileExtension(filenameOrUri)
  return CHAT_EXTENSION_MIME_MAP[ext] ?? 'image/jpeg'
}

export function getChatMediaMaxBytes(
  filenameOrUri: string,
  localType?: LocalChatMessageType
): number {
  if (localType === 'VOICE') return CHAT_MEDIA_MAX_BYTES.AUDIO
  const mime = resolveChatUploadMime(filenameOrUri)
  if (mime === 'application/pdf') return CHAT_MEDIA_MAX_BYTES.PDF
  if (mime.startsWith('audio/')) return CHAT_MEDIA_MAX_BYTES.AUDIO
  return CHAT_MEDIA_MAX_BYTES.IMAGE
}

export function validateChatMediaSize(
  fileSize: number | undefined,
  filenameOrUri: string,
  localType?: LocalChatMessageType
): { valid: true } | { valid: false; reason: string } {
  if (typeof fileSize === 'number' && fileSize > 0) {
    const maxBytes = getChatMediaMaxBytes(filenameOrUri, localType)
    if (fileSize > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024))
      return {
        valid: false,
        reason: `حجم الملف يتجاوز الحد المسموح (${maxMb} ميجابايت)`,
      }
    }
  }
  return { valid: true }
}

export function buildChatMediaFormData(uri: string, filename: string): FormData {
  const mime = resolveChatUploadMime(filename || uri)
  const formData = new FormData()
  formData.append('file', {
    uri,
    type: mime,
    name: filename,
  } as unknown as Blob)
  return formData
}
