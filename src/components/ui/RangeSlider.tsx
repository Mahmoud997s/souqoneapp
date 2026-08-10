import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

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
  // Subtracting extra 8px (4px from each side) to keep the markers away from the edges
  const width = Dimensions.get('window').width - (Spacing.space4 * 2) - 8;

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

  const multiSliderValuesChange = (values: number[]) => {
    setMultiSliderValue(values);
    setMinText(values[0].toString());
    setMaxText(values[1].toString());
  };

  return (
    <View style={s.container}>
      <View style={s.inputsRow}>
        <View style={s.inputContainer}>
          <Text style={s.inputLabel}>من</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={minText}
            onChangeText={handleMinChange}
            onBlur={applyTextValues}
            returnKeyType="done"
            textAlign="right"
          />
          {suffix && <Text style={s.suffixText}>{suffix}</Text>}
        </View>
        <Text style={s.dash}>-</Text>
        <View style={s.inputContainer}>
          <Text style={s.inputLabel}>إلى</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={maxText}
            onChangeText={handleMaxChange}
            onBlur={applyTextValues}
            returnKeyType="done"
            textAlign="right"
          />
          {suffix && <Text style={s.suffixText}>{suffix}</Text>}
        </View>
      </View>
      <MultiSlider
        values={[multiSliderValue[0], multiSliderValue[1]]}
        sliderLength={width}
        onValuesChange={multiSliderValuesChange}
        onValuesChangeFinish={onValuesChangeFinish}
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
          backgroundColor: '#F1F5F9',
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
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  inputLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#64748B',
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
    color: '#64748B',
    fontFamily: 'Almarai_700Bold',
  },
  marker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    marginTop: 1, // center alignment on track
  }
});
