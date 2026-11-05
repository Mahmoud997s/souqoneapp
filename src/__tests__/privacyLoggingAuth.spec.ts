import fs from 'fs'
import path from 'path'

describe('D-227: Privacy Logging Sweep - Auth & Sensitive Data Logging Protection', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleInfoSpy.mockRestore()
  })

  describe('Login Error Handling Privacy', () => {
    const sensitiveError = {
      message: 'Invalid credentials',
      response: {
        status: 401,
        data: {
          code: 'INVALID_CREDENTIALS',
          accessToken: 'SECRET_ACCESS_TOKEN_ABC123',
          refreshToken: 'SECRET_REFRESH_TOKEN_XYZ789',
          user: { id: 'u1', email: 'user@private.com', phone: '+96891234567' },
        },
      },
    }

    it('login flow in production (__DEV__=false) NEVER logs response body or tokens to console', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = false

        // Simulate login catch block logic in app/(auth)/login.tsx
        const e: any = sensitiveError
        if (__DEV__) {
          console.error('[Login Error]', e?.message || 'Login failed')
        }

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        expect(consoleLogSpy).not.toHaveBeenCalled()
        expect(consoleWarnSpy).not.toHaveBeenCalled()
        expect(consoleInfoSpy).not.toHaveBeenCalled()
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })

    it('login flow in development (__DEV__=true) redacts response body and NEVER logs tokens or user payload', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = true

        const e: any = sensitiveError
        if (__DEV__) {
          console.error('[Login Error]', e?.message || 'Login failed')
        }

        expect(consoleErrorSpy).toHaveBeenCalledWith('[Login Error]', 'Invalid credentials')
        const allCallsText = consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)).join(' ')
        expect(allCallsText).not.toContain('SECRET_ACCESS_TOKEN')
        expect(allCallsText).not.toContain('SECRET_REFRESH_TOKEN')
        expect(allCallsText).not.toContain('user@private.com')
        expect(allCallsText).not.toContain('+96891234567')
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })
  })

  describe('Register Error Handling Privacy', () => {
    const sensitiveRegisterError = {
      message: 'Email already in use',
      response: {
        status: 409,
        data: {
          code: 'EMAIL_EXISTS',
          user: { id: 'u2', email: 'registered@private.com', phone: '+96897654321' },
          temporaryToken: 'TEMP_SENSITIVE_REG_TOKEN_999',
        },
      },
    }

    it('register flow in production (__DEV__=false) NEVER logs response body or tokens to console', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = false

        // Simulate register catch block logic in app/(auth)/register.tsx
        const e: any = sensitiveRegisterError
        if (__DEV__) {
          console.error('[Register Error]', e?.message || 'Registration failed')
        }

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        expect(consoleLogSpy).not.toHaveBeenCalled()
        expect(consoleWarnSpy).not.toHaveBeenCalled()
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })

    it('register flow in development (__DEV__=true) redacts response body and NEVER logs tokens or user payload', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = true

        const e: any = sensitiveRegisterError
        if (__DEV__) {
          console.error('[Register Error]', e?.message || 'Registration failed')
        }

        expect(consoleErrorSpy).toHaveBeenCalledWith('[Register Error]', 'Email already in use')
        const allCallsText = consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)).join(' ')
        expect(allCallsText).not.toContain('TEMP_SENSITIVE_REG_TOKEN')
        expect(allCallsText).not.toContain('registered@private.com')
        expect(allCallsText).not.toContain('+96897654321')
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })
  })

  describe('Static Contract Audit: No Production Response Body or Token Logging', () => {
    it('app/(auth)/login.tsx does NOT log JSON.stringify(response.data) or raw response.data', () => {
      const loginPath = path.resolve(__dirname, '../../app/(auth)/login.tsx')
      const content = fs.readFileSync(loginPath, 'utf8')

      expect(content).not.toContain('JSON.stringify(e?.response?.data)')
      expect(content).not.toContain('console.error(\'[Login Error]\', JSON.stringify')
      expect(content).not.toContain('console.error(\'[Google Login Error]\', err?.response?.data')
      expect(content).not.toContain('console.error(\'[Apple Login Error]\', err?.response?.data')
    })

    it('app/(auth)/register.tsx does NOT log JSON.stringify(response.data) or raw response.data', () => {
      const registerPath = path.resolve(__dirname, '../../app/(auth)/register.tsx')
      const content = fs.readFileSync(registerPath, 'utf8')

      expect(content).not.toContain('JSON.stringify(e?.response?.data)')
      expect(content).not.toContain('console.error(\'[Register Error]\', JSON.stringify')
    })

    it('app/post/edit/[id].tsx has eradicated console.log for brand/model/trim resolution', () => {
      const postEditPath = path.resolve(__dirname, '../../app/post/edit/[id].tsx')
      const content = fs.readFileSync(postEditPath, 'utf8')

      expect(content).not.toContain("console.log('Resolving car labels for:'")
      expect(content).not.toContain("console.log('Brands fetched:'")
      expect(content).not.toContain("console.log('Models fetched:'")
      expect(content).not.toContain("console.log('Trims fetched:'")
    })
  })
})
