import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import RNPickerSelect from 'react-native-picker-select'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

interface AppSelectProps {
  label?: string
  value: string
  onValueChange: (val: string) => void
  items: { label: string; value: string }[]
  placeholder?: string
  iconRight?: string
  disabled?: boolean
}

export function AppSelect({ label, value, onValueChange, items, placeholder, iconRight, disabled }: AppSelectProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={s.container}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.inputWrap, focused && s.inputFocused, disabled && s.disabled]}>
        {disabled && (
          <TouchableOpacity 
            style={[StyleSheet.absoluteFill, { zIndex: 10 }]} 
            activeOpacity={0.6}
            onPress={() => Alert.alert('تنبيه', 'الرجاء تحديد المحافظة أولاً')} 
          />
        )}
        {iconRight ? (
          <View style={s.iconRight}>
            <Ionicons name={iconRight as any} size={20} color={Colors.textMuted} />
          </View>
        ) : null}

        <View style={s.pickerContainer}>
          <RNPickerSelect
            onValueChange={onValueChange}
            items={items}
            value={value}
            disabled={disabled}
            placeholder={{ label: placeholder || 'اختر...', value: '' }}
            onOpen={() => setFocused(true)}
            onClose={() => setFocused(false)}
            pickerProps={{ itemStyle: { color: Colors.text } }}
            useNativeAndroidPickerStyle={false}
            Icon={() => {
              return <Ionicons name="chevron-down" size={20} color={Colors.textMuted} style={s.chevronIcon} />
            }}
            style={{
              inputIOS: {
                ...s.input,
                ...(iconRight ? { paddingStart: 44 } : {})
              },
              inputAndroid: {
                ...s.input,
                ...(iconRight ? { paddingStart: 44 } : {})
              },
              placeholder: { color: Colors.placeholder },
            }}
          />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { gap: Spacing.space2, width: '100%' },
  label: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    alignSelf: 'stretch',
    writingDirection: 'rtl',
  },
  inputWrap: {
    height: 52,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  iconRight: {
    position: 'absolute',
    start: Spacing.space4,
    top: 0,
    bottom: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pickerContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    height: 52,
    paddingEnd: 44, // space for chevron
    paddingStart: Spacing.space4,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chevronIcon: {
    marginTop: 16,
    marginEnd: 16,
  },
})
