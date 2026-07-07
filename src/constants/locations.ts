export interface WilayatNode {
  id: string;
  labelAr: string;
}

export interface GovernorateNode {
  id: string;
  legacyId: string;
  altLegacyIds?: string[];
  labelAr: string;
  wilayats: WilayatNode[];
}

// ============================================================================
// 1. SINGLE SOURCE OF TRUTH (Master Location Tree)
// ============================================================================
export const OMAN_LOCATIONS: GovernorateNode[] = [
  {
    id: 'muscat', legacyId: 'OM_MUS', labelAr: 'مسقط',
    wilayats: [
      { id: 'seeb', labelAr: 'السيب' },
      { id: 'bousher', labelAr: 'بوشر' },
      { id: 'muttrah', labelAr: 'مطرح' },
      { id: 'amerat', labelAr: 'العامرات' },
      { id: 'muscat_city', labelAr: 'مسقط' },
      { id: 'qurayyat', labelAr: 'قريات' },
    ]
  },
  {
    id: 'dhofar', legacyId: 'OM_DHO', altLegacyIds: ['OM_DHL'], labelAr: 'ظفار',
    wilayats: [
      { id: 'salalah', labelAr: 'صلالة' },
      { id: 'taqah', labelAr: 'طاقة' },
      { id: 'mirbat', labelAr: 'مرباط' },
      { id: 'thumrait', labelAr: 'ثمريت' },
      { id: 'sadah', labelAr: 'سدح' },
      { id: 'dhalkut', labelAr: 'ضلكوت' },
      { id: 'rakhyut', labelAr: 'رخيوت' },
      { id: 'muqshin', labelAr: 'مقشن' },
      { id: 'shalim', labelAr: 'شليم وجزر الحلانيات' },
      { id: 'mazyunah', labelAr: 'المزيونة' },
    ]
  },
  {
    id: 'batinah_north', legacyId: 'OM_BAN', altLegacyIds: ['OM_BAT'], labelAr: 'شمال الباطنة',
    wilayats: [
      { id: 'sohar', labelAr: 'صحار' },
      { id: 'suwaiq', labelAr: 'السويق' },
      { id: 'khaburah', labelAr: 'الخابورة' },
      { id: 'saham', labelAr: 'صحم' },
      { id: 'liwa', labelAr: 'لوى' },
      { id: 'shinas', labelAr: 'شناص' },
    ]
  },
  {
    id: 'batinah_south', legacyId: 'OM_BAS', altLegacyIds: ['OM_BSS'], labelAr: 'جنوب الباطنة',
    wilayats: [
      { id: 'rustaq', labelAr: 'الرستاق' },
      { id: 'barka', labelAr: 'بركاء' },
      { id: 'mussanah', labelAr: 'المصنعة' },
      { id: 'nakhal', labelAr: 'نخل' },
      { id: 'awabi', labelAr: 'العوابي' },
      { id: 'wadi_maawil', labelAr: 'وادي المعاول' },
    ]
  },
  {
    id: 'dakhiliyah', legacyId: 'OM_DAK', labelAr: 'الداخلية',
    wilayats: [
      { id: 'nizwa', labelAr: 'نزوى' },
      { id: 'samail', labelAr: 'سمائل' },
      { id: 'bahla', labelAr: 'بهلاء' },
      { id: 'adam', labelAr: 'أدم' },
      { id: 'izki', labelAr: 'إزكي' },
      { id: 'bidbid', labelAr: 'بدبد' },
      { id: 'hamra', labelAr: 'الحمراء' },
      { id: 'manah', labelAr: 'منح' },
    ]
  },
  {
    id: 'sharqiyah_north', legacyId: 'OM_SHN', altLegacyIds: ['OM_SHA'], labelAr: 'شمال الشرقية',
    wilayats: [
      { id: 'ibra', labelAr: 'إبراء' },
      { id: 'mudhaibi', labelAr: 'المضيبي' },
      { id: 'bidiya', labelAr: 'بدية' },
      { id: 'qabil', labelAr: 'القابل' },
      { id: 'wadi_bani_khalid', labelAr: 'وادي بني خالد' },
      { id: 'dima_w_tayeen', labelAr: 'دماء والطائيين' },
    ]
  },
  {
    id: 'sharqiyah_south', legacyId: 'OM_SHS', labelAr: 'جنوب الشرقية',
    wilayats: [
      { id: 'sur', labelAr: 'صور' },
      { id: 'jalan_bani_bu_ali', labelAr: 'جعلان بني بو علي' },
      { id: 'kamil_wafi', labelAr: 'الكامل والوافي' },
      { id: 'jalan_bani_bu_hassan', labelAr: 'جعلان بني بو حسن' },
      { id: 'masirah', labelAr: 'مصيرة' },
    ]
  },
  {
    id: 'dhahirah', legacyId: 'OM_DHA', altLegacyIds: ['OM_ZAH'], labelAr: 'الظاهرة',
    wilayats: [
      { id: 'ibri', labelAr: 'عبري' },
      { id: 'yanqul', labelAr: 'ينقل' },
      { id: 'dhank', labelAr: 'ضنك' },
    ]
  },
  {
    id: 'buraimi', legacyId: 'OM_BUR', labelAr: 'البريمي',
    wilayats: [
      { id: 'buraimi_city', labelAr: 'البريمي' },
      { id: 'mahdha', labelAr: 'محضة' },
      { id: 'sunaynah', labelAr: 'السنينة' },
    ]
  },
  {
    id: 'wusta', legacyId: 'OM_WUS', labelAr: 'الوسطى',
    wilayats: [
      { id: 'haima', labelAr: 'هيماء' },
      { id: 'duqm', labelAr: 'الدقم' },
      { id: 'mahout', labelAr: 'محوت' },
      { id: 'jazir', labelAr: 'الجازر' },
    ]
  },
  {
    id: 'musandam', legacyId: 'OM_MSN', labelAr: 'مسندم',
    wilayats: [
      { id: 'khasab', labelAr: 'خصب' },
      { id: 'bukha', labelAr: 'بخا' },
      { id: 'dibba', labelAr: 'دبا' },
      { id: 'madha', labelAr: 'مدحاء' },
    ]
  },
];

// ============================================================================
// 2. DYNAMIC GENERATION OF EXPORTS
// ============================================================================

// A. Filter Types (Used by Search & Filters)
// Expects: { value: 'OM_MUS', labelAr: 'مسقط' }
export const GOVERNORATE_OPTIONS = OMAN_LOCATIONS.map(g => ({
  value: g.legacyId,
  labelAr: g.labelAr
}));

// Expects: { 'OM_MUS': [ { value: 'السيب', labelAr: 'السيب' } ] }
export const WILAYAT_BY_GOVERNORATE: Record<string, { value: string, labelAr: string }[]> = {};
OMAN_LOCATIONS.forEach(g => {
  WILAYAT_BY_GOVERNORATE[g.legacyId] = g.wilayats.map(w => ({
    value: w.labelAr, // Legacy relied on the Arabic string as value
    labelAr: w.labelAr
  }));
});

export const OMAN_GOVERNORATES_AR = OMAN_LOCATIONS.map(g => g.labelAr);

// B. Post Types (Used by the Post/Edit Form)
// Expects: { value: 'muscat', label: 'مسقط' }
export const POST_GOVERNORATES = OMAN_LOCATIONS.map(g => ({
  value: g.id,
  label: g.labelAr
}));

// Expects: { 'muscat': [ { value: 'seeb', label: 'السيب' } ] }
export const POST_CITIES_BY_GOVERNORATE: Record<string, { value: string, label: string }[]> = {};
OMAN_LOCATIONS.forEach(g => {
  POST_CITIES_BY_GOVERNORATE[g.id] = g.wilayats.map(w => ({
    value: w.id,
    label: w.labelAr
  }));
});

// Backward compatibility arrays
export const OMAN_GOVERNORATES = POST_GOVERNORATES;

export const getWilayatsForGovernorate = (governorate: string) => {
  // Try to find by id first (modern)
  let found = OMAN_LOCATIONS.find(g => g.id === governorate);
  // Fallback to legacy arabic name if that's what was passed
  if (!found) found = OMAN_LOCATIONS.find(g => g.labelAr === governorate);
  
  if (!found) return [];
  return found.wilayats.map(w => ({ label: w.labelAr, value: w.labelAr })); // maintain expected format
};

export const getPostGovLabel = (value: string): string => {
  const gov = POST_GOVERNORATES.find(g => g.value === value)
  return gov ? gov.label : value
};

export const getPostCityLabel = (govValue: string, cityValue: string): string => {
  if (!cityValue) return ''
  const gov = OMAN_LOCATIONS.find(g => g.id === govValue || g.labelAr === govValue)
  if (!gov) return cityValue
  const city = gov.wilayats.find(w => w.id === cityValue || w.labelAr === cityValue)
  return city ? city.labelAr : cityValue
};
