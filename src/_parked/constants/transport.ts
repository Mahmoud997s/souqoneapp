export const TRANSPORT_SERVICE_TYPES: Record<string, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث وعفش',
  CONSTRUCTION: 'مواد بناء',
  HEAVY: 'نقل ثقيل',
  BACKLOAD: 'شحنات مجمعة',
  EQUIPMENT: 'معدات وآليات',
  CARS: 'نقل سيارات',
  LIVESTOCK: 'نقل مواشي',
};

export const TRANSPORT_REQUEST_STATUS: Record<string, string> = {
  OPEN: 'متاح',
  QUOTED: 'عروض مقدمة',
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  EXPIRED: 'منتهي',
};

export const TRANSPORT_QUOTE_STATUS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب',
};

export const TRANSPORT_BOOKING_STATUS: Record<string, string> = {
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

export const CARRIER_VEHICLE_TYPES: Record<string, string> = {
  PICKUP: 'بيك أب',
  VAN: 'شاحنة مغلقة (فان)',
  TRUCK_SMALL: 'شاحنة صغيرة',
  TRUCK_3_TON: 'شاحنة ٣ طن',
  TRUCK_7_TON: 'شاحنة ٧ طن',
  TRUCK_10_TON: 'شاحنة ١٠ طن',
  TRUCK_LARGE: 'شاحنة كبيرة',
  TRAILER: 'قاطرة ومقطورة',
  REFRIGERATED: 'شاحنة تبريد',
  FLATBED: 'سطحة',
  TIPPER: 'قلاب',
  CRANE: 'رافعة (ونش)',
  EXCAVATOR: 'حفارة',
  OTHER: 'أخرى',
};

// Helpers for safe retrieval
export const getServiceLabel = (type: string | undefined): string => {
  if (!type) return '';
  const upper = type.toUpperCase();
  return TRANSPORT_SERVICE_TYPES[upper] || type;
};

export const getRequestStatusLabel = (status: string | undefined): string => {
  if (!status) return '';
  const upper = status.toUpperCase();
  return TRANSPORT_REQUEST_STATUS[upper] || status;
};

export const getQuoteStatusLabel = (status: string | undefined): string => {
  if (!status) return '';
  const upper = status.toUpperCase();
  return TRANSPORT_QUOTE_STATUS[upper] || status;
};

export const getBookingStatusLabel = (status: string | undefined): string => {
  if (!status) return '';
  const upper = status.toUpperCase();
  return TRANSPORT_BOOKING_STATUS[upper] || status;
};

export const getVehicleTypeLabel = (type: string | undefined): string => {
  if (!type) return '';
  const upper = type.toUpperCase();
  return CARRIER_VEHICLE_TYPES[upper] || type;
};
