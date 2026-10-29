export function normalizeJobType(type?: string): string {
  return type?.toUpperCase() ?? ''
}
