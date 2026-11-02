import { Dimensions } from 'react-native'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

const { width: screenWidth } = Dimensions.get('window')
const horizontalPadding = Spacing.space4
const columnGap = Spacing.space4

export const PostCategoryTokens = {
  columns: 2,
  horizontalPadding,
  columnGap,
  rowGap: Spacing.space4,
  cardWidth: (screenWidth - horizontalPadding * 2 - columnGap) / 2,
  cardRadius: 24,
  cardMinHeight: 168,
  iconSize: 68,
  cardTitleFontSize: 15,
  cardTitleLineHeight: 21,
  descriptionFontSize: 11,
  descriptionLineHeight: 15,
  sheetTopRadius: 32,
  entranceStaggerMs: 55,
  entranceDurationMs: 220,
  pressScale: 0.97,
  pressSpringDamping: 16,
  pressSpringStiffness: 220,
  titleBottomGap: Spacing.space6,
  sheetTitleFontSize: 24,
  sheetTitleLineHeight: 34,
  sheetSubtitleFontSize: 14,
  sheetSubtitleLineHeight: 20,
  cancelFontSize: 16,
  cancelLineHeight: 22,
  cardIconGap: Spacing.space2,
  titleDescriptionGap: Spacing.space1,
  handleWidth: 48,
  handleHeight: 5,
  handleTopPadding: Spacing.space3,
  handleBottomPadding: Spacing.space3,
  cancelHeight: 56,
  cancelTopPadding: Spacing.space4,
  cancelHorizontalPadding: Spacing.space6,
  cancelRadius: Radius.pill,
} as const
