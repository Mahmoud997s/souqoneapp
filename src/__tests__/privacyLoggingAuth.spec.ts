import fs from 'fs'
import path from 'path'
import { safeErrorInfo, logError, logWarn, logInfo } from '../utils/safeLog'
import { storeRotatedTokens } from '../utils/storeRotatedTokens'

describe('D-228: Safe Error Logging and Privacy Leak Protection', () => {
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

  describe('safeErrorInfo Sanitizer', () => {
    const sensitiveAxiosError = {
      name: 'AxiosError',
      message: 'Request failed with status code 401',
      code: 'ERR_BAD_REQUEST',
      config: {
        url: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          Authorization: 'Bearer SENSITIVE_JWT_BEARER_TOKEN_999',
          'X-Custom-Secret': 'SECRET_API_KEY_ABC',
        },
        data: JSON.stringify({
          phone: '+96891234567',
          password: 'CLEAR_TEXT_USER_PASSWORD_123!',
        }),
      },
      request: {
        _header: 'Authorization: Bearer SENSITIVE_JWT_BEARER_TOKEN_999\n',
      },
      response: {
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          'set-cookie': ['session=SECRET_COOKIE_DATA'],
        },
        data: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          user: {
            id: 'usr_secret_77',
            email: 'victim@private.om',
            phone: '+96891234567',
            accessToken: 'SENSITIVE_NEW_ACCESS_TOKEN_XYZ',
            refreshToken: 'SENSITIVE_NEW_REFRESH_TOKEN_UVW',
          },
        },
      },
    }

    it('sanitizes AxiosError: extracts ONLY name, message, status, code', () => {
      const sanitized = safeErrorInfo(sensitiveAxiosError)

      expect(sanitized).toEqual({
        name: 'AxiosError',
        message: 'Request failed with status code 401',
        status: 401,
        code: 'ERR_BAD_REQUEST',
      })

      // Strict assertions: sensitive fields NEVER present in object
      expect('config' in sanitized).toBe(false)
      expect('headers' in sanitized).toBe(false)
      expect('request' in sanitized).toBe(false)
      expect('response' in sanitized).toBe(false)
      expect('data' in sanitized).toBe(false)

      const serialized = JSON.stringify(sanitized)
      expect(serialized).not.toContain('SENSITIVE_JWT_BEARER_TOKEN')
      expect(serialized).not.toContain('SECRET_API_KEY')
      expect(serialized).not.toContain('CLEAR_TEXT_USER_PASSWORD')
      expect(serialized).not.toContain('victim@private.om')
      expect(serialized).not.toContain('+96891234567')
      expect(serialized).not.toContain('SECRET_COOKIE_DATA')
      expect(serialized).not.toContain('SENSITIVE_NEW_ACCESS_TOKEN')
    })

    it('extracts response.data.code when error.code is missing', () => {
      const errorWithoutCode = {
        name: 'AxiosError',
        message: 'Unauthorized',
        response: {
          status: 401,
          data: { code: 'ACCOUNT_BANNED' },
        },
      }

      const result = safeErrorInfo(errorWithoutCode)
      expect(result).toEqual({
        name: 'AxiosError',
        message: 'Unauthorized',
        status: 401,
        code: 'ACCOUNT_BANNED',
      })
    })

    it('handles primitive string errors gracefully', () => {
      expect(safeErrorInfo('Network disconnected')).toEqual({
        message: 'Network disconnected',
      })
    })

    it('handles standard Error instances', () => {
      const err = new TypeError('Cannot read property of undefined')
      expect(safeErrorInfo(err)).toEqual({
        name: 'TypeError',
        message: 'Cannot read property of undefined',
      })
    })

    it('handles null and undefined safely', () => {
      expect(safeErrorInfo(null)).toEqual({ message: 'Unknown error' })
      expect(safeErrorInfo(undefined)).toEqual({ message: 'Unknown error' })
    })
  })

  describe('logError / logWarn / logInfo Gating and Output', () => {
    const sampleError = {
      name: 'AxiosError',
      message: 'Failed to upload image',
      response: {
        status: 413,
        data: { secret: 'do-not-log-me' },
      },
      config: {
        headers: { Authorization: 'Bearer SUPER_SECRET' },
      },
    }

    it('in development (__DEV__=true), logError outputs sanitized info and no credentials', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = true

        logError('ImageUpload', sampleError)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ImageUpload]',
          {
            name: 'AxiosError',
            message: 'Failed to upload image',
            status: 413,
          }
        )

        const loggedText = JSON.stringify(consoleErrorSpy.mock.calls)
        expect(loggedText).not.toContain('SUPER_SECRET')
        expect(loggedText).not.toContain('do-not-log-me')
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })

    it('in development (__DEV__=true), logWarn outputs sanitized warning', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = true

        logWarn('PostEdit:CarLabels', sampleError)

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[PostEdit:CarLabels]',
          {
            name: 'AxiosError',
            message: 'Failed to upload image',
            status: 413,
          }
        )
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })

    it('in production (__DEV__=false), logError, logWarn and logInfo are complete no-ops', () => {
      const devBackup = (global as any).__DEV__
      try {
        ;(global as any).__DEV__ = false

        logError('AnyTag', sampleError)
        logWarn('AnyTag', sampleError)
        logInfo('AnyTag', sampleError)

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        expect(consoleWarnSpy).not.toHaveBeenCalled()
        expect(consoleLogSpy).not.toHaveBeenCalled()
      } finally {
        ;(global as any).__DEV__ = devBackup
      }
    })
  })

  describe('Real App Module Integration: storeRotatedTokens', () => {
    it('returns false without calling console when invalid data is passed', async () => {
      const result = await storeRotatedTokens(null)
      expect(result).toBe(false)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('Static Guard: No Raw Error Logging in app/ and src/', () => {
    function findSourceFiles(dir: string): string[] {
      const files: string[] = []
      if (!fs.existsSync(dir)) return files

      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue
          files.push(...findSourceFiles(fullPath))
        } else if (
          (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
          !entry.name.endsWith('.spec.ts') &&
          !entry.name.endsWith('.spec.tsx') &&
          entry.name !== '_layout.tsx' // Explicit exclusion per task requirement
        ) {
          files.push(fullPath)
        }
      }
      return files
    }

    it('ensures no app/ or src/ file passes unredacted error objects to console or uses .catch(console.*)', () => {
      const projectRoot = path.resolve(__dirname, '../..')
      const targetDirs = [path.join(projectRoot, 'app'), path.join(projectRoot, 'src')]

      const sourceFiles = targetDirs.flatMap(findSourceFiles)
      expect(sourceFiles.length).toBeGreaterThan(50)

      const violations: string[] = []

      // Pattern 1: .catch(console.warn) or .catch(console.error) or .catch(console.log)
      const catchConsolePattern = /\.catch\(\s*console\.(warn|error|log|info)\s*\)/

      // Pattern 2: console.*(..., rawError) without extracting .message
      // Matches console.error('...', err) or console.warn(e) or console.log('...', error)
      const rawErrorLogPattern = /console\.(error|warn|log)\([^)]*,\s*(err|error|e|uploadErr|imgErr)\s*\)/

      for (const filePath of sourceFiles) {
        const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/')
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          const trimmed = line.trim()
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return

          if (catchConsolePattern.test(line)) {
            violations.push(`${relativePath}:${index + 1} uses forbidden .catch(console.*): ${trimmed}`)
          }

          if (rawErrorLogPattern.test(line)) {
            violations.push(`${relativePath}:${index + 1} passes raw error to console: ${trimmed}`)
          }
        })
      }

      expect(violations).toEqual([])
    })
  })
})
