import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg'
import { GlassSurface, type GlassSupport } from '../navigation/glassSupport'
import { TopBarTokens } from '../../constants/topBarTokens'

type TopBarGlassSurfaceProps = {
  testID: string
  kind: 'background' | 'ice-control'
  borderRadius?: number
  style?: StyleProp<ViewStyle>
  support?: GlassSupport
}

export function TopBarGlassSurface({ testID, kind, borderRadius, style, support }: TopBarGlassSurfaceProps) {
  const isIceControl = kind === 'ice-control'

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      testID={`${testID}-layers`}
    >
      {isIceControl ? (
        <View
          pointerEvents="none"
          testID={`${testID}-backing`}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: TopBarTokens.iceGlass,
              borderRadius,
            },
            style,
          ]}
        />
      ) : null}

      <GlassSurface
        testID={`${testID}-glass`}
        variant="surface"
        noBorder={!isIceControl}
        intensity={TopBarTokens.blurIntensity}
        borderRadius={borderRadius}
        washColor={isIceControl ? TopBarTokens.iceGlass : undefined}
        style={style}
        support={support}
      />

      {!isIceControl ? (
        <>
          <View
            pointerEvents="none"
            testID={`${testID}-tint`}
            style={[
              StyleSheet.absoluteFill,
              styles.tintOverlay,
            ]}
          />
          <View
            pointerEvents="none"
            testID={`${testID}-grid`}
            style={[StyleSheet.absoluteFill, styles.gridContainer]}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern
                  id={`${testID}-grid-pattern`}
                  width={TopBarTokens.gridPatternSize}
                  height={TopBarTokens.gridPatternSize}
                  patternUnits="userSpaceOnUse"
                >
                  <Path
                    d="M 30 0 L 0 0 0 30"
                    fill="none"
                    stroke={TopBarTokens.gridStrokeColor}
                    strokeWidth={TopBarTokens.gridStrokeWidth}
                    strokeOpacity={TopBarTokens.gridStrokeOpacity}
                  />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${testID}-grid-pattern)`} />
            </Svg>
          </View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  tintOverlay: {
    backgroundColor: TopBarTokens.tintOverlayColor,
    opacity: TopBarTokens.tintOverlayOpacity,
  },
  gridContainer: {
    overflow: 'hidden',
  },
})
