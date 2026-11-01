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

/**
 * Minimum height for spec rows across technical and compatibility tables:
 * - Top padding: Spacing.space2 (8)
 * - Text line height: lineHeightFor(13) (21, Math.ceil(13 * 1.6))
 * - Bottom padding: Spacing.space2 (8)
 * Total minHeight = 8 + 21 + 8 = 37pt.
 */
export const SPEC_ROW_MIN_HEIGHT = Spacing.space2 * 2 + lineHeightFor(13)

export function hasMatchingPartSpecs(
  vm: PartDetailViewModel,
  searchQuery?: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true
  const q = searchQuery.trim().toLowerCase()

  const matchCategory =
    Boolean(vm.partCategoryLabel) &&
    (vm.partCategoryLabel.toLowerCase().includes(q) || 'فئة القطعة'.includes(q))
  const matchOriginality =
    Boolean(vm.originalityLabel) &&
    (vm.originalityLabel.toLowerCase().includes(q) || 'النوع'.includes(q))
  const matchPartNumber =
    Boolean(vm.partNumber && (vm.partNumber.toLowerCase().includes(q) || 'رقم القطعة الأصلي'.includes(q)))
  const matchQuantity =
    Boolean(vm.quantityLabel && (vm.quantityLabel.toLowerCase().includes(q) || 'الكمية المتوفرة'.includes(q)))
  const matchWarranty =
    Boolean(vm.warrantyDurationLabel && (vm.warrantyDurationLabel.toLowerCase().includes(q) || 'الضمان'.includes(q)))

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
    matchOriginality ||
    matchPartNumber ||
    matchQuantity ||
    matchWarranty ||
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
 * Clean, consistent table rows: no capsules/pills/chips inside rows, single row style,
 * and canonical single-placement of facts across the page (D-170d).
 */
export function PartSpecsSection({ vm, searchQuery }: PartSpecsSectionProps) {
  const [makesExpanded, setMakesExpanded] = useState(false)
  const [modelsExpanded, setModelsExpanded] = useState(false)

  const q = searchQuery ? searchQuery.trim().toLowerCase() : ''

  // Row match checks for Card 1 (Basic Technical Specifications)
  // Per R2: condition and negotiable are canonical in header; removed here to prevent duplication.
  const showCategory =
    Boolean(vm.partCategoryLabel) &&
    (!q || vm.partCategoryLabel.toLowerCase().includes(q) || 'فئة القطعة'.includes(q))
  const showOriginality =
    Boolean(vm.originalityLabel) &&
    (!q || vm.originalityLabel.toLowerCase().includes(q) || 'النوع'.includes(q))
  const showPartNumber =
    Boolean(vm.partNumber && (!q || vm.partNumber.toLowerCase().includes(q) || 'رقم القطعة الأصلي'.includes(q)))
  const showQuantity =
    Boolean(vm.quantityLabel && (!q || vm.quantityLabel.toLowerCase().includes(q) || 'الكمية المتوفرة'.includes(q)))
  const showWarranty =
    Boolean(vm.warrantyDurationLabel && (!q || vm.warrantyDurationLabel.toLowerCase().includes(q) || 'الضمان'.includes(q)))

  const hasBasicSection =
    showCategory ||
    showOriginality ||
    showPartNumber ||
    showQuantity ||
    showWarranty

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
    return [s.specRow, isBorder && s.specRowBorder]
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
                <Text style={s.specLabel} testID="spec-label-category">فئة القطعة</Text>
                <Text style={s.specValue} testID="spec-value-category">{vm.partCategoryLabel}</Text>
              </View>
            )}

            {/* Originality / Type: plain text value per R1 */}
            {showOriginality && (
              <View style={getBasicRowStyle()} testID="spec-row-originality">
                <Text style={s.specLabel} testID="spec-label-originality">النوع</Text>
                <Text style={s.specValue} testID="spec-value-originality">{vm.originalityLabel}</Text>
              </View>
            )}

            {/* Part Number: plain text value matching row typography per R3 */}
            {showPartNumber && (
              <View style={getBasicRowStyle()} testID="spec-row-part-number">
                <Text style={s.specLabel} testID="spec-label-part-number">رقم القطعة الأصلي</Text>
                <Text style={s.specValue} testID="spec-value-part-number">{vm.partNumber}</Text>
              </View>
            )}

            {/* Quantity */}
            {showQuantity && (
              <View style={getBasicRowStyle()} testID="spec-row-quantity">
                <Text style={s.specLabel} testID="spec-label-quantity">الكمية المتوفرة</Text>
                <Text style={s.specValue} testID="spec-value-quantity">{vm.quantityLabel}</Text>
              </View>
            )}

            {/* Warranty */}
            {showWarranty && (
              <View style={getBasicRowStyle()} testID="spec-row-warranty">
                <Text style={s.specLabel} testID="spec-label-warranty">الضمان</Text>
                <Text style={s.specValue} testID="spec-value-warranty">{vm.warrantyDurationLabel}</Text>
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
            {/* Year Range */}
            {showYearRange && (
              <View style={getCompatRowStyle()} testID="spec-row-year-range">
                <Text style={s.specLabel} testID="spec-label-year-range">سنوات الصنع</Text>
                <Text style={s.specValue} testID="spec-value-year-range">{vm.yearRangeLabel}</Text>
              </View>
            )}

            {/* Compatible Vehicle Types */}
            {showVehicleTypes && (
              <View style={getCompatRowStyle()} testID="spec-row-vehicle-types">
                <Text style={s.specLabel} testID="spec-label-vehicle-types">أنواع المركبات</Text>
                <Text style={s.specValue} testID="spec-value-vehicle-types">
                  {vm.compatibleVehicleTypesLabels.join('، ')}
                </Text>
              </View>
            )}

            {/* Compatible Makes: plain comma-joined text per R4 */}
            {hasMakes && (
              <View style={getCompatRowStyle()} testID="spec-row-makes">
                <Text style={s.specLabel} testID="spec-label-makes">الماركات المتوافقة</Text>
                <View style={s.listCol}>
                  <Text style={s.specValue} testID="spec-value-makes">
                    {visibleMakes.join('، ')}
                  </Text>
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
              </View>
            )}

            {/* Compatible Models: plain comma-joined text per R4 */}
            {hasModels && (
              <View style={getCompatRowStyle()} testID="spec-row-models">
                <Text style={s.specLabel} testID="spec-label-models">الموديلات المتوافقة</Text>
                <View style={s.listCol}>
                  <Text style={s.specValue} testID="spec-value-models">
                    {visibleModels.join('، ')}
                  </Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space2,
    minHeight: SPEC_ROW_MIN_HEIGHT,
    gap: Spacing.space3,
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
    flexShrink: 0,
  },
  specValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    flexShrink: 1,
  },
  listCol: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  toggleBtnText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
  },
})
