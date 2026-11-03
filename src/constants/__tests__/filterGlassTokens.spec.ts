import { FilterGlassTokens } from '../filterGlassTokens';
import { TopBarTokens } from '../topBarTokens';
import { Colors } from '../colors';

describe('FilterGlassTokens - Parity & Consistency with TopBarTokens', () => {
  it('derives ice glass background and border from TopBarTokens', () => {
    expect(FilterGlassTokens.iceGlassBg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.iceGlassBg).toBe('#F9FCFE');
    expect(FilterGlassTokens.borderColor).toBe(TopBarTokens.buttonBorderColor);
    expect(FilterGlassTokens.borderWidth).toBe(TopBarTokens.buttonBorderWidth);
  });

  it('provides matching ice glass background across all filter surfaces', () => {
    expect(FilterGlassTokens.chip.bg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.tab.trackBg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.card.bg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.resultsBar.countBg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.resultsBar.clearBg).toBe(TopBarTokens.iceGlass);
    expect(FilterGlassTokens.sheet.cardBg).toBe(TopBarTokens.iceGlass);
  });

  it('results bar count and clear chips have identical borders and shadows with destructive clear styling', () => {
    expect(FilterGlassTokens.resultsBar.countBorderColor).toBe(FilterGlassTokens.resultsBar.clearBorderColor);
    expect(FilterGlassTokens.resultsBar.countRadius).toBe(FilterGlassTokens.resultsBar.clearRadius);
    expect(FilterGlassTokens.resultsBar.clearTextColor).toBe(Colors.error);
    expect(FilterGlassTokens.resultsBar.clearIconColor).toBe(Colors.error);
  });
});
