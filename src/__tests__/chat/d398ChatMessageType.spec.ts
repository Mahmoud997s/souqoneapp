import {
  toWireType,
  fromWireType,
  buildSendMessagePayload,
  getReplyQuoteForMessage,
} from '../../utils/chatMessageType'

describe('D-398 — Wire-Type Mapping & Media Payload Contract', () => {
  it('maps local types to wire types (VOICE -> AUDIO, IMAGE -> IMAGE, FILE -> FILE, TEXT -> TEXT)', () => {
    expect(toWireType('VOICE')).toBe('AUDIO')
    expect(toWireType('AUDIO')).toBe('AUDIO')
    expect(toWireType('IMAGE')).toBe('IMAGE')
    expect(toWireType('FILE')).toBe('FILE')
    expect(toWireType('SYSTEM')).toBe('SYSTEM')
    expect(toWireType('TEXT')).toBe('TEXT')
    expect(toWireType(undefined)).toBe('TEXT')
  })

  it('maps wire types back to local types (AUDIO -> VOICE, legacy VOICE -> VOICE)', () => {
    expect(fromWireType('AUDIO')).toBe('VOICE')
    expect(fromWireType('VOICE')).toBe('VOICE')
    expect(fromWireType('IMAGE')).toBe('IMAGE')
    expect(fromWireType('FILE')).toBe('FILE')
    expect(fromWireType('TEXT')).toBe('TEXT')
    expect(fromWireType(undefined)).toBe('TEXT')
  })

  it('builds caption-less media payload omitting content and mapping VOICE to AUDIO', () => {
    const voicePayload = buildSendMessagePayload({
      content: '   ',
      type: 'VOICE',
      mediaUrl: 'https://cdn.example.com/v1.m4a',
    })
    expect(voicePayload).toEqual({
      type: 'AUDIO',
      mediaUrl: 'https://cdn.example.com/v1.m4a',
    })
    expect('content' in voicePayload).toBe(false)

    const imgWithCaption = buildSendMessagePayload({
      content: 'صورة المقصورة',
      type: 'IMAGE',
      mediaUrl: 'https://cdn.example.com/p1.jpg',
    })
    expect(imgWithCaption).toEqual({
      content: 'صورة المقصورة',
      type: 'IMAGE',
      mediaUrl: 'https://cdn.example.com/p1.jpg',
    })
  })

  it('produces emoji-free reply quotes for media messages', () => {
    const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u
    const imgQuote = getReplyQuoteForMessage({ type: 'IMAGE', content: '' })
    const voiceQuote = getReplyQuoteForMessage({ type: 'AUDIO', content: '' })
    const fileQuote = getReplyQuoteForMessage({ type: 'FILE', content: '' })

    expect(imgQuote).toBe('صورة')
    expect(voiceQuote).toBe('رسالة صوتية')
    expect(fileQuote).toBe('ملف')
    expect(emojiRegex.test(imgQuote)).toBe(false)
    expect(emojiRegex.test(voiceQuote)).toBe(false)
    expect(emojiRegex.test(fileQuote)).toBe(false)
  })
})
