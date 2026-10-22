import { assertOwnerHasPhoneForEdit } from './assertOwnerHasPhoneForEdit'
import { useAuthStore } from '../store/authStore'
import * as profilePhoneGuard from './profilePhoneGuard'

jest.mock('./profilePhoneGuard', () => ({
  promptProfilePhoneRequired: jest.fn(),
}))

describe('assertOwnerHasPhoneForEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('prompts and returns false when phone is missing or empty', () => {
    useAuthStore.setState({ user: { id: 'u1', phone: '' } as any })
    const result = assertOwnerHasPhoneForEdit()

    expect(result).toBe(false)
    expect(profilePhoneGuard.promptProfilePhoneRequired).toHaveBeenCalledTimes(1)
  })

  it('prompts and returns false when user is null', () => {
    useAuthStore.setState({ user: null })
    const result = assertOwnerHasPhoneForEdit()

    expect(result).toBe(false)
    expect(profilePhoneGuard.promptProfilePhoneRequired).toHaveBeenCalledTimes(1)
  })

  it('does NOT prompt and returns true when user has a valid phone number', () => {
    useAuthStore.setState({ user: { id: 'u1', phone: '+96891234567' } as any })
    const result = assertOwnerHasPhoneForEdit()

    expect(result).toBe(true)
    expect(profilePhoneGuard.promptProfilePhoneRequired).not.toHaveBeenCalled()
  })
})
