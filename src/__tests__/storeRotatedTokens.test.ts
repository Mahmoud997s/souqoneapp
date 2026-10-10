import * as SecureStore from 'expo-secure-store'
import { storeRotatedTokens } from '../utils/storeRotatedTokens'

const mockReconnect = jest.fn()

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn(),
}))

jest.mock('../services/socket', () => ({
  socketService: { refreshTokenAndReconnect: (...a: any[]) => mockReconnect(...a) },
}))

describe('storeRotatedTokens (change-password response)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('stores both tokens and reconnects the socket when both are returned', async () => {
    const stored = await storeRotatedTokens({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    expect(stored).toBe(true)
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'new-access')
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'new-refresh')
    expect(mockReconnect).toHaveBeenCalledWith('new-access')
  })

  it.each([undefined, null, {}, { message: 'ok' }])('does nothing when tokens are absent (%p)', async (data) => {
    expect(await storeRotatedTokens(data as any)).toBe(false)
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
    expect(mockReconnect).not.toHaveBeenCalled()
  })

  it.each([
    [{ accessToken: 'a' }],
    [{ refreshToken: 'r' }],
    [{ accessToken: 'a', refreshToken: '' }],
    [{ accessToken: '', refreshToken: 'r' }],
    [{ accessToken: 1, refreshToken: 'r' }],
  ])('does nothing when only one valid token is returned (%j)', async (data) => {
    expect(await storeRotatedTokens(data as any)).toBe(false)
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
    expect(mockReconnect).not.toHaveBeenCalled()
  })

  it('still resolves if the socket reconnect throws', async () => {
    mockReconnect.mockImplementationOnce(() => { throw new Error('boom') })
    await expect(storeRotatedTokens({ accessToken: 'a', refreshToken: 'r' })).resolves.toBe(true)
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2)
  })
})
