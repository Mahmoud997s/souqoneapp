export type LocalChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE'
export type WireChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'SYSTEM'

export function toWireType(type?: string | null): WireChatMessageType {
  switch (type) {
    case 'VOICE':
    case 'AUDIO':
      return 'AUDIO'
    case 'IMAGE':
      return 'IMAGE'
    case 'FILE':
      return 'FILE'
    case 'SYSTEM':
      return 'SYSTEM'
    default:
      return 'TEXT'
  }
}

export function fromWireType(type?: string | null): LocalChatMessageType {
  switch (type) {
    case 'AUDIO':
    case 'VOICE':
      return 'VOICE'
    case 'IMAGE':
      return 'IMAGE'
    case 'FILE':
      return 'FILE'
    default:
      return 'TEXT'
  }
}

export function isMediaChatType(type?: string | null): boolean {
  const wire = toWireType(type)
  return wire === 'IMAGE' || wire === 'FILE' || wire === 'AUDIO'
}

export function buildSendMessagePayload(params: {
  content?: string
  type?: LocalChatMessageType | WireChatMessageType
  mediaUrl?: string
}): { content?: string; type: WireChatMessageType; mediaUrl?: string } {
  const wireType = toWireType(params.type)
  const trimmed = params.content?.trim() ?? ''

  if (isMediaChatType(wireType) && params.mediaUrl) {
    return trimmed
      ? { content: trimmed, type: wireType, mediaUrl: params.mediaUrl }
      : { type: wireType, mediaUrl: params.mediaUrl }
  }

  return {
    content: trimmed,
    type: wireType,
    ...(params.mediaUrl ? { mediaUrl: params.mediaUrl } : {}),
  }
}

export function getReplyQuoteForMessage(msg: { type?: string | null; content?: string }): string {
  const localType = fromWireType(msg.type)
  if (localType === 'IMAGE') return 'صورة'
  if (localType === 'VOICE') return 'رسالة صوتية'
  if (localType === 'FILE') return 'ملف'
  return (msg.content ?? '').replace(/\n/g, ' ').substring(0, 100)
}
