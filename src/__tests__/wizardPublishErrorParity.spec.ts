import fs from 'fs'
import path from 'path'
import { AxiosError } from 'axios'
import { toastService } from '../store/toastStore'
import { mapCarBackendErrors } from '../hooks/useCarValidation'
import { mapServiceBackendErrors } from '../hooks/useServiceValidation'

const ROOT = path.resolve(__dirname, '../..')

jest.mock('../store/toastStore', () => ({
  toastService: {
    show: jest.fn(),
    confirm: jest.fn(),
    hide: jest.fn(),
  },
}))

type VerticalKey = 'cars' | 'buses' | 'equipment' | 'parts' | 'services'

const VERTICALS: Array<{
  key: VerticalKey
  screenPath: string
  has409EditRefetch: boolean
  has409Create: boolean
  usesSharedHandler: boolean
  resetsOnSuccess: boolean
}> = [
  {
    key: 'cars',
    screenPath: 'app/cars/new.tsx',
    has409EditRefetch: true,
    has409Create: true,
    usesSharedHandler: true,
    resetsOnSuccess: true,
  },
  {
    key: 'buses',
    screenPath: 'app/buses/new.tsx',
    has409EditRefetch: true,
    has409Create: true,
    usesSharedHandler: true,
    resetsOnSuccess: true,
  },
  {
    key: 'equipment',
    screenPath: 'app/equipment/new.tsx',
    has409EditRefetch: true,
    has409Create: true,
    usesSharedHandler: true,
    resetsOnSuccess: true,
  },
  {
    key: 'parts',
    screenPath: 'app/parts/new.tsx',
    has409EditRefetch: true,
    has409Create: true,
    usesSharedHandler: true,
    // parts resets in PublishSuccessView actions to preserve partial-image-failure retry & imageLedger
    resetsOnSuccess: false,
  },
  {
    key: 'services',
    screenPath: 'app/services/new.tsx',
    has409EditRefetch: false,
    has409Create: false,
    usesSharedHandler: false,
    resetsOnSuccess: true,
  },
]

describe('D-351: Wizard Publish Error Parity & Reset-on-Success', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(VERTICALS)(
    '$key: wires required error-handler and reset-on-success parity',
    ({ screenPath, usesSharedHandler, has409EditRefetch, has409Create, resetsOnSuccess }) => {
      const src = fs.readFileSync(path.join(ROOT, screenPath), 'utf8')
      if (usesSharedHandler) {
        expect(src).toMatch(/handlePublishMutationError/)
      }
      if (has409Create) {
        expect(src).toMatch(/handlePublishMutationError|status === 409/)
      }
      if (has409EditRefetch) {
        expect(src).toMatch(/handlePublishMutationError|getById/)
      }
      if (resetsOnSuccess) {
        // Every vertical must reset draft inside mutation onSuccess (not only on PublishSuccessView buttons)
        const onSuccessMatch = src.match(/onSuccess:\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{[\s\S]*?setPublishSuccess/)
        expect(onSuccessMatch).not.toBeNull()
        expect(onSuccessMatch![0]).toMatch(/reset(?:Draft|Form)?\(\)/)
      }
    }
  )

  it('equipment image step uses a named constant instead of literal maxImages={10}', () => {
    const stepSrc = fs.readFileSync(
      path.join(ROOT, 'src/components/equipment/wizard/EquipmentStep2Images.tsx'),
      'utf8'
    )
    expect(stepSrc).not.toMatch(/maxImages=\{10\}/)
    expect(stepSrc).toMatch(/MAX_EQUIPMENT_IMAGES/)
  })

  it('cars and services backend 400 error mappers extract fieldErrors and firstInvalidStep', () => {
    const carMapped = mapCarBackendErrors({
      fieldErrors: [{ field: 'price', message: 'السعر غير صالح' }],
    })
    expect(carMapped.fieldErrors.price).toBe('السعر غير صالح')
    expect(carMapped.firstInvalidStep).not.toBeNull()

    const serviceMapped = mapServiceBackendErrors({
      response: {
        status: 400,
        data: {
          fieldErrors: { title: 'العنوان مطلوب' },
        },
      },
    })
    expect(serviceMapped.fieldErrors.title).toBe('العنوان مطلوب')
    expect(serviceMapped.firstInvalidStep).not.toBeNull()
  })

  it('shared handlePublishMutationError handles the full 6-case error matrix across cars/buses/equipment/parts', async () => {
    const { handlePublishMutationError } = require('../utils/publishErrorDialog')
    const {
      mapBusBackendErrors,
      mapEquipmentBackendErrors,
      mapPartBackendErrors,
    } = require('../utils/wizardBackendErrors')

    const matrix: Array<{
      vertical: string
      mapper: (data: unknown) => { fieldErrors: Record<string, string>; firstInvalidStep: number | null }
      sampleField: string
    }> = [
      { vertical: 'cars', mapper: mapCarBackendErrors, sampleField: 'price' },
      { vertical: 'buses', mapper: mapBusBackendErrors, sampleField: 'price' },
      { vertical: 'equipment', mapper: mapEquipmentBackendErrors, sampleField: 'title' },
      { vertical: 'parts', mapper: mapPartBackendErrors, sampleField: 'title' },
    ]

    for (const { mapper, sampleField } of matrix) {
      jest.clearAllMocks()
      const onFieldErrors = jest.fn()
      const onRetry = jest.fn()
      const onRefetchVersion = jest.fn().mockResolvedValue(undefined)

      // 1. 400 field map -> maps fieldErrors, jumps to firstInvalidStep, alerts
      handlePublishMutationError({
        error: {
          response: {
            status: 400,
            data: { fieldErrors: [{ field: sampleField, message: 'قيمة غير صالحة' }] },
          },
        },
        isEdit: false,
        fallbackMessage: 'fallback',
        mapBackendErrors: mapper,
        onFieldErrors,
      })
      expect(onFieldErrors).toHaveBeenCalledWith(
        expect.objectContaining({ [sampleField]: 'قيمة غير صالحة' }),
        expect.any(Number)
      )
      expect(toastService.show).toHaveBeenCalledWith({
        kind: 'warning',
        title: 'قيمة غير صالحة',
      })

      // 2. 409 create -> similar-ad message
      jest.clearAllMocks()
      handlePublishMutationError({
        error: { response: { status: 409 } },
        isEdit: false,
        fallbackMessage: 'fallback',
      })
      expect(toastService.show).toHaveBeenCalledWith({
        kind: 'error',
        title: 'تم نشر إعلان مشابه جداً مؤخراً، يرجى الانتظار قليلاً',
      })

      // 3. 409 edit -> confirm dialog that invokes onRefetchVersion
      jest.clearAllMocks()
      handlePublishMutationError({
        error: { response: { status: 409 } },
        isEdit: true,
        fallbackMessage: 'fallback',
        onRefetchVersion,
      })
      expect(toastService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'تحديث مطلوب',
          message: expect.stringContaining('تم تعديله من جهاز آخر'),
          confirmLabel: 'تحديث الآن',
          cancelLabel: 'إلغاء',
          onConfirm: expect.any(Function),
        })
      )
      const confirmCb = (toastService.confirm as jest.Mock).mock.calls[0][0].onConfirm
      await confirmCb()
      expect(onRefetchVersion).toHaveBeenCalledTimes(1)
      expect(toastService.show).toHaveBeenCalledWith({
        kind: 'success',
        title: 'تم تحديث النسخة، يمكنك الآن مراجعة بياناتك ومحاولة الحفظ مجدداً',
      })

      // 4. 429 -> existing rate-limit message
      jest.clearAllMocks()
      handlePublishMutationError({
        error: { response: { status: 429, headers: { 'retry-after': '120' } } },
        isEdit: false,
        fallbackMessage: 'fallback',
      })
      expect(toastService.show).toHaveBeenCalledWith({
        kind: 'error',
        title: expect.stringContaining('الحد'),
      })

      // 5. offline -> showPublishErrorDialog offline with retry
      jest.clearAllMocks()
      handlePublishMutationError({
        error: new AxiosError('Network Error', 'ERR_NETWORK'),
        isEdit: false,
        fallbackMessage: 'fallback',
        onRetry,
      })
      expect(toastService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'لا يوجد اتصال',
          confirmLabel: 'إعادة المحاولة',
        })
      )

      // 6. timeout -> showPublishErrorDialog timeout without retry
      jest.clearAllMocks()
      handlePublishMutationError({
        error: new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED'),
        isEdit: false,
        fallbackMessage: 'fallback',
        onRetry,
      })
      expect(toastService.show).toHaveBeenCalledWith({
        kind: 'error',
        title: 'انتهت مهلة الاتصال بالخادم، يرجى التحقق من اتصالك قبل المحاولة مجدداً',
        dedupeKey: 'network-offline',
      })
    }
  })
})
