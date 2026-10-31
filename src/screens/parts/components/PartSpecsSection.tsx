import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { PartDetailViewModel } from '../../../types/partDetailViewModel.types'

export interface PartSpecsSectionProps {
  vm: PartDetailViewModel
  searchQuery?: string
}

export function hasMatchingPartSpecs(
  vm: PartDetailViewModel,
  searchQuery?: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true
  const q = searchQuery.trim().toLowerCase()

  const matchCategory =
    Boolean(vm.partCategoryLabel) &&
    (vm.partCategoryLabel.toLowerCase().includes(q) || 'فئة القطعة'.includes(q))
  const matchCondition =
    Boolean(vm.conditionLabel) &&
    (vm.conditionLabel.toLowerCase().includes(q) || 'الحالة'.includes(q))
  const matchOriginality =
    Boolean(vm.originalityLabel) &&
    (vm.originalityLabel.toLowerCase().includes(q) || 'النوع'.includes(q))
  const matchPartNumber =
    Boolean(vm.partNumber && (vm.partNumber.toLowerCase().includes(q) || 'رقم القطعة الأصلي'.includes(q)))
  const matchQuantity =
    Boolean(vm.quantityLabel && (vm.quantityLabel.toLowerCase().includes(q) || 'الكمية المتوفرة'.includes(q)))
  const matchWarranty =
    Boolean(vm.warrantyDurationLabel && (vm.warrantyDurationLabel.toLowerCase().includes(q) || 'الضمان'.includes(q)))
  const matchNegotiable =
    Boolean(vm.price?.isNegotiable && ('قابل للتفاوض'.includes(q) || 'قابلية التفاوض'.includes(q)))

  const matchYearRange =
    Boolean(vm.yearRangeLabel && (vm.yearRangeLabel.toLowerCase().includes(q) || 'سنوات الصنع'.includes(q)))
  const matchVehicleTypes =
    Boolean(vm.compatibleVehicleTypesLabels && vm.compatibleVehicleTypesLabels.length > 0) &&
    (vm.compatibleVehicleTypesLabels.some((t) => t.toLowerCase().includes(q)) ||
      'أنواع المركبات'.includes(q))

  const matchMakes =
    (Boolean(vm.compatibleMakesLabels && vm.compatibleMakesLabels.length > 0) ||
      Boolean(vm.compatibleMakes && vm.compatibleMakes.length > 0)) &&
    ('الماركات المتوافقة'.includes(q) ||
      (vm.compatibleMakesLabels || []).some((m) => m.toLowerCase().includes(q)) ||
      (vm.compatibleMakes || []).some((m) => m.toLowerCase().includes(q)))

  const matchModels =
    Boolean(vm.compatibleModels && vm.compatibleModels.length > 0) &&
    ('الموديلات المتوافقة'.includes(q) ||
      vm.compatibleModels.some((m) => m.toLowerCase().includes(q)))

  return (
    matchCategory ||
    matchCondition ||
    matchOriginality ||
    matchPartNumber ||
    matchQuantity ||
    matchWarranty ||
    matchNegotiable ||
    matchYearRange ||
    matchVehicleTypes ||
    matchMakes ||
    matchModels
  )
}

const COLLAPSED_MAKES_LIMIT = 4
const COLLAPSED_MODELS_LIMIT = 6

/**
 * PartSpecsSection
 * Presents technical specifications and compatibility details for spare parts.
 * Groups data cleanly into Basic Specs and Vehicle Compatibility cards.
 * Provides expandable chip lists for makes and models to prevent overflow.
 */
export function PartSpecsSection({ vm, searchQuery }: PartSpecsSectionProps) {
  const [makesExpanded, setMakesExpanded] = useState(false)
  const [modelsExpanded, setModelsExpanded] = useState(false)

  const q = searchQuery ? searchQuery.trim().toLowerCase() : ''

  // Row match checks for Card 1 (Basic Technical Specifications)
  const showCategory =
    Boolean(vm.partCategoryLabel) &&
    (!q || vm.partCategoryLabel.toLowerCase().includes(q) || 'فئة القطعة'.includes(q))
  const showCondition =
    Boolean(vm.conditionLabel) &&
    (!q || vm.conditionLabel.toLowerCase().includes(q) || 'الحالة'.includes(q))
  const showOriginality =
    Boolean(vm.originalityLabel) &&
    (!q || vm.originalityLabel.toLowerCase().includes(q) || 'النوع'.includes(q))
  const showPartNumber =
    Boolean(vm.partNumber && (!q || vm.partNumber.toLowerCase().includes(q) || 'رقم القطعة الأصلي'.includes(q)))
  const showQuantity =
    Boolean(vm.quantityLabel && (!q || vm.quantityLabel.toLowerCase().includes(q) || 'الكمية المتوفرة'.includes(q)))
  const showWarranty =
    Boolean(vm.warrantyDurationLabel && (!q || vm.warrantyDurationLabel.toLowerCase().includes(q) || 'الضمان'.includes(q)))
  const showNegotiable =
    Boolean(vm.price?.isNegotiable) &&
    (!q || 'قابل للتفاوض'.includes(q) || 'قابلية التفاوض'.includes(q))

  const hasBasicSection =
    showCategory ||
    showCondition ||
    showOriginality ||
    showPartNumber ||
    showQuantity ||
    showWarranty ||
    showNegotiable

  // Match checks for Card 2 (Vehicle Compatibility)
  const showYearRange =
    Boolean(vm.yearRangeLabel && (!q || vm.yearRangeLabel.toLowerCase().includes(q) || 'سنوات الصنع'.includes(q)))
  const showVehicleTypes =
    Boolean(vm.compatibleVehicleTypesLabels && vm.compatibleVehicleTypesLabels.length > 0) &&
    (!q ||
      vm.compatibleVehicleTypesLabels.some((t) => t.toLowerCase().includes(q)) ||
      'أنواع المركبات'.includes(q))

  const allMakes = vm.compatibleMakesLabels || []
  const filteredMakes =
    !q || 'الماركات المتوافقة'.includes(q)
      ? allMakes
      : allMakes.filter((m, i) => {
          const makeKey = vm.compatibleMakes?.[i] || ''
          return m.toLowerCase().includes(q) || makeKey.toLowerCase().includes(q)
        })
  const hasMakes = filteredMakes.length > 0

  const allModels = vm.compatibleModels || []
  const filteredModels =
    !q || 'الموديلات المتوافقة'.includes(q)
      ? allModels
      : allModels.filter((m) => m.toLowerCase().includes(q))
  const hasModels = filteredModels.length > 0

  const hasCompatibilitySection =
    showYearRange || showVehicleTypes || hasMakes || hasModels

  const visibleMakes = hasMakes
    ? makesExpanded || filteredMakes.length <= COLLAPSED_MAKES_LIMIT
      ? filteredMakes
      : filteredMakes.slice(0, COLLAPSED_MAKES_LIMIT)
    : []

  const visibleModels = hasModels
    ? modelsExpanded || filteredModels.length <= COLLAPSED_MODELS_LIMIT
      ? filteredModels
      : filteredModels.slice(0, COLLAPSED_MODELS_LIMIT)
    : []

  let hasPrevBasicRow = false
  const getBasicRowStyle = () => {
    const isBorder = hasPrevBasicRow
    hasPrevBasicRow = true
    return [s.specRow, isBorder && s.specRowBorder]
  }

  let hasPrevCompatRow = false
  const getCompatRowStyle = () => {
    const isBorder = hasPrevCompatRow
    hasPrevCompatRow = true
    return isBorder
  }

  return (
    <View style={s.container}>
      {/* ── Card 1: Basic Technical Specifications ── */}
      {hasBasicSection && (
        <View style={s.card} testID="part-specs-basic-card">
          <View style={s.cardHeader}>
            <Ionicons name="options-outline" size={18} color={Colors.primary} />
            <Text style={s.sectionTitle}>المواصفات الفنية</Text>
          </View>

          <View style={s.specsTable}>
            {/* Category */}
            {showCategory && (
              <View style={getBasicRowStyle()} testID="spec-row-category">
                <Text style={s.specLabel}>فئة القطعة</Text>
                <Text style={s.specValue}>{vm.partCategoryLabel}</Text>
              </View>
            )}

            {/* Condition */}
            {showCondition && (
              <View style={getBasicRowStyle()} testID="spec-row-condition">
                <Text style={s.specLabel}>الحالة</Text>
                <Text style={s.specValue}>{vm.conditionLabel}</Text>
              </View>
            )}

            {/* Originality */}
            {showOriginality && (
              <View style={getBasicRowStyle()} testID="spec-row-originality">
                <Text style={s.specLabel}>النوع</Text>
                <View style={[s.badge, vm.isOriginal ? s.badgeOriginal : s.badgeAftermarket]}>
                  <Ionicons
                    name={vm.isOriginal ? 'shield-checkmark' : 'construct-outline'}
                    size={13}
                    color={vm.isOriginal ? Colors.primary : Colors.text2}
                  />
                  <Text
                    style={[
                      s.badgeText,
                      vm.isOriginal ? s.badgeTextOriginal : s.badgeTextAftermarket,
                    ]}
                  >
                    {vm.originalityLabel}
                  </Text>
                </View>
              </View>
            )}

            {/* Part Number (Only if available) */}
            {showPartNumber && (
              <View style={getBasicRowStyle()} testID="spec-row-part-number">
                <Text style={s.specLabel}>رقم القطعة الأصلي</Text>
                <Text style={[s.specValue, s.codeValue]}>{vm.partNumber}</Text>
              </View>
            )}

            {/* Quantity (Only if available) */}
            {showQuantity && (
              <View style={getBasicRowStyle()} testID="spec-row-quantity">
                <Text style={s.specLabel}>الكمية المتوفرة</Text>
                <Text style={s.specValue}>{vm.quantityLabel}</Text>
              </View>
            )}

            {/* Warranty */}
            {showWarranty && (
              <View style={getBasicRowStyle()} testID="spec-row-warranty">
                <Text style={s.specLabel}>الضمان</Text>
                <Text style={s.specValue}>{vm.warrantyDurationLabel}</Text>
              </View>
            )}

            {/* Negotiable Price Badge */}
            {showNegotiable && (
              <View style={getBasicRowStyle()} testID="spec-row-negotiable">
                <Text style={s.specLabel}>قابلية التفاوض</Text>
                <View style={s.negotiableBadge}>
                  <Ionicons name="chatbubbles-outline" size={12} color={Colors.accent} />
                  <Text style={s.negotiableBadgeText}>قابل للتفاوض</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Card 2: Vehicle Compatibility ── */}
      {hasCompatibilitySection && (
        <View style={s.card} testID="part-specs-compat-card">
          <View style={s.cardHeader}>
            <Ionicons name="car-outline" size={18} color={Colors.primary} />
            <Text style={s.sectionTitle}>التوافق والسيارات</Text>
          </View>

          <View style={s.specsTable}>
            {/* Year Range (Only if available) */}
            {showYearRange && (
              <View
                style={[s.specRow, getCompatRowStyle() && s.specRowBorder]}
                testID="spec-row-year-range"
              >
                <Text style={s.specLabel}>سنوات الصنع</Text>
                <Text style={s.specValue}>{vm.yearRangeLabel}</Text>
              </View>
            )}

            {/* Compatible Vehicle Types */}
            {showVehicleTypes && (
              <View
                style={[s.specRow, getCompatRowStyle() && s.specRowBorder]}
                testID="spec-row-vehicle-types"
              >
                <Text style={s.specLabel}>أنواع المركبات</Text>
                <Text style={s.specValue}>{vm.compatibleVehicleTypesLabels.join('، ')}</Text>
              </View>
            )}

            {/* Compatible Makes */}
            {hasMakes && (
              <View style={[s.chipsBlock, getCompatRowStyle() && s.specRowBorder]}>
                <View style={s.chipsHeader}>
                  <Text style={s.specLabel}>الماركات المتوافقة</Text>
                  {filteredMakes.length > COLLAPSED_MAKES_LIMIT && (
                    <TouchableOpacity
                      testID="toggle-makes-btn"
                      onPress={() => setMakesExpanded(!makesExpanded)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        makesExpanded ? 'عرض ماركات أقل' : 'عرض جميع الماركات المتوافقة'
                      }
                      style={s.toggleBtn}
                    >
                      <Text style={s.toggleBtnText}>
                        {makesExpanded ? 'عرض أقل' : `عرض الكل (${filteredMakes.length})`}
                      </Text>
                      <Ionicons
                        name={makesExpanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={s.chipsWrap} testID="compat-makes-wrap">
                  {visibleMakes.map((makeLabel, i) => (
                    <View key={`make-${i}`} style={s.chip}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={Colors.primary} />
                      <Text style={s.chipText}>{makeLabel}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Compatible Models */}
            {hasModels && (
              <View style={[s.chipsBlock, getCompatRowStyle() && s.specRowBorder]}>
                <View style={s.chipsHeader}>
                  <Text style={s.specLabel}>الموديلات المتوافقة</Text>
                  {filteredModels.length > COLLAPSED_MODELS_LIMIT && (
                    <TouchableOpacity
                      testID="toggle-models-btn"
                      onPress={() => setModelsExpanded(!modelsExpanded)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        modelsExpanded ? 'عرض موديلات أقل' : 'عرض جميع الموديلات المتوافقة'
                      }
                      style={s.toggleBtn}
                    >
                      <Text style={s.toggleBtnText}>
                        {modelsExpanded ? 'عرض أقل' : `عرض الكل (${filteredModels.length})`}
                      </Text>
                      <Ionicons
                        name={modelsExpanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={s.chipsWrap} testID="compat-models-wrap">
                  {visibleModels.map((model, i) => (
                    <View key={`model-${i}`} style={s.modelChip}>
                      <Text style={s.modelChipText}>{model}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    gap: Spacing.space3,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  specsTable: {
    gap: 0,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space2,
  },
  specRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  specLabel: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.textMuted,
  },
  specValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
  },
  codeValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeOriginal: {
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  badgeAftermarket: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
  },
  badgeTextOriginal: {
    color: Colors.primary,
  },
  badgeTextAftermarket: {
    color: Colors.text2,
  },
  negotiableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  negotiableBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.accent,
  },
  chipsBlock: {
    paddingVertical: Spacing.space3,
    gap: Spacing.space2,
  },
  chipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleBtnText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.paleMint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  chipText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: lineHeightFor(11.5),
    color: Colors.text,
  },
  modelChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modelChipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: lineHeightFor(11.5),
    color: Colors.text,
  },
})
