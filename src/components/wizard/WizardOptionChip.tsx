import React from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { TopBarGlassSurface } from '../ui/TopBarGlassSurface'

export interface WizardOptionChipProps {
  label: string
  selected: boolean
  onPress: () => void
  icon?: keyof typeof Ionicons.glyphMap
  disabled?: boolean
  error?: boolean
  testID?: string
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function WizardOptionChip({
  label,
  selected,
  onPress,
  icon,
  disabled = false,
  error = false,
  testID,
  accessibilityLabel,
  style,
  textStyle,
}: WizardOptionChipProps) {
  const glassTestId = testID ? `${testID}-glass` : 'wizard-option-chip-glass'

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      style={[
        s.chip,
        selected ? s.chipSelected : s.chipUnselected,
        !selected && error ? s.chipError : null,
        disabled ? s.chipDisabled : null,
        style,
      ]}
    >
      {!selected ? (
        <TopBarGlassSurface
          testID={glassTestId}
          kind="ice-control"
          borderRadius={Radius.md}
        />
      ) : null}
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? Colors.surface : Colors.primary}
        />
      ) : null}
      <Text
        style={[
          s.label,
          selected ? s.labelSelected : s.labelUnselected,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    overflow: 'hidden',
    minHeight: 40,
    paddingHorizontal: Spacing.space3 + 2,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  chipUnselected: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipError: {
    borderColor: Colors.error,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  labelUnselected: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.text,
  },
  labelSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.surface,
  },
})
