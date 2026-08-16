import { OMAN_LOCATIONS } from '../constants/locations';

/**
 * Normalizes a location string by removing common English prefixes
 * and non-alphanumeric/Arabic characters for fuzzy matching.
 */
const normalizeLoc = (val: string | undefined | null): string => {
  if (!val) return '';
  return String(val)
    .toLowerCase()
    .replace(/^(al|ad|as|ar|ash|az)[\s-]/, '')
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '')
    .trim();
};

/**
 * The Single Source of Truth for mapping ANY raw governorate string
 * (Legacy ID, English, Arabic, etc.) to the strict Arabic label.
 */
export const getStrictGovernorate = (govValue: string | undefined | null): string => {
  if (!govValue) return '';
  const valStr = String(govValue).trim();
  if (!valStr) return '';

  // 1. Direct exact match
  let gov = OMAN_LOCATIONS.find(
    (g) =>
      g.id === valStr ||
      g.legacyId === valStr ||
      g.altLegacyIds?.includes(valStr) ||
      g.labelAr === valStr ||
      g.labelEn === valStr
  );
  if (gov) return gov.labelAr;

  // 2. Fuzzy match
  const valNorm = normalizeLoc(valStr);
  gov = OMAN_LOCATIONS.find(
    (g) =>
      normalizeLoc(g.labelEn) === valNorm ||
      normalizeLoc(g.id) === valNorm ||
      normalizeLoc(g.labelAr) === valNorm
  );

  // Strict: Return empty string if not found, preventing raw English/Legacy leaks
  return gov ? gov.labelAr : '';
};

/**
 * The Single Source of Truth for mapping ANY raw city string
 * to the strict Arabic label, optionally scoped by governorate.
 */
export const getStrictCity = (govValue: string | undefined | null, cityValue: string | undefined | null): string => {
  if (!cityValue) return '';
  const cityStr = String(cityValue).trim();
  if (!cityStr) return '';

  const cityValNorm = normalizeLoc(cityStr);
  const govValNorm = normalizeLoc(govValue);

  // Try to find the specific governorate first
  let gov = null;
  if (govValue) {
    gov = OMAN_LOCATIONS.find(
      (g) =>
        g.id === govValue ||
        g.legacyId === govValue ||
        g.altLegacyIds?.includes(govValue as string) ||
        g.labelAr === govValue ||
        normalizeLoc(g.labelEn) === govValNorm ||
        normalizeLoc(g.id) === govValNorm
    );
  }

  // If governorate is found, search only within its wilayats
  if (gov) {
    const city = gov.wilayats.find(
      (w) =>
        w.id === cityStr ||
        w.labelAr === cityStr ||
        w.labelEn === cityStr ||
        normalizeLoc(w.labelEn) === cityValNorm ||
        normalizeLoc(w.id) === cityValNorm ||
        normalizeLoc(w.labelAr) === cityValNorm
    );
    return city ? city.labelAr : '';
  }

  // If governorate is not provided or not found, search across ALL wilayats
  for (const g of OMAN_LOCATIONS) {
    const city = g.wilayats.find(
      (w) =>
        w.id === cityStr ||
        w.labelAr === cityStr ||
        w.labelEn === cityStr ||
        normalizeLoc(w.labelEn) === cityValNorm ||
        normalizeLoc(w.id) === cityValNorm ||
        normalizeLoc(w.labelAr) === cityValNorm
    );
    if (city) return city.labelAr;
  }

  return '';
};

/**
 * Formats a location as "Governorate, City" strictly in Arabic.
 * Use this directly in detail screens and mappers.
 */
export const formatOmanLocation = (govValue: string | undefined | null, cityValue?: string | undefined | null): string => {
  const gov = getStrictGovernorate(govValue);
  const city = getStrictCity(govValue, cityValue);

  if (gov && city && gov !== city) {
    return `${gov}، ${city}`;
  }
  return gov || city || '';
};
