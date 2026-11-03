/**
 * Safely extracts a single string from a route parameter that may be string, string[], or undefined.
 * Rule: Returns a trimmed string if a string is provided; if an array is received from Expo Router,
 * scans in order and returns the first trimmed, non-empty string element, skipping non-strings;
 * otherwise returns undefined.
 */
export function toSingleString(val: unknown): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      if (typeof item !== 'string') continue;
      const trimmed = item.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return undefined;
}
