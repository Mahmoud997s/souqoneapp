import React from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

export interface GlassPickerButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  error?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  glassTestID?: string
  accessibilityLabel?: string
}

/**
 * Shared glass-skinned button wrapper for wizard modal pickers (D-371).
 * Matches `WizardSelectField glass` (`TopBarGlassSurface` kind="ice-control", `Radius.md`,
 * `TopBarTokens.buttonBorderColor`) while preserving exact picker height, children,
 * error border (`Colors.error`), and disabled dimming (`opacity: 0.6`).
 */
export function GlassPickerButton({
  children,
  onPress,
  disabled = false,
  error = false,
  style,
  testID,
  glassTestID,
  accessibilityLabel,
}: GlassPickerButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        error && s.buttonError,
        disabled && s.buttonDisabled,
        pressed && !disabled && s.buttonPressed,
        style,
      ]}
    >
      <TopBarGlassSurface
        testID={glassTestID ?? (testID ? `${testID}-glass` : 'glass-picker-button-surface')}
        kind="ice-control"
        borderRadius={Radius.md}
      />
      {children}
    </Pressable>
  )
}

const s = StyleSheet.create({
  button: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: TopBarTokens.buttonBorderColor,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  buttonError: {
    borderColor: Colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.8,
  },
})
