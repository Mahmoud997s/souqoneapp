export interface OperatorChip {
  key: string
  label: string
  icon: string
  isMci?: boolean
  isCertification?: boolean
}

export interface BuildOperatorChipsOptions {
  operatorTypeLabel?: string | null
  experienceText?: string | null
  hasCertifications?: boolean
  equipmentTags?: string[]
  maxChips?: number
}

export interface BuildOperatorChipsResult {
  chips: OperatorChip[]
  extraCount: number
  totalChips: number
}

/**
 * buildOperatorChips
 * Pure helper that builds operator chips adhering to a strict total budget.
 * Priority order:
 * 1. Operator type
 * 2. Experience years
 * 3. Verified certification badge
 * 4. Equipment specialization tags
 *
 * All slots (including certification) count towards `maxChips` (default 3).
 * Extra hidden items are counted precisely as `totalChips - shownChips`.
 */
export function buildOperatorChips({
  operatorTypeLabel,
  experienceText,
  hasCertifications = false,
  equipmentTags = [],
  maxChips = 3,
}: BuildOperatorChipsOptions): BuildOperatorChipsResult {
  const allChips: OperatorChip[] = []

  // 1. Type chip
  if (operatorTypeLabel) {
    allChips.push({
      key: 'type',
      label: operatorTypeLabel,
      icon: 'account-hard-hat',
      isMci: true,
    })
  }

  // 2. Experience chip
  if (experienceText) {
    allChips.push({
      key: 'exp',
      label: experienceText,
      icon: 'shield-checkmark-outline',
    })
  }

  // 3. Certification chip (counts towards budget in priority #3)
  if (hasCertifications) {
    allChips.push({
      key: 'cert',
      label: 'شهادة معتمدة',
      icon: 'ribbon-outline',
      isCertification: true,
    })
  }

  // 4. Equipment specialization tags
  if (Array.isArray(equipmentTags)) {
    equipmentTags.forEach((tag, idx) => {
      if (tag) {
        allChips.push({
          key: `eq-${idx}`,
          label: tag,
          icon: 'construct-outline',
        })
      }
    })
  }

  const totalChips = allChips.length
  const limit = Math.max(0, maxChips)
  const shownChips = allChips.slice(0, limit)
  const extraCount = Math.max(0, totalChips - shownChips.length)

  return {
    chips: shownChips,
    extraCount,
    totalChips,
  }
}
