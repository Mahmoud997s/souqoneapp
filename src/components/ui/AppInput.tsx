import { forwardRef, useState } from 'react'
import { Spacing } from '../../constants/spacing'
import { Shadows } from '../../constants/shadows'
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

interface AppInputProps extends TextInputProps {
  label?: string
  iconRight?: string
  iconLeft?: string
  onIconLeftPress?: () => void
  error?: string
  ltr?: boolean
}

export const AppInput = forwardRef<TextInput, AppInputProps>(
  ({ label, iconRight, iconLeft, onIconLeftPress, error, style, ltr, ...rest }, ref) => {
    const [focused, setFocused] = useState(false)

    return (
      <View style={s.container}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <View style={[
          s.inputWrap, 
          rest.multiline && { height: 'auto', minHeight: 80, paddingVertical: 12 },
          focused && s.inputFocused, 
          error ? s.inputError : null,
          rest.editable === false && { opacity: 0.6, backgroundColor: '#e2e4e8' }
        ]}>
          {/* Leading icon – physical RIGHT (left: Spacing.space4 due to forceRTL) */}
          {iconRight ? (
            <View style={s.iconRight}>
              <Ionicons name={iconRight as any} size={20} color={Colors.textMuted} />
            </View>
          ) : null}

          <TextInput
            ref={ref}
            style={[
              s.input,
              rest.multiline && { height: 'auto', textAlignVertical: 'top' },
              iconRight ? s.inputWithIconRight : null,
              iconLeft ? s.inputWithIconLeft : null,
              ltr ? { textAlign: 'left', writingDirection: 'ltr' } : null,
              style,
            ]}
            placeholderTextColor={Colors.placeholder}
            textAlign={ltr ? "left" : "right"}
            onFocus={(e) => { setFocused(true); rest.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); rest.onBlur?.(e) }}
            {...rest}
          />

          {/* Trailing icon – physical LEFT (right: Spacing.space4 due to forceRTL) */}
          {iconLeft ? (
            onIconLeftPress ? (
              <TouchableOpacity
                style={s.iconLeft}
                onPress={onIconLeftPress}
                activeOpacity={0.7}
              >
                <Ionicons name={iconLeft as any} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <View style={s.iconLeft}>
                <Ionicons name={iconLeft as any} size={20} color={Colors.textMuted} />
              </View>
            )
          ) : null}
        </View>
        {error ? <Text style={s.errorTxt}>{error}</Text> : null}
      </View>
    )
  }
)

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
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconRight: {
    position: 'absolute',
    start: Spacing.space4,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    position: 'absolute',
    end: Spacing.space4,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 52,
    paddingVertical: 0,
    paddingStart: Spacing.space4,
    paddingEnd: Spacing.space4,
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  inputWithIconRight: {
    paddingStart: 52,
  },
  inputWithIconLeft: {
    paddingEnd: 52,
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.error,
    writingDirection: 'rtl',
  },
})
