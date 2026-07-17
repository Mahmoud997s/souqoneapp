import { ReactNode } from 'react'
import { Spacing } from '../../constants/spacing'
import { Shadows } from '../../constants/shadows'
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Gradients } from '../../constants/gradients'

type Variant = 'primary' | 'outline' | 'ghost'

interface AppButtonProps {
  title: string
  onPress?: () => void
  variant?: Variant
  size?: 'default' | 'sm'
  icon?: string
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<import('react-native').TextStyle>
  children?: ReactNode
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  icon,
  loading,
  disabled,
  style,
  textStyle,
}: AppButtonProps) {
  const height = size === 'sm' ? 46 : 54

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        disabled={loading || disabled}
        style={[s.wrap, style]}
      >
        <LinearGradient
          colors={Gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.gradient, { height }]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={[s.primaryTxt, textStyle]}>{title}</Text>
              {icon ? (
                <Ionicons name={icon as any} size={18} color={Colors.white} />
              ) : null}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={loading || disabled}
        style={[s.outlineBtn, { height }, style]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            <Text style={[s.outlineTxt, textStyle]}>{title}</Text>
            {icon ? (
              <Ionicons name={icon as any} size={18} color={Colors.text} />
            ) : null}
          </>
        )}
      </TouchableOpacity>
    )
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading || disabled}
      style={[s.ghostBtn, style]}
    >
      <Text style={[s.ghostTxt, textStyle]}>{title}</Text>
      {icon ? (
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      ) : null}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: Radius.md,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  gradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  primaryTxt: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 16,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  outlineBtn: {
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
  },
  outlineTxt: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 16,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  ghostBtn: {
    height: Spacing.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space1,
  },
  ghostTxt: {
    fontFamily: 'Almarai_700Bold', fontSize: 14,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
})
