import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';

import {
  RangeSlider,
  computeRangeSliderLength,
  RANGE_SLIDER_MARKER_SIZE,
  RANGE_SLIDER_EDGE_INSET,
} from '../components/ui/RangeSlider';
import {
  FilterBottomSheetLayout,
  FILTER_SHEET_DEFAULT_TITLE,
  getFilterSheetApplyState,
} from '../components/ui/FilterBottomSheetLayout';
import { formatNumberWestern, formatPriceRangeChipLabel } from '../utils/numberFormat';
import { formatNumberWestern as reExportedFormatNumberWestern } from '../utils/listing-detail/formatters';
import { WIZARD_REVIEW_ROW_STYLES } from '../components/ui/WizardReviewCard';
import { ServiceStep6Review } from '../components/services/wizard/ServiceStep6Review';
import { defaultServiceFormData } from '../store/serviceWizardStore';
import { FilterGlassTokens } from '../constants/filterGlassTokens';
import { Spacing } from '../constants/spacing';
import { Colors } from '../constants/colors';

const mockMultiSlider = jest.fn((_props: any) => null);
jest.mock('@ptomasroos/react-native-multi-slider', () => {
  return (props: any) => mockMultiSlider(props);
});

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

jest.mock('expo-image', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    Image: () => <View testID="mock-expo-image" />,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const ROOT = path.resolve(__dirname, '../..');
const readRepoFile = (relPath: string) =>
  fs.readFileSync(path.join(ROOT, relPath), 'utf8');

describe('D-381: Filter sheets polish, number formatting, and review row spacing', () => {
  beforeEach(() => {
    mockMultiSlider.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Item 1: No raw governorate id in operator location quick-filter chip', () => {
    it('never formats a fallback governorate chip with raw #id in operators browse', () => {
      const src = readRepoFile('app/equipment/operators/browse.tsx');
      expect(src).not.toMatch(/محافظة\s*#\$\{/);
      expect(src).not.toMatch(/#\$\{[^}]*governorateId/);
      expect(src).toContain("govObj ? govObj.labelAr : 'المحافظة'");
    });
  });

  describe('Item 2: RangeSlider thumbs stay strictly inside measured sheet margins', () => {
    it('computes sliderLength so track + thumb width never exceeds containerWidth', () => {
      for (const containerWidth of [280, 320, 358, 390, 430]) {
        const len = computeRangeSliderLength(containerWidth);
        expect(len + RANGE_SLIDER_MARKER_SIZE).toBeLessThanOrEqual(containerWidth);
        expect(containerWidth - (len + RANGE_SLIDER_MARKER_SIZE)).toBeGreaterThanOrEqual(
          RANGE_SLIDER_EDGE_INSET
        );
      }
    });

    it('passes measured container width length to MultiSlider after onLayout', async () => {
      await render(
        <RangeSlider
          min={0}
          max={100000}
          step={1000}
          initialLow={5000}
          initialHigh={50000}
          onValuesChangeFinish={jest.fn()}
          suffix="ر.ع"
        />
      );

      await act(async () => {
        fireEvent(screen.getByTestId('range-slider-container'), 'layout', {
          nativeEvent: { layout: { width: 358, height: 110, x: 0, y: 0 } },
        });
      });

      const lastCallProps = mockMultiSlider.mock.calls[mockMultiSlider.mock.calls.length - 1][0];
      expect(lastCallProps.sliderLength).toBe(computeRangeSliderLength(358));
      expect(lastCallProps.sliderLength + RANGE_SLIDER_MARKER_SIZE).toBeLessThanOrEqual(358);
    });
  });

  describe('Item 3 & 5b: Unified filter sheet title, centered header, and disabled-at-zero button', () => {
    it('exports unified default title and computes apply button state correctly', () => {
      expect(FILTER_SHEET_DEFAULT_TITLE).toBe('تصفية النتائج');
      expect(getFilterSheetApplyState(0)).toEqual({
        label: 'عرض 0 نتيجة',
        disabled: true,
      });
      expect(getFilterSheetApplyState(1500)).toEqual({
        label: 'عرض 1,500 نتيجة',
        disabled: false,
      });
      expect(getFilterSheetApplyState(undefined)).toEqual({
        label: 'تطبيق الفلتر',
        disabled: false,
      });
    });

    it('disables the apply button when resultsCount === 0 and blocks onApply', async () => {
      const onApply = jest.fn();
      await render(
        <FilterBottomSheetLayout
          visible
          onClose={jest.fn()}
          title={FILTER_SHEET_DEFAULT_TITLE}
          hasActiveFilters={false}
          onClear={jest.fn()}
          onApply={onApply}
          resultsCount={0}
        >
          <React.Fragment />
        </FilterBottomSheetLayout>
      );

      const applyBtn = screen.getByTestId('filter-sheet-apply-btn');
      expect(applyBtn.props.accessibilityState).toEqual({ disabled: true });
      await act(async () => {
        fireEvent.press(applyBtn);
      });
      expect(onApply).not.toHaveBeenCalled();

      const titleNode = screen.getByTestId('filter-sheet-title');
      const flatTitleStyle = StyleSheet.flatten(titleNode.props.style);
      expect(flatTitleStyle.textAlign).toBe('center');
      expect(flatTitleStyle.flex).toBe(1);
    });

    it('enables the apply button when resultsCount > 0 and calls onApply', async () => {
      const onApply = jest.fn();
      await render(
        <FilterBottomSheetLayout
          visible
          onClose={jest.fn()}
          title={FILTER_SHEET_DEFAULT_TITLE}
          hasActiveFilters={false}
          onClear={jest.fn()}
          onApply={onApply}
          resultsCount={12}
        >
          <React.Fragment />
        </FilterBottomSheetLayout>
      );

      const applyBtn = screen.getByTestId('filter-sheet-apply-btn');
      expect(applyBtn.props.accessibilityState).toEqual({ disabled: false });
      await act(async () => {
        fireEvent.press(applyBtn);
      });
      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it('uses symmetric headerSide widths in FilterBottomSheetLayout and unifies all 6 sheets', () => {
      const layoutSrc = readRepoFile('src/components/ui/FilterBottomSheetLayout.tsx');
      expect(layoutSrc).toContain('headerSide');
      expect(layoutSrc).toMatch(/headerSide:\s*\{[\s\S]*?width:\s*80/);

      const sheetFiles = [
        'src/components/filters/FilterBottomSheet.tsx',
        'src/components/filters/BusFilterBottomSheet.tsx',
        'src/components/filters/EquipmentFilterBottomSheet.tsx',
        'src/components/filters/OperatorsFilterBottomSheet.tsx',
        'src/components/parts/PartsFilterBottomSheet.tsx',
        'src/components/services/ServicesFilterBottomSheet.tsx',
      ];
      for (const file of sheetFiles) {
        const src = readRepoFile(file);
        expect(src).toContain('FILTER_SHEET_DEFAULT_TITLE');
        expect(src).toMatch(/resultsCount=\{.*resultsCount\}/);
      }
    });
  });

  describe('Item 4 & 5c: Western thousands separators on sliders and range price chips', () => {
    it('formats numbers with Western commas and preserves re-export compatibility', () => {
      expect(reExportedFormatNumberWestern).toBe(formatNumberWestern);
      expect(formatNumberWestern(17000)).toBe('17,000');
      expect(formatNumberWestern(390000)).toBe('390,000');
      expect(formatNumberWestern(0)).toBe('0');
    });

    it('formats RangeSlider values when unfocused and switches to raw digits while typing', async () => {
      await render(
        <RangeSlider
          min={0}
          max={500000}
          step={1000}
          initialLow={17000}
          initialHigh={390000}
          onValuesChangeFinish={jest.fn()}
          suffix="ر.ع"
          formatValue={formatNumberWestern}
        />
      );

      const lowInput = screen.getByDisplayValue('17,000');
      expect(lowInput).toBeTruthy();
      expect(screen.getByDisplayValue('390,000')).toBeTruthy();

      await act(async () => {
        fireEvent(lowInput, 'focus');
      });
      const focusedLow = screen.getByDisplayValue('17000');
      expect(focusedLow).toBeTruthy();

      await act(async () => {
        fireEvent(focusedLow, 'blur');
      });
      expect(screen.getByDisplayValue('17,000')).toBeTruthy();
    });

    it('keeps year RangeSlider values unformatted without commas', async () => {
      await render(
        <RangeSlider
          min={1990}
          max={2026}
          step={1}
          initialLow={2010}
          initialHigh={2025}
          onValuesChangeFinish={jest.fn()}
        />
      );

      expect(screen.getByDisplayValue('2010')).toBeTruthy();
      expect(screen.getByDisplayValue('2025')).toBeTruthy();
    });

    it('formats price/rate quick-filter chip ranges cleanly', () => {
      expect(formatPriceRangeChipLabel(1000, 5000, 'السعر', 'ر.ع')).toBe('1,000 - 5,000 ر.ع');
      expect(formatPriceRangeChipLabel(1000, undefined, 'السعر', 'ر.ع')).toBe('من 1,000 ر.ع');
      expect(formatPriceRangeChipLabel(undefined, 5000, 'السعر', 'ر.ع')).toBe('حتى 5,000 ر.ع');
      expect(formatPriceRangeChipLabel(undefined, undefined, 'السعر', 'ر.ع')).toBe('السعر');
    });

    it('wires formatPriceRangeChipLabel into all price/rate browse quick-filter chips', () => {
      for (const file of [
        'app/cars/browse.tsx',
        'app/equipment/browse.tsx',
        'app/parts/browse.tsx',
        'app/equipment/operators/browse.tsx',
      ]) {
        expect(readRepoFile(file)).toContain('formatPriceRangeChipLabel');
      }
    });
  });

  describe('Item 5a: Selected segmented tab active state uses primary blue + white text', () => {
    it('keeps ListingTabs and VisualFiltersBase active tab styling at Colors.primary + Colors.white', () => {
      expect(FilterGlassTokens.tab.activeBg).toBe(Colors.primary);
      expect(FilterGlassTokens.tab.activeTextColor).toBe(Colors.white);

      const listingTabsSrc = readRepoFile('src/components/ui/ListingTabs.tsx');
      expect(listingTabsSrc).toContain('FilterGlassTokens.tab.activeBg');
      expect(listingTabsSrc).toContain('FilterGlassTokens.tab.activeTextColor');

      const visualFiltersSrc = readRepoFile('src/components/ui/VisualFiltersBase.tsx');
      expect(visualFiltersSrc).toContain('FilterGlassTokens.tab.activeBg');
      expect(visualFiltersSrc).toContain('FilterGlassTokens.tab.activeTextColor');
    });
  });

  describe('Item 6: Services review row spacing and shared WIZARD_REVIEW_ROW_STYLES', () => {
    it('defines non-zero gap, flex-start alignment, non-shrinking label, and shrinking value', () => {
      expect(WIZARD_REVIEW_ROW_STYLES.row.gap).toBe(Spacing.space3);
      expect(WIZARD_REVIEW_ROW_STYLES.row.gap).toBeGreaterThanOrEqual(12);
      expect(WIZARD_REVIEW_ROW_STYLES.row.alignItems).toBe('flex-start');
      expect(WIZARD_REVIEW_ROW_STYLES.label.flexShrink).toBe(0);
      expect(WIZARD_REVIEW_ROW_STYLES.value.flexShrink).toBe(1);
    });

    it('applies WIZARD_REVIEW_ROW_STYLES in ServiceStep6Review rendered rows and all 5 review steps', async () => {
      await render(
        <ServiceStep6Review
          formData={{
            ...defaultServiceFormData,
            serviceType: 'MAINTENANCE',
            providerType: 'WORKSHOP',
            providerName: 'ورشة الخليج لصيانة السيارات',
            title: 'صيانة شاملة لجميع أنواع السيارات اليابانية والكورية والأوروبية',
            specializations: ['ميكانيكا', 'كهرباء', 'تكييف', 'سمكرة ودهان', 'فحص كمبيوتر', 'أخرى'],
            description: 'وصف تفصيلي للخدمة',
            isHomeService: false,
            workingDays: ['السبت', 'الأحد', 'الاثنين'],
            workingHoursOpen: '08:00',
            workingHoursClose: '20:00',
            governorateId: 1,
            wilayaId: 101,
            governorateNameAr: 'مسقط',
            wilayaNameAr: 'السيب',
          }}
          onEditStep={jest.fn()}
        />
      );

      const labelNode = screen.getByText('التخصصات');
      const valueNode = screen.getByText(/ميكانيكا، كهرباء/);
      const rowNode = labelNode.parent;

      expect(StyleSheet.flatten(rowNode?.props.style).gap).toBe(Spacing.space3);
      expect(StyleSheet.flatten(labelNode.props.style).flexShrink).toBe(0);
      expect(StyleSheet.flatten(valueNode.props.style).flexShrink).toBe(1);

      for (const file of [
        'src/components/services/wizard/ServiceStep6Review.tsx',
        'src/components/cars/wizard/CarStep5Review.tsx',
        'src/components/buses/wizard/BusStep6Review.tsx',
        'src/components/equipment/wizard/EquipmentStep5Review.tsx',
        'src/components/parts/wizard/PartStep6Review.tsx',
      ]) {
        expect(readRepoFile(file)).toContain('WIZARD_REVIEW_ROW_STYLES');
      }
    });
  });
});
