import { useMemo } from 'react';
import { ServiceFormData, useServiceWizardStore } from '../store/serviceWizardStore';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateStep1(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.serviceType) {
    errors.serviceType = 'اختر نوع الخدمة';
  }
  if (!data.providerType) {
    errors.providerType = 'اختر صفة مقدم الخدمة';
  }
  if (!data.providerName || data.providerName.trim().length < 3) {
    errors.providerName = 'اسم مقدم الخدمة لازم يكون 3 أحرف على الأقل';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep2(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const totalImages = (data.images?.length || 0) + (data.existingImages?.length || 0);

  if (totalImages < 1) {
    errors.images = 'أضف صورة واحدة على الأقل';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep3(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'العنوان لازم يكون 3 أحرف على الأقل';
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'الوصف لازم يكون 10 أحرف على الأقل';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep4(_data: ServiceFormData): ValidationResult {
  return { isValid: true, errors: {} };
}

export function validateStep5(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.priceFrom === null || isNaN(data.priceFrom) || data.priceFrom <= 0) {
    errors.priceFrom = 'أدخل سعر الخدمة';
  } else if (
    data.priceTo !== null &&
    !isNaN(data.priceTo) &&
    data.priceTo < data.priceFrom
  ) {
    errors.priceTo = 'السعر الأعلى لازم يكون أكبر من أو يساوي السعر الأدنى';
  }

  if (data.governorateId === null) {
    errors.governorateId = 'اختر المحافظة';
  }
  if (data.wilayaId === null) {
    errors.wilayaId = 'اختر الولاية';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateStep(step: number, formData: ServiceFormData): ValidationResult {
  switch (step) {
    case 1:
      return validateStep1(formData);
    case 2:
      return validateStep2(formData);
    case 3:
      return validateStep3(formData);
    case 4:
      return validateStep4(formData);
    case 5:
      return validateStep5(formData);
    case 6:
      return { isValid: true, errors: {} };
    default:
      return { isValid: true, errors: {} };
  }
}

export function useServiceValidation(step: number): ValidationResult {
  const formData = useServiceWizardStore((state) => state.formData);
  return useMemo(() => validateStep(step, formData), [step, formData]);
}

export interface MappedServiceBackendErrors {
  fieldErrors: Record<string, string>;
  firstInvalidStep: number | null;
}

const SERVICE_FIELD_STEP_MAP: Record<string, number> = {
  serviceType: 1,
  providerType: 1,
  providerName: 1,
  images: 2,
  title: 3,
  description: 3,
  specializations: 3,
  isHomeService: 3,
  workingDays: 4,
  workingHours: 4,
  workingHoursOpen: 4,
  workingHoursClose: 4,
  priceFrom: 5,
  priceTo: 5,
  governorateId: 5,
  wilayaId: 5,
  address: 5,
  website: 5,
  currency: 5,
  latitude: 5,
  longitude: 5,
  whatsappEnabled: 5,
};

const STEP_FIELDS_MAP: Record<number, readonly string[]> = {
  1: ['serviceType', 'providerType', 'providerName'],
  2: ['images'],
  3: ['title', 'description', 'specializations', 'isHomeService'],
  4: ['workingDays', 'workingHours'],
  5: ['priceFrom', 'priceTo', 'governorateId', 'wilayaId', 'address', 'website'],
};

const FIELD_ARABIC_FALLBACKS: Record<string, string> = {
  serviceType: 'نوع الخدمة المحدد غير صالح',
  providerType: 'صفة مقدم الخدمة غير صالحة',
  providerName: 'اسم مقدم الخدمة غير صالح',
  images: 'يجب إضافة صورة واحدة صالحة على الأقل',
  title: 'عنوان الخدمة غير صالح',
  description: 'وصف الخدمة غير صالح',
  specializations: 'التخصصات المدخلة غير صالحة',
  isHomeService: 'قيمة الخدمة المنزلية غير صالحة',
  workingDays: 'أيام العمل المحددة غير صالحة',
  workingHours: 'أوقات العمل المحددة غير صالحة',
  priceFrom: 'السعر الأدنى غير صالح',
  priceTo: 'السعر الأعلى يجب أن يكون أكبر من أو يساوي السعر الأدنى',
  governorateId: 'المحافظة المحددة غير صالحة',
  wilayaId: 'الولاية المحددة غير صالحة',
  address: 'العنوان التفصيلي غير صالح',
  website: 'رابط الموقع الإلكتروني غير صالح',
  currency: 'العملة المحددة غير صالحة',
  latitude: 'إحداثيات الموقع غير صالحة',
  longitude: 'إحداثيات الموقع غير صالحة',
  whatsappEnabled: 'خيار الواتساب غير صالح',
};

const LOWERCASE_FIELD_LOOKUP: Record<string, string> = Object.keys(SERVICE_FIELD_STEP_MAP).reduce(
  (acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  },
  {} as Record<string, string>
);

const ORDERED_ENGLISH_FIELD_KEYS = [
  'serviceType',
  'providerType',
  'providerName',
  'workingHoursOpen',
  'workingHoursClose',
  'workingHours',
  'workingDays',
  'specializations',
  'isHomeService',
  'governorateId',
  'wilayaId',
  'priceTo',
  'priceFrom',
  'description',
  'whatsappEnabled',
  'longitude',
  'latitude',
  'currency',
  'address',
  'website',
  'images',
  'title',
] as const;

const ARABIC_MESSAGE_FIELD_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/السعر الأعلى|الحد الأعلى للسعر/, 'priceTo'],
  [/السعر الأدنى|سعر الخدمة/, 'priceFrom'],
  [/صورة|الصور/, 'images'],
  [/نوع الخدمة/, 'serviceType'],
  [/صفة مقدم/, 'providerType'],
  [/اسم مقدم|مقدم الخدمة/, 'providerName'],
  [/أيام العمل/, 'workingDays'],
  [/ساعات العمل|أوقات العمل|وقت الفتح|وقت الإغلاق/, 'workingHours'],
  [/المحافظة/, 'governorateId'],
  [/الولاية/, 'wilayaId'],
  [/العنوان التفصيلي/, 'address'],
  [/الموقع الإلكتروني/, 'website'],
  [/العنوان|عنوان الإعلان/, 'title'],
  [/الوصف/, 'description'],
];

const ENGLISH_CONTAINS_ARABIC = /[\u0600-\u06FF]/;

export function getServiceStepFields(step: number): readonly string[] {
  return STEP_FIELDS_MAP[step] ?? [];
}

function canonicalizeServiceFieldKey(rawField: string): string | null {
  const base = rawField.trim().split(/[.[\]]/)[0];
  if (!base) return null;

  const normalized = SERVICE_FIELD_STEP_MAP[base]
    ? base
    : (LOWERCASE_FIELD_LOOKUP[base.toLowerCase()] ?? null);

  if (!normalized) return null;

  if (normalized === 'workingHoursOpen' || normalized === 'workingHoursClose') {
    return 'workingHours';
  }
  return normalized;
}

function resolveArabicFieldMessage(field: string, rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (trimmed && ENGLISH_CONTAINS_ARABIC.test(trimmed)) {
    return trimmed;
  }
  return FIELD_ARABIC_FALLBACKS[field] ?? 'القيمة المدخلة غير صالحة';
}

function inferServiceFieldFromMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  for (const [pattern, field] of ARABIC_MESSAGE_FIELD_PATTERNS) {
    if (pattern.test(trimmed)) {
      return field;
    }
  }

  const leadingMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)(?:[.\[\s:]|$)/);
  if (leadingMatch) {
    const candidate = canonicalizeServiceFieldKey(leadingMatch[1]);
    if (candidate) return candidate;
  }

  const subjectRegex = new RegExp(
    `\\b(${ORDERED_ENGLISH_FIELD_KEYS.join('|')})\\b\\s+(?:must|should|is|cannot|can't)`,
    'i'
  );
  const subjectMatch = trimmed.match(subjectRegex);
  if (subjectMatch) {
    const candidate = canonicalizeServiceFieldKey(subjectMatch[1]);
    if (candidate) return candidate;
  }

  for (const key of ORDERED_ENGLISH_FIELD_KEYS) {
    if (new RegExp(`\\b${key}\\b`, 'i').test(trimmed)) {
      return canonicalizeServiceFieldKey(key);
    }
  }

  return null;
}

function extractFirstMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const msg = extractFirstMessage(entry);
      if (msg) return msg;
    }
  }
  return null;
}

function unwrapValidationPayload(errorResponse: unknown): {
  status: number | null;
  data: Record<string, unknown> | null;
} {
  if (!errorResponse || typeof errorResponse !== 'object') {
    return { status: null, data: null };
  }

  const root = errorResponse as Record<string, unknown>;
  if (root.response && typeof root.response === 'object') {
    const resp = root.response as Record<string, unknown>;
    const status = typeof resp.status === 'number' ? resp.status : null;
    const data =
      resp.data && typeof resp.data === 'object' ? (resp.data as Record<string, unknown>) : null;
    return { status, data };
  }

  if (typeof root.status === 'number' && root.data && typeof root.data === 'object') {
    return { status: root.status, data: root.data as Record<string, unknown> };
  }

  const status = typeof root.statusCode === 'number' ? root.statusCode : null;
  return { status, data: root };
}

/**
 * Pure helper mapping backend 400/422 DTO validation errors (Arabic or English,
 * NestJS ValidationPipe array/string or structured field map) to inline wizard
 * field errors and the earliest affected wizard step.
 */
export function mapServiceBackendErrors(errorResponse: unknown): MappedServiceBackendErrors {
  const { status, data } = unwrapValidationPayload(errorResponse);

  if (status !== null && status !== 400 && status !== 422) {
    return { fieldErrors: {}, firstInvalidStep: null };
  }

  if (!data) {
    return { fieldErrors: {}, firstInvalidStep: null };
  }

  const fieldErrors: Record<string, string> = {};
  const assignFieldError = (rawField: string, rawMsg: string) => {
    const field = canonicalizeServiceFieldKey(rawField);
    if (!field || fieldErrors[field]) return;
    fieldErrors[field] = resolveArabicFieldMessage(field, rawMsg);
  };

  // 1. Structured dictionary: data.errors or data.fieldErrors as object
  const mapSource =
    data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)
      ? (data.errors as Record<string, unknown>)
      : data.fieldErrors &&
          typeof data.fieldErrors === 'object' &&
          !Array.isArray(data.fieldErrors)
        ? (data.fieldErrors as Record<string, unknown>)
        : null;

  if (mapSource) {
    for (const [key, val] of Object.entries(mapSource)) {
      const msg = extractFirstMessage(val);
      if (msg) {
        assignFieldError(key, msg);
      }
    }
  }

  // 2. Array of error objects or strings: data.errors (array) or data.message (array)
  const listSources = [data.errors, data.message].filter(Array.isArray) as unknown[][];
  for (const list of listSources) {
    for (const entry of list) {
      if (typeof entry === 'string') {
        const inferredField = inferServiceFieldFromMessage(entry);
        if (inferredField) {
          assignFieldError(inferredField, entry);
        }
        continue;
      }

      if (entry && typeof entry === 'object') {
        const item = entry as Record<string, unknown>;
        const rawField = item.field ?? item.property ?? item.path;
        let msg = extractFirstMessage(item.message);
        if (!msg && item.constraints && typeof item.constraints === 'object') {
          msg = extractFirstMessage(Object.values(item.constraints as Record<string, unknown>));
        }

        if (typeof rawField === 'string' && msg) {
          assignFieldError(rawField, msg);
        } else if (msg) {
          const inferredField = inferServiceFieldFromMessage(msg);
          if (inferredField) {
            assignFieldError(inferredField, msg);
          }
        }
      }
    }
  }

  // 3. Single string message (e.g. normalized by GlobalExceptionFilter)
  if (typeof data.message === 'string') {
    const inferredField = inferServiceFieldFromMessage(data.message);
    if (inferredField) {
      assignFieldError(inferredField, data.message);
    }
  }

  const steps = Object.keys(fieldErrors)
    .map((key) => SERVICE_FIELD_STEP_MAP[key])
    .filter((step): step is number => typeof step === 'number');

  const firstInvalidStep = steps.length > 0 ? Math.min(...steps) : null;

  return { fieldErrors, firstInvalidStep };
}
