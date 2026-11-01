import React from 'react'
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, { type useAnimatedStyle } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { CardSystem } from '../../constants/cardSystem'
import { useGlassSupport, type GlassSupport } from './glassCapability'

export type AnimatedRadiusStyle = ReturnType<typeof useAnimatedStyle<ViewStyle>>

export interface GlassSurfaceProps {
  testID?: string
  radiusStyle?: AnimatedRadiusStyle | StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  borderRadius?: number
  glassEffectStyle?: 'regular' | 'clear'
  intensity?: number
  tint?: 'light' | 'default' | 'dark'
  noBorder?: boolean
  variant?: 'surface' | 'capsule'
  tintOverlayColor?: string
  washColor?: string
  washOpacity?: number
  support?: GlassSupport
}

interface GlassSurfaceViewProps extends Omit<GlassSurfaceProps, 'support'> {
  support: GlassSupport
}

function GlassSurfaceView({
  testID = 'glass-surface',
  radiusStyle,
  style,
  borderRadius,
  glassEffectStyle,
  intensity = BottomBarTokens.blurIntensity,
  tint = BottomBarTokens.blurTint,
  noBorder = false,
  variant = 'surface',
  tintOverlayColor,
  washColor,
  washOpacity,
  support: glass,
}: GlassSurfaceViewProps) {
  const isCapsule = variant === 'capsule'
  const effectiveGlassStyle = glassEffectStyle ?? 'regular'
  const effectiveCapsuleOverlay =
    tintOverlayColor ?? (isCapsule ? CardSystem.glass.capsuleTint : undefined)
  const borderStyle = noBorder ? s.noBorder : null
  const radiusOverride = borderRadius !== undefined ? { borderRadius } : null

  if (glass.kind === 'liquid') {
    const { GlassView } = glass
    return (
      <Animated.View
        testID={`${testID}-glass-liquid`}
        pointerEvents="none"
        style={[
          isCapsule ? s.capsuleLiquidWrapper : s.liquidWrapper,
          borderStyle,
          radiusOverride,
          radiusStyle,
          style,
        ]}
      >
        <GlassView
          glassEffectStyle={effectiveGlassStyle}
          style={StyleSheet.absoluteFill}
        />
        {effectiveCapsuleOverlay ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: effectiveCapsuleOverlay },
            ]}
          />
        ) : null}
      </Animated.View>
    )
  }

  if (isCapsule) {
    return (
      <Animated.View
        testID={`${testID}-glass-blur`}
        pointerEvents="none"
        style={[
          s.capsuleBlurWrapper,
          borderStyle,
          radiusOverride,
          radiusStyle,
          style,
        ]}
      >
        <View
          style={[
            s.capsuleWashOverlay,
            tintOverlayColor ? { backgroundColor: tintOverlayColor } : null,
          ]}
        />
      </Animated.View>
    )
  }

  const effectiveWashColor = washColor ?? BottomBarTokens.whiteWashBg
  const effectiveWashOpacity = washOpacity
  const washStyle: ViewStyle = {
    backgroundColor: effectiveWashColor,
    ...(effectiveWashOpacity !== undefined ? { opacity: effectiveWashOpacity } : null),
  }

  return (
    <Animated.View
      testID={`${testID}-glass-blur`}
      pointerEvents="none"
      style={[s.blurWrapper, borderStyle, radiusOverride, radiusStyle, style]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        blurMethod={BottomBarTokens.blurMethod}
        style={StyleSheet.absoluteFill}
      />
      <View
        testID={`${testID}-wash-overlay`}
        style={[
          s.whiteWashOverlay,
          washStyle,
          tintOverlayColor ? { backgroundColor: tintOverlayColor } : null,
        ]}
      />
    </Animated.View>
  )
}

function GlassSurfaceWithHook(props: Omit<GlassSurfaceProps, 'support'>) {
  const support = useGlassSupport()
  return <GlassSurfaceView {...props} support={support} />
}

/**
 * GlassSurface
 * The shared glass background surface for bottom bars, category tiles, and listing cards/capsules.
 * - When `support` is passed, renders `GlassSurfaceView` directly WITHOUT calling `useGlassSupport()`.
 * - Liquid branch (iOS 26 binary with expo-glass-effect, transparency not reduced): native GlassView.
 * - Blur branch (Android, older iOS, or reduce-transparency on): BlurView + white wash overlay (for 'surface'),
 *   or lightweight frosted translucent wash (for 'capsule' inside an already-blurred card).
 */
export function GlassSurface({ support, ...rest }: GlassSurfaceProps) {
  if (support) {
    return <GlassSurfaceView {...rest} support={support} />
  }
  return <GlassSurfaceWithHook {...rest} />
}

const s = StyleSheet.create({
  blurWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: BottomBarTokens.borderWidth,
    borderColor: BottomBarTokens.borderColor,
  },
  liquidWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: BottomBarTokens.borderWidth,
    borderColor: BottomBarTokens.borderColor,
  },
  capsuleLiquidWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CardSystem.glass.capsuleBorderColor,
  },
  capsuleBlurWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CardSystem.glass.capsuleBorderColor,
  },
  whiteWashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BottomBarTokens.whiteWashBg,
  },
  capsuleWashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CardSystem.glass.capsuleBlurWashBg,
  },
  noBorder: {
    borderWidth: 0,
  },
})
