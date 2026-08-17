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
  StyleProp,
  ViewStyle,
  Platform,
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
  size?: 'default' | 'sm'
  containerStyle?: StyleProp<ViewStyle>
  inputWrapStyle?: StyleProp<ViewStyle>
}

export const AppInput = forwardRef<TextInput, AppInputProps>(
  ({ label, iconRight, iconLeft, onIconLeftPress, error, style, ltr, size = 'default', containerStyle, inputWrapStyle, ...rest }, ref) => {
    const [focused, setFocused] = useState(false)
    const isSm = size === 'sm'
    const inputHeight = isSm ? 42 : 48

    return (
      <View style={[s.container, containerStyle]}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <View style={[
          s.inputWrap, 
          { minHeight: inputHeight, height: rest.multiline ? 'auto' : inputHeight },
          rest.multiline && { minHeight: 92, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
          focused && s.inputFocused, 
          error ? s.inputError : null,
          rest.editable === false && { opacity: 0.6, backgroundColor: '#e2e4e8' },
          inputWrapStyle,
        ]}>
          {/* Leading icon – physical RIGHT */}
          {iconRight ? (
            <View style={[s.iconRight, { height: inputHeight, width: isSm ? 32 : 38 }]}>
              <Ionicons name={iconRight as any} size={isSm ? 17 : 19} color={Colors.textMuted} />
            </View>
          ) : null}

          <TextInput
            ref={ref}
            style={[
              s.input,
              { 
                fontSize: isSm ? 13 : 14,
                lineHeight: isSm ? 18 : 21,
                minHeight: rest.multiline ? 76 : (inputHeight - 4),
                paddingVertical: rest.multiline 
                  ? (Platform.OS === 'ios' ? 8 : 6)
                  : (Platform.OS === 'ios' ? 10 : 6),
                paddingHorizontal: 14,
                textAlignVertical: rest.multiline ? 'top' : 'center',
              },
              iconRight ? { paddingStart: isSm ? 40 : 46 } : null,
              iconLeft ? { paddingEnd: isSm ? 40 : 46 } : null,
              ltr ? { textAlign: 'left', writingDirection: 'ltr' } : null,
              style,
            ]}
            placeholderTextColor={Colors.placeholder}
            textAlign={ltr ? "left" : "right"}
            onFocus={(e) => { setFocused(true); rest.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); rest.onBlur?.(e) }}
            {...rest}
          />

          {/* Trailing icon – physical LEFT */}
          {iconLeft ? (
            onIconLeftPress ? (
              <TouchableOpacity
                style={[s.iconLeft, { height: inputHeight, width: isSm ? 32 : 38 }]}
                onPress={onIconLeftPress}
                activeOpacity={0.7}
              >
                <Ionicons name={iconLeft as any} size={isSm ? 17 : 19} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <View style={[s.iconLeft, { height: inputHeight, width: isSm ? 32 : 38 }]}>
                <Ionicons name={iconLeft as any} size={isSm ? 17 : 19} color={Colors.textMuted} />
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
  container: { gap: 5, width: '100%' },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
    alignSelf: 'stretch',
    writingDirection: 'rtl',
    marginBottom: 1,
  },
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconRight: {
    position: 'absolute',
    start: Spacing.space3,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    position: 'absolute',
    end: Spacing.space3,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    writingDirection: 'rtl',
    marginTop: 2,
  },
})

