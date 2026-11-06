import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import { safeErrorInfo, logError, logWarn, logInfo } from '../utils/safeLog'
import { storeRotatedTokens } from '../utils/storeRotatedTokens'

describe('D-230: Hardened Safe Error Logging and AST Privacy Guard', () => {
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

  describe('safeErrorInfo Sanitizer (Hardened)', () => {
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

    it('sanitizes AxiosError: replaces raw message with category string and strips internals', () => {
      const sanitized = safeErrorInfo(sensitiveAxiosError)

      expect(sanitized).toEqual({
        name: 'AxiosError',
        message: 'Network request failed',
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

    it('extracts response.data.code only when error.code is missing and code matches pattern', () => {
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
        message: 'Network request failed',
        status: 401,
        code: 'ACCOUNT_BANNED',
      })
    })

    it('prefers error.code over response.data.code', () => {
      const err = {
        name: 'Error',
        code: 'CLIENT_TIMEOUT',
        response: {
          data: { code: 'SERVER_IGNORED' },
        },
      }
      expect(safeErrorInfo(err).code).toBe('CLIENT_TIMEOUT')
    })

    it('rejects invalid or injection machine codes', () => {
      expect(safeErrorInfo({ code: 'INVALID CODE WITH SPACES' }).code).toBeUndefined()
      expect(safeErrorInfo({ code: '<script>alert(1)</script>' }).code).toBeUndefined()
      expect(safeErrorInfo({ code: 'A'.repeat(50) }).code).toBeUndefined()
    })

    it('validates status: accepts integer between 100 and 599 only', () => {
      expect(safeErrorInfo({ status: 200 }).status).toBe(200)
      expect(safeErrorInfo({ status: 500 }).status).toBe(500)
      expect(safeErrorInfo({ status: 99 }).status).toBeUndefined()
      expect(safeErrorInfo({ status: 600 }).status).toBeUndefined()
      expect(safeErrorInfo({ status: '200' as any }).status).toBeUndefined()
      expect(safeErrorInfo({ status: NaN }).status).toBeUndefined()
      expect(safeErrorInfo({ response: { status: 404 } }).status).toBe(404)
    })

    it('enforces allowlist for error name and defaults unknown to Error', () => {
      expect(safeErrorInfo({ name: 'TypeError' }).name).toBe('TypeError')
      expect(safeErrorInfo({ name: 'NetworkError' }).name).toBe('NetworkError')
      expect(safeErrorInfo({ name: 'AxiosError' }).name).toBe('AxiosError')
      expect(safeErrorInfo({ name: 'InjectedServerName' }).name).toBe('Error')
      expect(safeErrorInfo({ name: '<svg onload=alert(1)>' }).name).toBe('Error')
    })

    it('redacts URLs, Bearer tokens, JWTs, emails, and long numeric IDs from messages', () => {
      const adversarial = new Error(
        'Failure accessing https://api.example.com/v1/auth?token=123 with Bearer secret-tok-abc and JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature for user test@souq.om with id 9876543210'
      )
      const sanitized = safeErrorInfo(adversarial)

      expect(sanitized.message).not.toContain('https://api.example.com')
      expect(sanitized.message).not.toContain('secret-tok-abc')
      expect(sanitized.message).not.toContain('eyJhbGciOiJIUzI1NiJ9')
      expect(sanitized.message).not.toContain('test@souq.om')
      expect(sanitized.message).not.toContain('9876543210')

      expect(sanitized.message).toContain('[REDACTED_URL]')
      expect(sanitized.message).toContain('Bearer [REDACTED_TOKEN]')
      expect(sanitized.message).toContain('[REDACTED_JWT]')
      expect(sanitized.message).toContain('[REDACTED_EMAIL]')
      expect(sanitized.message).toContain('[REDACTED_NUMBER]')
    })

    it('caps message length at 200 characters', () => {
      const veryLong = 'Server error: ' + 'x'.repeat(400)
      const res = safeErrorInfo(new Error(veryLong))
      expect(res.message.length).toBeLessThanOrEqual(200)
    })

    it('handles primitive thrown strings safely and redacts them', () => {
      const res = safeErrorInfo('Failed login for admin@souqone.om with token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig')
      expect(res.message).not.toContain('admin@souqone.om')
      expect(res.message).toContain('[REDACTED_EMAIL]')
      expect(res.message).toContain('[REDACTED_JWT]')
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
            message: 'Network request failed',
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
            message: 'Network request failed',
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

  describe('AST Static Guard: Comprehensive Zero-Console Invariant across app/ and src/', () => {
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
          !entry.name.endsWith('.test.ts') &&
          !entry.name.endsWith('.test.tsx')
        ) {
          files.push(fullPath)
        }
      }
      return files
    }

    it('AST parser verifies NO direct console calls, aliases, or catches in app/ and src/ (excluding _layout.tsx and safeLog.ts)', () => {
      const projectRoot = path.resolve(__dirname, '../..')
      const targetDirs = [path.join(projectRoot, 'app'), path.join(projectRoot, 'src')]

      const sourceFiles = targetDirs.flatMap(findSourceFiles)
      expect(sourceFiles.length).toBeGreaterThan(50)

      const violations: string[] = []

      for (const filePath of sourceFiles) {
        const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/')

        // Explicitly excluded files per specification:
        // - app/_layout.tsx: tracked under dedicated PR #109 (D-229)
        // - src/utils/safeLog.ts: the designated, single authorized logging helper
        if (relativePath === 'app/_layout.tsx' || relativePath === 'src/utils/safeLog.ts') {
          continue
        }

        const sourceCode = fs.readFileSync(filePath, 'utf8')
        const sourceFile = ts.createSourceFile(
          filePath,
          sourceCode,
          ts.ScriptTarget.Latest,
          true
        )

        function walk(node: ts.Node) {
          // Detect any Identifier "console" (direct calls, aliases like const log = console.error, .catch(console.*))
          if (ts.isIdentifier(node) && node.text === 'console') {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
            violations.push(
              `${relativePath}:${line + 1}:${character + 1} uses unauthorized console identifier`
            )
          }
          ts.forEachChild(node, walk)
        }

        walk(sourceFile)
      }

      expect(violations).toEqual([])
    })
  })
})
