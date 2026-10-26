import type { SpecSectionView } from '../../types/carDetailViewModel.types'

/**
 * Filters specification sections and feature items by query string
 * (case-insensitive substring over label and value).
 * Returns only sections with at least one matching item.
 */
export function filterSpecsSections(
  sections: SpecSectionView[] | undefined | null,
  query: string
): SpecSectionView[] {
  if (!sections || !Array.isArray(sections)) return []
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return sections

  return sections
    .map((section) => ({
      ...section,
      items: (section.items || []).filter(
        (item) =>
          (typeof item.label === 'string' && item.label.toLowerCase().includes(trimmed)) ||
          (typeof item.value === 'string' && item.value.toLowerCase().includes(trimmed))
      ),
    }))
    .filter((section) => section.items.length > 0)
}
