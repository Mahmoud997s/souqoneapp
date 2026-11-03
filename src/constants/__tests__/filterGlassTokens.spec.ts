import { FilterGlassTokens, MODAL_BACKDROP_OVERLAY, BOTTOM_SHEET_BACKDROP_OVERLAY } from '../filterGlassTokens';
import { TopBarTokens } from '../topBarTokens';
import { Colors } from '../colors';

describe('FilterGlassTokens', () => {
  it('correctly maps all shared tokens to TopBarTokens and Colors', () => {
    expect(FilterGlassTokens.iceGlassBg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.borderColor).toBe(TopBarTokens.buttonBorderColor);
    expect(FilterGlassTokens.borderWidth).toBe(TopBarTokens.buttonBorderWidth);
    expect(FilterGlassTokens.shadow).toEqual(TopBarTokens.buttonShadow);
    expect(FilterGlassTokens.blurIntensity).toBe(TopBarTokens.blurIntensity);
    expect(FilterGlassTokens.washColor).toBe(TopBarTokens.iceGlass);
  });

  it('guarantees geometry parity with master 7353e69 (no size/radius drift)', () => {
    // QuickFilters chip typography & radius strictly equal to master 7353e69
    expect(FilterGlassTokens.chip.borderRadius).toBe(20);
    expect(FilterGlassTokens.chip.borderWidth).toBe(1);
    expect(FilterGlassTokens.chip.fontFamily).toBe('Almarai_700Bold');
    expect(FilterGlassTokens.chip.fontSize).toBe(11); // per M-034
    expect(FilterGlassTokens.chip.lineHeight).toBe(15); // per M-034

    // ListingTabs segmented track & tab typography equal to master 7353e69
    expect(FilterGlassTokens.tab.trackRadius).toBe(8);
    expect(FilterGlassTokens.tab.trackBorderWidth).toBe(1);
    expect(FilterGlassTokens.tab.fontSize).toBe(11.5);
    expect(FilterGlassTokens.tab.lineHeight).toBe(15.5);
    expect(FilterGlassTokens.tab.activeBg).toBe(Colors.white);
    expect(FilterGlassTokens.tab.activeTextColor).toBe(Colors.primary);

    // VisualFiltersBase item cards equal to master 7353e69
    expect(FilterGlassTokens.card.borderRadius).toBe(8);
    expect(FilterGlassTokens.card.borderWidth).toBe(1);
    expect(FilterGlassTokens.card.fontSize).toBe(11);
    expect(FilterGlassTokens.card.lineHeight).toBe(15);

    // BrowseResultsBar count & clear pills
    expect(FilterGlassTokens.resultsBar.countRadius).toBe(6);
    expect(FilterGlassTokens.resultsBar.clearRadius).toBe(6);
    expect(FilterGlassTokens.resultsBar.fontSize).toBe(11);
    expect(FilterGlassTokens.resultsBar.lineHeight).toBe(15);

    // QuickFilterModal sheet strictly matching master 7353e69 QuickFilterModal.tsx
    expect(FilterGlassTokens.sheet.cardRadius).toBe(16);
    expect(FilterGlassTokens.sheet.cardBorderWidth).toBe(0); // master has no border per M-036
    expect(FilterGlassTokens.sheet.dividerWidth).toBe(1); // master borderBottomWidth: 1 per M-036
    expect(FilterGlassTokens.sheet.titleFontSize).toBe(16);
    expect(FilterGlassTokens.sheet.titleLineHeight).toBe(22);
    expect(FilterGlassTokens.sheet.optionFontSize).toBe(15);
    expect(FilterGlassTokens.sheet.optionLineHeight).toBe(21);
    expect(FilterGlassTokens.sheet.overlayBg).toBe('rgba(0,0,0,0.5)');
    expect(FilterGlassTokens.sheet.bottomSheetOverlayBg).toBe('rgba(0,0,0,0.4)');
    expect(MODAL_BACKDROP_OVERLAY).toBe('rgba(0,0,0,0.5)');
    expect(BOTTOM_SHEET_BACKDROP_OVERLAY).toBe('rgba(0,0,0,0.4)');
  });

  it('preserves semantic state colors across active and selected items', () => {
    expect(FilterGlassTokens.chip.activeBg).toBe(Colors.primary);
    expect(FilterGlassTokens.chip.activeTextColor).toBe(Colors.white);
    expect(FilterGlassTokens.card.selectedBg).toBe(Colors.paleMint);
    expect(FilterGlassTokens.card.selectedTextColor).toBe(Colors.primary);
    expect(FilterGlassTokens.resultsBar.clearTextColor).toBe(Colors.error);
  });
});
