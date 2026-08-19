import assert from 'assert'
// ════════════════════════════════════════════════════════════════════════════
// 100% DIRECT IMPORTS FROM THE REAL REPOSITORY SOURCE CODE
// ════════════════════════════════════════════════════════════════════════════
import { validateOperatorStep } from '../hooks/useOperatorValidation'
import {
  OPERATOR_ROLES,
  OPERATOR_ROLE_TABS,
  AVAILABLE_EQUIPMENT,
  OPERATOR_EXPERIENCE_RANGES,
} from '../constants/operators'
import { OperatorFormData } from '../types/operatorForm.types'

console.log('🚀 Executing Automated Verification DIRECTLY from Actual Project Files...\n')

// 1. Test validateOperatorStep directly from src/hooks/useOperatorValidation.ts
console.log('--- 1. Testing validateOperatorStep from src/hooks/useOperatorValidation.ts ---')

// 1.1 Step 1 Empty
const emptyForm1: OperatorFormData = {
  title: '',
  description: '',
  governorateId: null,
  wilayaId: null,
  governorateName: '',
  wilayaName: '',
  contactPhone: '',
  whatsapp: '',
  operatorType: '',
  experienceYears: '',
  equipmentTypes: [],
  certifications: [],
  specializations: [],
  dailyRate: '',
  hourlyRate: '',
  isPriceNegotiable: false,
}

const resStep1Empty = validateOperatorStep(1, emptyForm1)
assert.strictEqual(resStep1Empty.isValid, false, 'Step 1 must fail when empty')
assert.ok(resStep1Empty.errors.operatorType, 'Should have operatorType error from real hook')
assert.ok(resStep1Empty.errors.title, 'Should have title error from real hook')
assert.ok(resStep1Empty.errors.experienceYears, 'Should have experienceYears error from real hook')
assert.ok(resStep1Empty.errors.description, 'Should have description error from real hook')
console.log('  ✅ [REAL HOOK] Step 1 Empty Form correctly returned all 4 required errors')

// 1.2 Step 1 Valid
const validForm1: OperatorFormData = {
  ...emptyForm1,
  operatorType: 'OPERATOR',
  title: 'مشغل حفارات ومعدات ثقيلة',
  experienceYears: '7',
  description: 'خبرة طويلة في مشاريع الحفر والبنية التحتية والتشغيل الميداني',
}
const resStep1Valid = validateOperatorStep(1, validForm1)
assert.strictEqual(resStep1Valid.isValid, true, 'Step 1 must pass with valid data')
assert.strictEqual(Object.keys(resStep1Valid.errors).length, 0)
console.log('  ✅ [REAL HOOK] Step 1 Valid Form returned isValid: true and 0 errors')

// 1.3 Step 2 Empty
const resStep2Empty = validateOperatorStep(2, emptyForm1)
assert.strictEqual(resStep2Empty.isValid, false, 'Step 2 must fail when empty')
assert.ok(resStep2Empty.errors.equipmentTypes, 'Should require equipmentTypes')
assert.ok(resStep2Empty.errors.certifications, 'Should require certifications')
console.log('  ✅ [REAL HOOK] Step 2 Empty Form correctly returned equipment and certs errors')

// 1.4 Step 2 Valid
const validForm2: OperatorFormData = {
  ...validForm1,
  equipmentTypes: ['حفار', 'لودر'],
  certifications: ['رخصة قيادة معدات ثقيلة ROP'],
}
const resStep2Valid = validateOperatorStep(2, validForm2)
assert.strictEqual(resStep2Valid.isValid, true, 'Step 2 must pass with valid data')
console.log('  ✅ [REAL HOOK] Step 2 Valid Form returned isValid: true')

// 1.5 Step 3 Empty
const resStep3Empty = validateOperatorStep(3, emptyForm1)
assert.strictEqual(resStep3Empty.isValid, false, 'Step 3 must fail when empty')
assert.ok(resStep3Empty.errors.dailyRate)
assert.ok(resStep3Empty.errors.hourlyRate)
assert.ok(resStep3Empty.errors.governorate)
assert.ok(resStep3Empty.errors.city)
assert.ok(resStep3Empty.errors.contactPhone)
assert.ok(resStep3Empty.errors.whatsapp)
console.log('  ✅ [REAL HOOK] Step 3 Empty Form correctly returned 6 rate/location/contact errors')

// 1.6 Step 3 Valid
const validForm3: OperatorFormData = {
  ...validForm2,
  dailyRate: '40',
  hourlyRate: '5',
  governorateId: 1,
  wilayaId: 10,
  contactPhone: '96891234567',
  whatsapp: '96891234567',
}
const resStep3Valid = validateOperatorStep(3, validForm3)
assert.strictEqual(resStep3Valid.isValid, true, 'Step 3 must pass with valid data')
console.log('  ✅ [REAL HOOK] Step 3 Valid Form returned isValid: true\n')

// 2. Test Real Constants from src/constants/operators.ts
console.log('--- 2. Testing Constants directly from src/constants/operators.ts ---')
assert.strictEqual(OPERATOR_ROLES.length, 4, 'Must have exactly 4 roles')
assert.strictEqual(OPERATOR_ROLE_TABS.length, 5, 'Must have 5 tabs (all + 4 roles)')
assert.strictEqual(AVAILABLE_EQUIPMENT.length, 12, 'Must have 12 equipment catalog items')
assert.strictEqual(OPERATOR_EXPERIENCE_RANGES.length, 4, 'Must have 4 experience ranges')
console.log('  ✅ [REAL CONSTANTS] All constants exports are intact and accurately defined\n')

console.log('🎉 DIRECT SOURCE CODE VERIFICATION PASSED WITH 100% SUCCESS!')
