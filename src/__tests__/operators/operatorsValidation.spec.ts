import {
  mapOperatorBackendErrors,
  getOperatorFirstInvalidStep,
} from '../../hooks/useOperatorValidation'
import {
  requestPermission,
  operatorCertPermissionAdapter,
  operatorAvatarPermissionAdapter,
} from '../../utils/requestPermission'
import { dialogService } from '../../store/dialogStore'
import * as ImagePicker from 'expo-image-picker'
import { Linking } from 'react-native'

describe('Operators Pure Validation & Permission Adapters (D-281)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. mapOperatorBackendErrors (Pure logic unit tests)
  // ──────────────────────────────────────────────────────────────────────────
  describe('mapOperatorBackendErrors (S7 / PR #163)', () => {
    it('maps structured fieldErrors for OPERATORS_ALLOWED_FIELDS to Step 1 fields', () => {
      const backendRes = {
        fieldErrors: {
          title: 'عنوان الإعلان قصير جداً',
          operatorType: 'نوع الدور غير صالح',
          description: 'النبذة يجب ألا تقل عن 10 أحرف',
        },
      }
      const mapped = mapOperatorBackendErrors(backendRes)
      expect(mapped.hasFieldErrors).toBe(true)
      expect(mapped.firstInvalidStep).toBe(1)
      expect(mapped.fieldErrors.title).toBe('عنوان الإعلان قصير جداً')
      expect(mapped.fieldErrors.operatorType).toBe('نوع الدور غير صالح')
      expect(mapped.fieldErrors.description).toBe('النبذة يجب ألا تقل عن 10 أحرف')
    })

    it('maps structured fieldErrors to Step 2 when only equipment/cert fields fail', () => {
      const backendRes = {
        fieldErrors: {
          equipmentTypes: ['يجب تحديد معدة واحدة على الأقل'],
          certifications: ['يرجى إرفاق الشهادة أو الرخصة'],
        },
      }
      const mapped = mapOperatorBackendErrors(backendRes)
      expect(mapped.hasFieldErrors).toBe(true)
      expect(mapped.firstInvalidStep).toBe(2)
      expect(mapped.fieldErrors.equipmentTypes).toBe('يجب تحديد معدة واحدة على الأقل')
      expect(mapped.fieldErrors.certifications).toBe('يرجى إرفاق الشهادة أو الرخصة')
    })

    it('maps structured fieldErrors to Step 3 when only rate/location fields fail', () => {
      const backendRes = {
        fieldErrors: {
          dailyRate: 'الأجر اليومي غير صالح',
          governorateId: 'المحافظة مطلوبة',
          wilayaId: 'الولاية مطلوبة',
        },
      }
      const mapped = mapOperatorBackendErrors(backendRes)
      expect(mapped.hasFieldErrors).toBe(true)
      expect(mapped.firstInvalidStep).toBe(3)
      expect(mapped.fieldErrors.dailyRate).toBe('الأجر اليومي غير صالح')
      expect(mapped.fieldErrors.governorate).toBe('المحافظة مطلوبة')
      expect(mapped.fieldErrors.city).toBe('الولاية مطلوبة')
    })

    it('handles class-validator string arrays and Arabic keyword fallback', () => {
      const backendRes = {
        message: [
          'title must be longer than 5 characters',
          'يرجى تحديد المحافظة بشكل صحيح',
        ],
      }
      const mapped = mapOperatorBackendErrors(backendRes)
      expect(mapped.hasFieldErrors).toBe(true)
      expect(mapped.firstInvalidStep).toBe(1)
      expect(mapped.fieldErrors.title).toBe('title must be longer than 5 characters')
      expect(mapped.fieldErrors.governorateId).toBe('يرجى تحديد المحافظة بشكل صحيح')
      expect(mapped.fieldErrors.governorate).toBe('يرجى تحديد المحافظة بشكل صحيح')
    })

    it('handles empty or malformed error responses safely', () => {
      expect(mapOperatorBackendErrors(null).hasFieldErrors).toBe(false)
      expect(mapOperatorBackendErrors({}).hasFieldErrors).toBe(false)
      expect(mapOperatorBackendErrors({ message: 'Internal Server Error' }).firstInvalidStep).toBe(1)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Permissions & Upload Adapters (P2 / S4)
  // ──────────────────────────────────────────────────────────────────────────
  describe('requestPermission with Operator Adapters', () => {
    it('redirects to phone settings via dialogService.confirm when permission is denied and blocked', async () => {
      jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValue({
        status: ImagePicker.PermissionStatus.DENIED,
        granted: false,
        canAskAgain: false,
        expires: 'never',
      })
      const confirmSpy = jest.spyOn(dialogService, 'confirm').mockImplementation((title, msg, onConfirm) => {
        onConfirm?.()
      })
      const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue()

      const res = await requestPermission(operatorCertPermissionAdapter)
      expect(res.status).toBe('denied-blocked')
      expect(confirmSpy).toHaveBeenCalledWith(
        'إذن الوصول مطلوب',
        expect.stringContaining('من إعدادات الهاتف'),
        expect.any(Function),
        'فتح الإعدادات',
        'إلغاء'
      )
      expect(openSettingsSpy).toHaveBeenCalled()
    })

    it('returns granted status when user allows media library access', async () => {
      jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValue({
        status: ImagePicker.PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: 'never',
      })

      const res = await requestPermission(operatorAvatarPermissionAdapter)
      expect(res.status).toBe('granted')
      expect(res.granted).toBe(true)
    })
  })
})
