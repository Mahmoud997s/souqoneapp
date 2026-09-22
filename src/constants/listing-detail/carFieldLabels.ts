/**
 * Arabic display labels for vehicle specification fields in the detail page.
 * Reuses the canonical Arabic text from car wizard constants and review step.
 */
export const CAR_FIELD_LABELS: Record<string, string> = {
  // Basic Specifications
  make: 'الشركة المصنعة',
  model: 'الموديل',
  trim: 'الفئة (Trim)',
  year: 'سنة الصنع',
  condition: 'الحالة الفنية',

  // Technical & Physical Specifications
  mileage: 'الممشى',
  transmission: 'ناقل الحركة',
  fuelType: 'نوع الوقود',
  bodyType: 'نوع الهيكل',
  driveType: 'نظام الدفع',
  exteriorColor: 'اللون الخارجي',
  interior: 'الفرش الداخلي',
  engineSize: 'سعة المحرك',
  horsepower: 'القوة الحصانية',
  doors: 'عدد الأبواب',
  seats: 'عدد المقاعد',

  // Features
  features: 'الميزات الإضافية',

  // Rental Conditions
  depositAmount: 'مبلغ التأمين المسترد',
  minRentalDays: 'الحد الأدنى للإيجار',
  kmLimitPerDay: 'حد الكيلومترات اليومي',
  cancellationPolicy: 'سياسة الإلغاء',
  withDriver: 'مع سائق',
  deliveryAvailable: 'توصيل لموقع العميل',
  insuranceIncluded: 'شامل التأمين',
}
