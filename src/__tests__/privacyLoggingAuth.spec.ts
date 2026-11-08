import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import {
  safeErrorInfo,
  logError,
  logWarn,
  logInfo,
  ALLOWED_ERROR_NAMES,
  ALLOWED_ERROR_CODES,
} from '../utils/safeLog'
import { storeRotatedTokens } from '../utils/storeRotatedTokens'

describe('D-231: Hardened Safe Error Logging (Never-Throw, Code Allowlist, Prod Classification)', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance

  beforeEach(() => {
    ;(global as any).__DEV__ = true
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

  describe('A42-4: Never-Throw Guarantee', () => {
    it('never throws when getters throw on message, name, code, status, or response', () => {
      const hostileError = {
        get message(): string {
          throw new Error('Hostile message getter')
        },
        get name(): string {
          throw new Error('Hostile name getter')
        },
        get code(): string {
          throw new Error('Hostile code getter')
        },
        get status(): number {
          throw new Error('Hostile status getter')
        },
        get response(): any {
          throw new Error('Hostile response getter')
        },
        get isAxiosError(): boolean {
          throw new Error('Hostile isAxiosError getter')
        },
      }

      expect(() => safeErrorInfo(hostileError)).not.toThrow()
      const res = safeErrorInfo(hostileError)
      expect(typeof res.message).toBe('string')

      expect(() => logError('Hostile', hostileError)).not.toThrow()
      expect(() => logWarn('Hostile', hostileError)).not.toThrow()
      expect(() => logInfo('Hostile', hostileError)).not.toThrow()
    })

    it('never throws when passed a hostile Proxy with throwing traps', () => {
      const hostileProxy = new Proxy(
        {},
        {
          get(_, prop) {
            throw new Error(`Trap on ${String(prop)}`)
          },
        }
      )

      expect(() => safeErrorInfo(hostileProxy)).not.toThrow()
      const res = safeErrorInfo(hostileProxy)
      expect(res).toEqual({ message: 'Unknown error' })

      expect(() => logError('ProxyTest', hostileProxy)).not.toThrow()
    })

    it('handles circular reference objects without recursion or throwing', () => {
      const circular: any = { message: 'Circular error' }
      circular.self = circular
      circular.nested = { parent: circular }

      expect(() => safeErrorInfo(circular)).not.toThrow()
      const res = safeErrorInfo(circular)
      expect(res.message).toBe('Circular error')
    })

    it('handles Object.create(null) objects lacking prototype methods', () => {
      const nullProto: any = Object.create(null)
      nullProto.name = 'TypeError'
      nullProto.message = 'Null proto error'
      nullProto.code = 'ERR_NETWORK'

      expect(() => safeErrorInfo(nullProto)).not.toThrow()
      const res = safeErrorInfo(nullProto)
      expect(res).toEqual({
        name: 'TypeError',
        message: 'Null proto error',
        code: 'ERR_NETWORK',
      })
    })

    it('handles frozen objects safely', () => {
      const frozen = Object.freeze({
        name: 'AxiosError',
        message: 'Forbidden',
        status: 403,
      })

      expect(() => safeErrorInfo(frozen)).not.toThrow()
      const res = safeErrorInfo(frozen)
      expect(res.name).toBe('AxiosError')
      expect(res.message).toBe('Network request failed')
      expect(res.status).toBe(403)
    })
  })

  describe('A42-1: Production Message Classification vs DEV Redaction', () => {
    it('in production (__DEV__=false), message is fixed category ONLY', () => {
      ;(global as any).__DEV__ = false

      // Non-Axios error: fixed category 'Error'
      const customErr = new Error('Super secret sensitive password in message')
      expect(safeErrorInfo(customErr)).toEqual({
        name: 'Error',
        message: 'Error',
      })

      // Axios error: fixed category 'Network request failed'
      const axiosErr = {
        name: 'AxiosError',
        message: 'Request failed: http://secret.internal/leak?token=123',
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
      }
      expect(safeErrorInfo(axiosErr)).toEqual({
        name: 'AxiosError',
        message: 'Network request failed',
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
      })

      // Primitive string in production
      expect(safeErrorInfo('Secret thrown string')).toEqual({
        message: 'Error',
      })
    })

    it('in development (__DEV__=true), message redacts bare query-string secrets without scheme', () => {
      const errWithQuery = new Error(
        'Failed query with token=secretToken123 and password=MyPass999 and key=apiKeyXYZ'
      )
      const res = safeErrorInfo(errWithQuery)

      expect(res.message).not.toContain('secretToken123')
      expect(res.message).not.toContain('MyPass999')
      expect(res.message).not.toContain('apiKeyXYZ')
      expect(res.message).toContain('token=[REDACTED_SECRET]')
      expect(res.message).toContain('password=[REDACTED_SECRET]')
      expect(res.message).toContain('key=[REDACTED_SECRET]')
    })

    it('in development (__DEV__=true), message redacts Arabic-Indic digit runs (7+ digits)', () => {
      const errWithArabicNums = new Error('حدث خطأ للرقم ١٢٣٤٥٦٧٨٩٠ في النظام')
      const res = safeErrorInfo(errWithArabicNums)

      expect(res.message).not.toContain('١٢٣٤٥٦٧٨٩٠')
      expect(res.message).toContain('[REDACTED_NUMBER]')
    })

    it('in development (__DEV__=true), message redacts phone-like digit groups with separators', () => {
      const errWithPhone = new Error(
        'Customer phone +968 9123 4567 or 050-123-4567 could not be verified'
      )
      const res = safeErrorInfo(errWithPhone)

      expect(res.message).not.toContain('9123 4567')
      expect(res.message).not.toContain('050-123-4567')
      expect(res.message).toContain('[REDACTED_PHONE]')
    })

    it('in development (__DEV__=true), message redacts URLs, Bearer, JWT, emails, and long numbers', () => {
      const err = new Error(
        'Failure accessing https://api.souq.om/v1 with Bearer tok-xyz and JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig for user admin@souq.om id 9876543210'
      )
      const res = safeErrorInfo(err)

      expect(res.message).not.toContain('https://api.souq.om/v1')
      expect(res.message).not.toContain('tok-xyz')
      expect(res.message).not.toContain('eyJhbGciOiJIUzI1NiJ9')
      expect(res.message).not.toContain('admin@souq.om')
      expect(res.message).not.toContain('9876543210')

      expect(res.message).toContain('[REDACTED_URL]')
      expect(res.message).toContain('Bearer [REDACTED_TOKEN]')
      expect(res.message).toContain('[REDACTED_JWT]')
      expect(res.message).toContain('[REDACTED_EMAIL]')
      expect(res.message).toContain('[REDACTED_NUMBER]')
    })
  })

  describe('A42-2: Strict Machine Error Code Allowlist', () => {
    it('accepts known machine error codes from the allowlist', () => {
      for (const code of ALLOWED_ERROR_CODES) {
        const res = safeErrorInfo({ name: 'Error', code, message: 'test' })
        expect(res.code).toBe(code)
      }
    })

    it('rejects caller-provided entity IDs or non-allowlisted codes', () => {
      // Rejects numeric IDs
      expect(safeErrorInfo({ code: '12345', message: 'test' }).code).toBeUndefined()
      // Rejects arbitrary fixture IDs
      expect(safeErrorInfo({ code: 'mock-card-id-99', message: 'test' }).code).toBeUndefined()
      // Rejects non-allowlisted server strings
      expect(safeErrorInfo({ code: 'CUSTOM_RANDOM_CODE', message: 'test' }).code).toBeUndefined()
    })

    it('prefers error.code over response.data.code', () => {
      const res = safeErrorInfo({
        code: 'ERR_BAD_REQUEST',
        response: { data: { code: 'ACCOUNT_BANNED' } },
        message: 'test',
      })
      expect(res.code).toBe('ERR_BAD_REQUEST')
    })
  })

  describe('logError / logWarn / logInfo Gating and Safety', () => {
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
      logError('ImageUpload', sampleError)

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ImageUpload]', {
        name: 'AxiosError',
        message: 'Network request failed',
        status: 413,
      })

      const loggedText = JSON.stringify(consoleErrorSpy.mock.calls)
      expect(loggedText).not.toContain('SUPER_SECRET')
      expect(loggedText).not.toContain('do-not-log-me')
    })

    it('in development (__DEV__=true), logWarn outputs sanitized warning', () => {
      logWarn('PostEdit:CarLabels', sampleError)

      expect(consoleWarnSpy).toHaveBeenCalledWith('[PostEdit:CarLabels]', {
        name: 'AxiosError',
        message: 'Network request failed',
        status: 413,
      })
    })

    it('in production (__DEV__=false), logError, logWarn and logInfo are complete no-ops', () => {
      ;(global as any).__DEV__ = false

      logError('AnyTag', sampleError)
      logWarn('AnyTag', sampleError)
      logInfo('AnyTag', sampleError)

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  describe('Real App Module Integration: storeRotatedTokens', () => {
    it('returns false without calling console when invalid data is passed', async () => {
      const result = await storeRotatedTokens(null)
      expect(result).toBe(false)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('AST Static Guard: Zero-Console and Bracket-Access Invariant (app/ & src/)', () => {
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

    it('AST parser verifies NO direct console calls, aliases, catches, or globalThis["console"] bracket accesses', () => {
      const projectRoot = path.resolve(__dirname, '../..')
      const targetDirs = [path.join(projectRoot, 'app'), path.join(projectRoot, 'src')]

      const sourceFiles = targetDirs.flatMap(findSourceFiles)
      expect(sourceFiles.length).toBeGreaterThan(50)

      const violations: string[] = []

      for (const filePath of sourceFiles) {
        const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/')

        // Explicit exclusions per specification:
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
          // Detect any Identifier "console" (direct calls, window.console, globalThis.console, aliases, .catch)
          if (ts.isIdentifier(node) && node.text === 'console') {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
            violations.push(
              `${relativePath}:${line + 1}:${character + 1} uses unauthorized console identifier`
            )
          }

          // Detect bracket string accesses like globalThis['console'] or window['console']
          if (
            ts.isElementAccessExpression(node) &&
            ts.isStringLiteral(node.argumentExpression) &&
            node.argumentExpression.text === 'console'
          ) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
            violations.push(
              `${relativePath}:${line + 1}:${character + 1} uses unauthorized bracket access ['console']`
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
