import fs from 'fs'
import path from 'path'
import axios, { AxiosError } from 'axios'
import { showPublishErrorDialog } from '../utils/publishErrorDialog'
import { dialogService } from '../store/dialogStore'
import { uploadAndReconcileEquipmentImages } from '../utils/equipment/equipmentWizardSubmitHelpers'
import { uploadsApi } from '../api/uploads'

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    show: jest.fn(),
    alert: jest.fn(),
    confirm: jest.fn(),
    hide: jest.fn(),
  },
}))

jest.mock('../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
  },
}))

describe('1.8 Offline Publish Error Dialog & Unwrapped uploadErr (D-327)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('showPublishErrorDialog', () => {
    it('shows offline dialog with retry button on ERR_NETWORK and calls onRetry when pressed', () => {
      const err = new AxiosError('Network Error', 'ERR_NETWORK')
      const onRetry = jest.fn()

      showPublishErrorDialog({
        error: err,
        fallbackMessage: 'تعذر نشر الإعلان، يرجى التحقق من المدخلات',
        onRetry,
      })

      expect(dialogService.show).toHaveBeenCalledTimes(1)
      const config = (dialogService.show as jest.Mock).mock.calls[0][0]
      expect(config.type).toBe('offline')
      expect(config.title).toBe('لا يوجد اتصال')
      expect(config.message).not.toContain('يرجى التحقق من المدخلات')

      const retryAction = config.actions.find((a: any) => a.text === 'إعادة المحاولة')
      expect(retryAction).toBeDefined()
      retryAction.onPress()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows offline alert without retry button when onRetry is omitted', () => {
      const err = new AxiosError('Network Error', 'ERR_NETWORK')

      showPublishErrorDialog({
        error: err,
        fallbackMessage: 'تعذر نشر الإعلان',
      })

      expect(dialogService.show).not.toHaveBeenCalled()
      expect(dialogService.alert).toHaveBeenCalledWith(
        'لا يوجد اتصال',
        expect.any(String),
        'offline'
      )
    })

    it('shows timeout dialog WITHOUT retry button or auto-retry even when onRetry is provided', () => {
      const timeoutErr = new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED')
      const onRetry = jest.fn()

      showPublishErrorDialog({
        error: timeoutErr,
        fallbackMessage: 'تعذر نشر الإعلان',
        onRetry,
      })

      expect(dialogService.show).not.toHaveBeenCalled()
      expect(onRetry).not.toHaveBeenCalled()
      expect(dialogService.alert).toHaveBeenCalledWith(
        'انتهت مهلة الاتصال',
        expect.any(String),
        'offline'
      )

      jest.clearAllMocks()
      const etimedoutErr = new AxiosError('connect ETIMEDOUT', 'ETIMEDOUT')
      showPublishErrorDialog({
        error: etimedoutErr,
        fallbackMessage: 'تعذر نشر الإعلان',
        onRetry,
      })
      expect(dialogService.show).not.toHaveBeenCalled()
      expect(dialogService.alert).toHaveBeenCalledWith(
        'انتهت مهلة الاتصال',
        expect.any(String),
        'offline'
      )
    })

    it('delegates 400 / 409 / 429 / 500 errors to showErrorDialog with red error icon', () => {
      for (const status of [400, 409, 429, 500]) {
        jest.clearAllMocks()
        const err = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
          status,
          data: { message: `خطأ ${status}` },
        } as any)

        showPublishErrorDialog({
          error: err,
          fallbackMessage: 'تعذر نشر الإعلان',
          onRetry: jest.fn(),
        })

        expect(dialogService.show).not.toHaveBeenCalled()
        expect(dialogService.alert).toHaveBeenCalledWith('خطأ', expect.any(String), 'error')
      }
    })
  })

  describe('equipmentWizardSubmitHelpers uploadErr preservation', () => {
    it('rethrows original AxiosError on ERR_NETWORK without wrapping in new Error', async () => {
      const networkErr = new AxiosError('Network Error', 'ERR_NETWORK')
      ;(uploadsApi.single as jest.Mock).mockRejectedValueOnce(networkErr)

      let caught: unknown
      try {
        await uploadAndReconcileEquipmentImages([{ uri: 'file:///tmp/photo.jpg' }], [])
      } catch (e) {
        caught = e
      }

      expect(caught).toBe(networkErr)
      expect(axios.isAxiosError(caught)).toBe(true)
      expect((caught as AxiosError).code).toBe('ERR_NETWORK')
    })
  })

  describe('All 7 publish screens wiring & unwrapped uploadErr contract', () => {
    const root = path.resolve(__dirname, '../..')

    it('unwraps uploadErr in cars/new.tsx, services/new.tsx, and equipmentWizardSubmitHelpers.ts', () => {
      const files = [
        'app/cars/new.tsx',
        'app/services/new.tsx',
        'src/utils/equipment/equipmentWizardSubmitHelpers.ts',
      ]
      for (const rel of files) {
        const src = fs.readFileSync(path.join(root, rel), 'utf8')
        expect(src).not.toMatch(/throw new Error\(serverMsg/)
      }
    })

    it('wires showPublishErrorDialog and useRef double-tap lock in all 7 publish screens', () => {
      const screens = [
        'app/parts/new.tsx',
        'app/cars/new.tsx',
        'app/buses/new.tsx',
        'app/equipment/new.tsx',
        'app/services/new.tsx',
        'app/equipment/operators/add.tsx',
        'app/equipment/operators/edit/[id].tsx',
      ]
      for (const rel of screens) {
        const src = fs.readFileSync(path.join(root, rel), 'utf8')
        expect(src).toMatch(/showPublishErrorDialog/)
        expect(src).toMatch(/useRef<boolean>\(false\)|useRef\(false\)/)
      }

      // parts/new.tsx must no longer bypass showPublishErrorDialog with generic input error alert
      const partsSrc = fs.readFileSync(path.join(root, 'app/parts/new.tsx'), 'utf8')
      expect(partsSrc).not.toMatch(/dialogService\.alert\('خطأ',\s*Array\.isArray\(msg\)/)
    })
  })
})
