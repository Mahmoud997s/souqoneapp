import {
  LEGAL_BASE_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
  DELETE_ACCOUNT_URL,
} from '../constants/legal'

describe('Legal URLs & Domain Configuration', () => {
  it('points all legal URLs to official souqoneom.com domain', () => {
    expect(LEGAL_BASE_URL).toBe('https://souqoneom.com')
    expect(PRIVACY_POLICY_URL).toBe('https://souqoneom.com/privacy')
    expect(TERMS_OF_SERVICE_URL).toBe('https://souqoneom.com/terms')
    expect(DELETE_ACCOUNT_URL).toBe('https://souqoneom.com/delete-account')
  })

  it('never points to legacy souqone.com domain', () => {
    expect(PRIVACY_POLICY_URL).not.toContain('https://souqone.com')
    expect(TERMS_OF_SERVICE_URL).not.toContain('https://souqone.com')
    expect(DELETE_ACCOUNT_URL).not.toContain('https://souqone.com')
  })
})
