import { StyleSheet } from 'react-native';
import { Spacing } from '../../constants/spacing';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';

/**
 * quickFilterModalStyles
 * Shared glassmorphic stylesheet for QuickFilterModal and LegacyQuickFilterModal
 * extracted per task D-189 to eliminate style duplication and guarantee visual equality.
 */
export const quickFilterModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: FilterGlassTokens.sheet.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: FilterGlassTokens.sheet.cardBg,
    borderRadius: FilterGlassTokens.sheet.cardRadius,
    borderWidth: FilterGlassTokens.sheet.cardBorderWidth,
    borderColor: FilterGlassTokens.sheet.cardBorderColor,
    padding: Spacing.space4,
    ...FilterGlassTokens.sheet.cardShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space3,
    borderBottomWidth: FilterGlassTokens.sheet.dividerWidth,
    borderBottomColor: FilterGlassTokens.sheet.dividerColor,
  },
  modalTitle: {
    fontFamily: FilterGlassTokens.sheet.titleFontFamily,
    fontSize: FilterGlassTokens.sheet.titleFontSize,
    lineHeight: FilterGlassTokens.sheet.titleLineHeight,
    color: FilterGlassTokens.sheet.titleColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: FilterGlassTokens.sheet.dividerWidth,
    borderBottomColor: FilterGlassTokens.sheet.dividerColor,
  },
  modalOptionTxt: {
    fontFamily: FilterGlassTokens.sheet.optionFontFamily,
    fontSize: FilterGlassTokens.sheet.optionFontSize,
    lineHeight: FilterGlassTokens.sheet.optionLineHeight,
    color: FilterGlassTokens.sheet.optionTextColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  modalOptionTxtActive: {
    color: FilterGlassTokens.sheet.optionActiveTextColor,
  },
});
