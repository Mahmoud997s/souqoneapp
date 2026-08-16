export interface WilayatNode {
  id: string;
  labelAr: string;
  labelEn?: string;
}

export interface GovernorateNode {
  id: string;
  legacyId: string;
  altLegacyIds?: string[];
  labelAr: string;
  labelEn?: string;
  wilayats: WilayatNode[];
}

// ============================================================================
// 1. SINGLE SOURCE OF TRUTH (Master Location Tree)
// ============================================================================
export const OMAN_LOCATIONS: GovernorateNode[] = [
  {
    id: 'muscat', legacyId: 'OM_MUS', labelAr: 'مسقط', labelEn: 'Muscat',
    wilayats: [
      { id: 'seeb', labelAr: 'السيب', labelEn: 'Al Seeb' },
      { id: 'bousher', labelAr: 'بوشر', labelEn: 'Bawshar' },
      { id: 'muttrah', labelAr: 'مطرح', labelEn: 'Muttrah' },
      { id: 'amerat', labelAr: 'العامرات', labelEn: 'Al Amerat' },
      { id: 'muscat_city', labelAr: 'مسقط', labelEn: 'Muscat City' },
      { id: 'qurayyat', labelAr: 'قريات', labelEn: 'Qurayyat' },
    ]
  },
  {
    id: 'dhofar', legacyId: 'OM_DHO', altLegacyIds: ['OM_DHL'], labelAr: 'ظفار', labelEn: 'Dhofar',
    wilayats: [
      { id: 'salalah', labelAr: 'صلالة', labelEn: 'Salalah' },
      { id: 'taqah', labelAr: 'طاقة', labelEn: 'Taqah' },
      { id: 'mirbat', labelAr: 'مرباط', labelEn: 'Mirbat' },
      { id: 'thumrait', labelAr: 'ثمريت', labelEn: 'Thumrait' },
      { id: 'sadah', labelAr: 'سدح', labelEn: 'Sadah' },
      { id: 'dhalkut', labelAr: 'ضلكوت', labelEn: 'Dhalkut' },
      { id: 'rakhyut', labelAr: 'رخيوت', labelEn: 'Rakhyut' },
      { id: 'muqshin', labelAr: 'مقشن', labelEn: 'Muqshin' },
      { id: 'shalim', labelAr: 'شليم وجزر الحلانيات', labelEn: 'Shalim and the Hallaniyat Islands' },
      { id: 'mazyunah', labelAr: 'المزيونة', labelEn: 'Al Mazyunah' },
    ]
  },
  {
    id: 'batinah_north', legacyId: 'OM_BAN', altLegacyIds: ['OM_BAT'], labelAr: 'شمال الباطنة', labelEn: 'Al Batinah North',
    wilayats: [
      { id: 'sohar', labelAr: 'صحار', labelEn: 'Sohar' },
      { id: 'suwaiq', labelAr: 'السويق', labelEn: 'Al Suwaiq' },
      { id: 'khaburah', labelAr: 'الخابورة', labelEn: 'Al Khaburah' },
      { id: 'saham', labelAr: 'صحم', labelEn: 'Saham' },
      { id: 'liwa', labelAr: 'لوى', labelEn: 'Liwa' },
      { id: 'shinas', labelAr: 'شناص', labelEn: 'Shinas' },
    ]
  },
  {
    id: 'batinah_south', legacyId: 'OM_BAS', altLegacyIds: ['OM_BSS'], labelAr: 'جنوب الباطنة', labelEn: 'Al Batinah South',
    wilayats: [
      { id: 'rustaq', labelAr: 'الرستاق', labelEn: 'Al Rustaq' },
      { id: 'barka', labelAr: 'بركاء', labelEn: 'Barka' },
      { id: 'mussanah', labelAr: 'المصنعة', labelEn: 'Al Mussanah' },
      { id: 'nakhal', labelAr: 'نخل', labelEn: 'Nakhal' },
      { id: 'awabi', labelAr: 'العوابي', labelEn: 'Al Awabi' },
      { id: 'wadi_maawil', labelAr: 'وادي المعاول', labelEn: 'Wadi Al Maawil' },
    ]
  },
  {
    id: 'dakhiliyah', legacyId: 'OM_DAK', labelAr: 'الداخلية', labelEn: 'Al Dakhiliyah',
    wilayats: [
      { id: 'nizwa', labelAr: 'نزوى', labelEn: 'Nizwa' },
      { id: 'samail', labelAr: 'سمائل', labelEn: 'Samail' },
      { id: 'bahla', labelAr: 'بهلاء', labelEn: 'Bahla' },
      { id: 'adam', labelAr: 'أدم', labelEn: 'Adam' },
      { id: 'izki', labelAr: 'إزكي', labelEn: 'Izki' },
      { id: 'bidbid', labelAr: 'بدبد', labelEn: 'Bidbid' },
      { id: 'hamra', labelAr: 'الحمراء', labelEn: 'Al Hamra' },
      { id: 'manah', labelAr: 'منح', labelEn: 'Manah' },
    ]
  },
  {
    id: 'sharqiyah_north', legacyId: 'OM_SHN', altLegacyIds: ['OM_SHA'], labelAr: 'شمال الشرقية', labelEn: 'Al Sharqiyah North',
    wilayats: [
      { id: 'ibra', labelAr: 'إبراء', labelEn: 'Ibra' },
      { id: 'mudhaibi', labelAr: 'المضيبي', labelEn: 'Al Mudhaibi' },
      { id: 'bidiya', labelAr: 'بدية', labelEn: 'Bidiya' },
      { id: 'qabil', labelAr: 'القابل', labelEn: 'Al Qabil' },
      { id: 'wadi_bani_khalid', labelAr: 'وادي بني خالد', labelEn: 'Wadi Bani Khalid' },
      { id: 'dima_w_tayeen', labelAr: 'دماء والطائيين', labelEn: 'Dima W\'attayeen' },
    ]
  },
  {
    id: 'sharqiyah_south', legacyId: 'OM_SHS', labelAr: 'جنوب الشرقية', labelEn: 'Al Sharqiyah South',
    wilayats: [
      { id: 'sur', labelAr: 'صور', labelEn: 'Sur' },
      { id: 'jalan_bani_bu_ali', labelAr: 'جعلان بني بو علي', labelEn: 'Jalan Bani Bu Ali' },
      { id: 'kamil_wafi', labelAr: 'الكامل والوافي', labelEn: 'Al Kamil W\'al Wafi' },
      { id: 'jalan_bani_bu_hassan', labelAr: 'جعلان بني بو حسن', labelEn: 'Jalan Bani Bu Hassan' },
      { id: 'masirah', labelAr: 'مصيرة', labelEn: 'Masirah' },
    ]
  },
  {
    id: 'dhahirah', legacyId: 'OM_DHA', altLegacyIds: ['OM_ZAH'], labelAr: 'الظاهرة', labelEn: 'Al Dhahirah',
    wilayats: [
      { id: 'ibri', labelAr: 'عبري', labelEn: 'Ibri' },
      { id: 'yanqul', labelAr: 'ينقل', labelEn: 'Yanqul' },
      { id: 'dhank', labelAr: 'ضنك', labelEn: 'Dhank' },
    ]
  },
  {
    id: 'buraimi', legacyId: 'OM_BUR', labelAr: 'البريمي', labelEn: 'Al Buraimi',
    wilayats: [
      { id: 'buraimi_city', labelAr: 'البريمي', labelEn: 'Al Buraimi City' },
      { id: 'mahdha', labelAr: 'محضة', labelEn: 'Mahdha' },
      { id: 'sunaynah', labelAr: 'السنينة', labelEn: 'Al Sunaynah' },
    ]
  },
  {
    id: 'wusta', legacyId: 'OM_WUS', labelAr: 'الوسطى', labelEn: 'Al Wusta',
    wilayats: [
      { id: 'haima', labelAr: 'هيماء', labelEn: 'Haima' },
      { id: 'duqm', labelAr: 'الدقم', labelEn: 'Duqm' },
      { id: 'mahout', labelAr: 'محوت', labelEn: 'Mahout' },
      { id: 'jazir', labelAr: 'الجازر', labelEn: 'Al Jazir' },
    ]
  },
  {
    id: 'musandam', legacyId: 'OM_MSN', labelAr: 'مسندم', labelEn: 'Musandam',
    wilayats: [
      { id: 'khasab', labelAr: 'خصب', labelEn: 'Khasab' },
      { id: 'bukha', labelAr: 'بخا', labelEn: 'Bukha' },
      { id: 'dibba', labelAr: 'دبا', labelEn: 'Dibba' },
      { id: 'madha', labelAr: 'مدحاء', labelEn: 'Madha' },
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

const normalizeLoc = (val: string) => {
  if (!val) return '';
  return val.toLowerCase().replace(/^(al|ad|as|ar|ash|az)[\s-]/, '').replace(/[^a-z0-9\u0600-\u06FF]/g, '').trim();
}

export const getPostGovLabel = (value: string): string => {
  if (!value) return '';
  
  let gov = OMAN_LOCATIONS.find(g => 
    g.id === value || g.legacyId === value || g.altLegacyIds?.includes(value) || g.labelAr === value
  );
  if (gov) return gov.labelAr;

  const valNorm = normalizeLoc(value);
  gov = OMAN_LOCATIONS.find(g => normalizeLoc(g.labelEn || '') === valNorm || normalizeLoc(g.id) === valNorm || normalizeLoc(g.labelAr) === valNorm);
  
  return gov ? gov.labelAr : '';
};

export const getPostCityLabel = (govValue: string, cityValue: string): string => {
  if (!cityValue) return '';
  
  const govValNorm = normalizeLoc(govValue);
  const cityValNorm = normalizeLoc(cityValue);

  const gov = OMAN_LOCATIONS.find(g => 
    g.id === govValue || g.legacyId === govValue || g.altLegacyIds?.includes(govValue) || 
    g.labelAr === govValue || normalizeLoc(g.labelEn || '') === govValNorm || normalizeLoc(g.id) === govValNorm
  );

  if (!gov) {
    for (const g of OMAN_LOCATIONS) {
      const city = g.wilayats.find(w => w.id === cityValue || w.labelAr === cityValue || normalizeLoc(w.labelEn || '') === cityValNorm || normalizeLoc(w.id) === cityValNorm || normalizeLoc(w.labelAr) === cityValNorm);
      if (city) return city.labelAr;
    }
    return '';
  }

  const city = gov.wilayats.find(w => w.id === cityValue || w.labelAr === cityValue || normalizeLoc(w.labelEn || '') === cityValNorm || normalizeLoc(w.id) === cityValNorm || normalizeLoc(w.labelAr) === cityValNorm);
  return city ? city.labelAr : '';
};
