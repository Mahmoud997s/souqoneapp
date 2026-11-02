import { StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { TopBarTokens } from '../../constants/topBarTokens'
import { PostCategoryTokens } from './postCategoryTokens'

export const PostCategorySheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopLeftRadius: PostCategoryTokens.sheetTopRadius,
    borderTopRightRadius: PostCategoryTokens.sheetTopRadius,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: TopBarTokens.tintOverlayColor,
    opacity: TopBarTokens.tintOverlayOpacity,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: PostCategoryTokens.handleTopPadding,
    paddingBottom: PostCategoryTokens.handleBottomPadding,
  },
  handle: {
    width: PostCategoryTokens.handleWidth,
    height: PostCategoryTokens.handleHeight,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
  },
  header: {
    width: '100%',
    paddingHorizontal: Spacing.space6,
    marginBottom: PostCategoryTokens.titleBottomGap,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: PostCategoryTokens.sheetTitleFontSize,
    lineHeight: PostCategoryTokens.sheetTitleLineHeight,
    color: Colors.text,
    marginBottom: Spacing.space1,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: PostCategoryTokens.sheetSubtitleFontSize,
    lineHeight: PostCategoryTokens.sheetSubtitleLineHeight,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  list: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: PostCategoryTokens.horizontalPadding,
    gap: PostCategoryTokens.rowGap,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: PostCategoryTokens.columnGap,
  },
  centeredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: PostCategoryTokens.cancelTopPadding,
    paddingHorizontal: PostCategoryTokens.cancelHorizontalPadding,
  },
  cancelButtonWrap: {
    height: PostCategoryTokens.cancelHeight,
    borderRadius: PostCategoryTokens.cancelRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    backgroundColor: TopBarTokens.iceGlass,
    ...TopBarTokens.buttonShadow,
  },
  cancelBacking: {
    ...StyleSheet.absoluteFill,
    backgroundColor: TopBarTokens.iceGlass,
    borderRadius: PostCategoryTokens.cancelRadius,
  },
  cancelLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: PostCategoryTokens.cancelFontSize,
    lineHeight: PostCategoryTokens.cancelLineHeight,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
