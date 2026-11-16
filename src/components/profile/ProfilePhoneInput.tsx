import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { normalizeDigits } from '../../utils/digits'

export interface ProfilePhoneInputProps {
  value: string
  onChangeText: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  isFocused?: boolean
  hasError?: boolean
  error?: string
  trailingAccessory?: React.ReactNode
  testID?: string
  placeholder?: string
  maxLength?: number
}

/**
 * LTR Phone input component for Profile Edit.
 * - Enforces physical LTR row inside an RTL parent form.
 * - Icon and +968 prefix placed on the physical left before the number.
 * - Digits written LTR (writingDirection: 'ltr', textAlign: 'left').
 * - Normalizes Arabic-Indic digits automatically to ASCII digits (0-9).
 * - Supports optional trailingAccessory slot (for future phone verification badge in Part 8).
 */
export function ProfilePhoneInput({
  value,
  onChangeText,
  onFocus,
  onBlur,
  isFocused = false,
  hasError = false,
  error,
  trailingAccessory,
  testID = 'edit-profile-phone-input',
  placeholder = '98765432',
  maxLength = 16,
}: ProfilePhoneInputProps) {
  const handleChangeText = (rawText: string) => {
    // Convert Arabic-Indic (٠-٩) and Persian (۰-۹) digits to standard ASCII digits
    const normalized = normalizeDigits(rawText)
    onChangeText(normalized)
  }

  return (
    <View style={s.wrapper}>
      {/* Label Row (RTL block alignment) */}
      <View style={s.labelRow}>
        <Text style={s.label}>رقم الهاتف</Text>
        <View style={s.badgeRequired}>
          <Text style={s.badgeRequiredText}>مطلوب</Text>
        </View>
      </View>

      {/* Input Box: physical LTR ordering */}
      <View
        style={[
          s.inputBox,
          isFocused && s.inputBoxFocused,
          hasError && s.inputBoxError,
        ]}
      >
        {/* Left Side: Call Icon */}
        <View style={s.iconWrap}>
          <Ionicons
            name="call-outline"
            size={18}
            color={hasError ? Colors.error : isFocused ? Colors.primary : Colors.slateText}
          />
        </View>

        {/* International Code Badge (+968) */}
        <View style={s.prefixBadge}>
          <Text style={s.prefixText}>+968</Text>
        </View>

        {/* LTR Digits Input */}
        <TextInput
          testID={testID}
          style={s.textInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.slateMuted}
          keyboardType="phone-pad"
          value={value}
          onChangeText={handleChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          maxLength={maxLength}
          textAlign="left"
          textAlignVertical="center"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Optional Trailing Accessory slot (e.g. for future verification badge) */}
        {trailingAccessory ? (
          <View style={s.trailingWrap} testID="phone-input-trailing-accessory">
            {trailingAccessory}
          </View>
        ) : null}
      </View>

      {/* Inline Error Message */}
      {error ? (
        <Text style={s.errorText} testID="edit-profile-phone-error">
          {error}
        </Text>
      ) : null}

      {/* Explanatory Hint */}
      <Text style={s.fieldHint}>
        رقمك بيظهر للمشتري عند الاتصال أو الواتساب فقط
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'stretch',
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.slateDark,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgeRequired: {
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  badgeRequiredText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: Colors.error,
    writingDirection: 'rtl',
  },

  /* Physical LTR input row */
  inputBox: {
    height: 48,
    backgroundColor: Colors.slateSurface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    ...Platform.select({
      ios: { direction: 'ltr' as const },
      default: {},
    }),
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  inputBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.dangerSurface,
  },

  iconWrap: {
    marginEnd: 6,
    marginStart: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixBadge: {
    backgroundColor: Colors.slateBorder,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginEnd: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.slateBody,
    writingDirection: 'ltr',
    textAlignVertical: 'center',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },

  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    color: Colors.slateHeading,
    textAlign: 'left',
    writingDirection: 'ltr',
    textAlignVertical: 'center',
    paddingVertical: 0,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },

  trailingWrap: {
    marginStart: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Hints and Errors (Direct full-width stretch with natural RTL start alignment) */
  errorText: {
    width: '100%',
    alignSelf: 'stretch',
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  fieldHint: {
    width: '100%',
    alignSelf: 'stretch',
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 3,
    paddingHorizontal: 2,
  },
})
