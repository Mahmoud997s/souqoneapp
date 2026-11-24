import {
  CHAT_CONVERSATIONS_ALLOWED_PARAMS,
  buildGetChatRoomsParams,
} from '../../api/chat'

describe('D-397 — Chat Conversations Query Param Whitelist Contract', () => {
  it('allows only search and includeArchived and omits includeArchived when false', () => {
    expect([...CHAT_CONVERSATIONS_ALLOWED_PARAMS]).toEqual(['search', 'includeArchived'])
    expect(buildGetChatRoomsParams({ includeArchived: true })).toEqual({ includeArchived: true })
    expect(buildGetChatRoomsParams({ includeArchived: false })).toBeUndefined()
    expect(buildGetChatRoomsParams({ includeArchived: true, search: '  كامري  ' })).toEqual({
      includeArchived: true,
      search: 'كامري',
    })

    const built = buildGetChatRoomsParams({ includeArchived: true, search: 'تويوتا' }) || {}
    Object.keys(built).forEach((k) => {
      expect(CHAT_CONVERSATIONS_ALLOWED_PARAMS).toContain(k)
    })
    expect(CHAT_CONVERSATIONS_ALLOWED_PARAMS).not.toContain('page')
    expect(CHAT_CONVERSATIONS_ALLOWED_PARAMS).not.toContain('limit')
  })
})
