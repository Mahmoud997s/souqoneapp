import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

export const RANGE_SLIDER_MARKER_SIZE = 26;
export const RANGE_SLIDER_EDGE_INSET = 4;

/**
 * Pure geometry helper ensuring both RangeSlider thumbs (width = 26pt, 13pt overhang on each end)
 * plus a 2pt shadow cushion stay strictly inside the parent container's width.
 */
export function computeRangeSliderLength(containerWidth: number): number {
  return Math.max(
    120,
    Math.floor(containerWidth - RANGE_SLIDER_MARKER_SIZE - RANGE_SLIDER_EDGE_INSET)
  );
}

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  initialLow?: number;
  initialHigh?: number;
  onValuesChangeFinish?: (values: number[]) => void;
  formatValue?: (value: number) => string;
  suffix?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  initialLow,
  initialHigh,
  onValuesChangeFinish,
  formatValue = (v) => v.toString(),
  suffix,
}: RangeSliderProps) {
  const [multiSliderValue, setMultiSliderValue] = useState([
    initialLow ?? min,
    initialHigh ?? max,
  ]);
  const [minText, setMinText] = useState((initialLow ?? min).toString());
  const [maxText, setMaxText] = useState((initialHigh ?? max).toString());
  const [isMinFocused, setIsMinFocused] = useState(false);
  const [isMaxFocused, setIsMaxFocused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(
    () => Dimensions.get('window').width - Spacing.space4 * 2
  );
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    const targetLow = initialLow ?? min;
    const targetHigh = initialHigh ?? max;

    setMultiSliderValue((current) => {
      if (current[0] === targetLow && current[1] === targetHigh) {
        return current;
      }
      return [targetLow, targetHigh];
    });

    setMinText((currentText) => {
      const currentNum = parseInt(currentText, 10);
      if (currentNum === targetLow) return currentText;
      return targetLow.toString();
    });

    setMaxText((currentText) => {
      const currentNum = parseInt(currentText, 10);
      if (currentNum === targetHigh) return currentText;
      return targetHigh.toString();
    });
  }, [initialLow, initialHigh, min, max]);

  const sliderLength = computeRangeSliderLength(containerWidth);

  const handleMinChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMinText(cleaned);
  };
  const handleMaxChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMaxText(cleaned);
  };

  const applyTextValues = () => {
    let newMin = parseInt(minText, 10);
    let newMax = parseInt(maxText, 10);
    if (isNaN(newMin)) newMin = min;
    if (isNaN(newMax)) newMax = max;
    if (newMin < min) newMin = min;
    if (newMax > max) newMax = max;
    if (newMin > newMax) newMin = newMax;

    setMultiSliderValue([newMin, newMax]);
    setMinText(newMin.toString());
    setMaxText(newMax.toString());
    onValuesChangeFinish?.([newMin, newMax]);
  };

  const handleValuesChangeStart = () => {
    isDraggingRef.current = true;
  };

  const handleValuesChangeFinish = (values: number[]) => {
    isDraggingRef.current = false;
    onValuesChangeFinish?.(values);
  };

  const multiSliderValuesChange = (values: number[]) => {
    setMultiSliderValue(values);
    setMinText(values[0].toString());
    setMaxText(values[1].toString());
  };

  const displayedMin = isMinFocused ? minText : formatValue(multiSliderValue[0]);
  const displayedMax = isMaxFocused ? maxText : formatValue(multiSliderValue[1]);

  return (
    <View
      testID="range-slider-container"
      style={s.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 0.5) {
          setContainerWidth(w);
        }
      }}
    >
      <View style={s.inputsRow}>
        <View style={s.inputContainer}>
          <Text style={s.inputLabel}>من</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={displayedMin}
            onFocus={() => setIsMinFocused(true)}
            onChangeText={handleMinChange}
            onBlur={() => {
              setIsMinFocused(false);
              applyTextValues();
            }}
            returnKeyType="done"
            textAlign="right"
            accessibilityLabel="الحد الأدنى"
          />
          {suffix && <Text style={s.suffixText}>{suffix}</Text>}
        </View>
        <Text style={s.dash}>-</Text>
        <View style={s.inputContainer}>
          <Text style={s.inputLabel}>إلى</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={displayedMax}
            onFocus={() => setIsMaxFocused(true)}
            onChangeText={handleMaxChange}
            onBlur={() => {
              setIsMaxFocused(false);
              applyTextValues();
            }}
            returnKeyType="done"
            textAlign="right"
            accessibilityLabel="الحد الأقصى"
          />
          {suffix && <Text style={s.suffixText}>{suffix}</Text>}
        </View>
      </View>
      <MultiSlider
        values={[multiSliderValue[0], multiSliderValue[1]]}
        sliderLength={sliderLength}
        onValuesChangeStart={handleValuesChangeStart}
        onValuesChange={multiSliderValuesChange}
        onValuesChangeFinish={handleValuesChangeFinish}
        min={min}
        max={max}
        step={step}
        allowOverlap={false}
        snapped
        minMarkerOverlapDistance={10}
        customMarker={() => (
          <View style={s.marker} />
        )}
        selectedStyle={{
          backgroundColor: Colors.primary,
        }}
        unselectedStyle={{
          backgroundColor: Colors.slateSubtleBg,
        }}
        trackStyle={{
          height: 6,
          borderRadius: 3,
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: Spacing.space2,
    alignItems: 'center',
    width: '100%',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.space4,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slateSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    paddingHorizontal: 12,
    height: 40,
  },
  inputLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.slateText,
    marginEnd: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.text,
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
  suffixText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.textMuted,
    marginStart: 4,
  },
  dash: {
    color: Colors.slateText,
    fontFamily: 'Almarai_700Bold',
  },
  marker: {
    width: RANGE_SLIDER_MARKER_SIZE,
    height: RANGE_SLIDER_MARKER_SIZE,
    borderRadius: RANGE_SLIDER_MARKER_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    shadowColor: Colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    marginTop: 1, // center alignment on track
  },
});
