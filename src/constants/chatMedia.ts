// Mirrors backend souqone/souqOneOm apps/api/src/uploads/chat-media.constants.ts (CHAT_MEDIA_RULES)

const MB = 1024 * 1024

export const CHAT_MEDIA_MAX_BYTES = {
  IMAGE: 10 * MB,
  PDF: 10 * MB,
  AUDIO: 5 * MB,
} as const

export const CHAT_EXTENSION_MIME_MAP: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  wav: 'audio/wav',
}
