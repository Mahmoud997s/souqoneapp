import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

export interface GlassInputShellProps {
  children: React.ReactNode
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  style?: StyleProp<ViewStyle>
  testID?: string
  glassTestID?: string
}

/**
 * Shared glass-skinned shell for raw TextInput rows (D-374).
 * Places an absolutely filled `TopBarGlassSurface` (`ice-control`) behind transparent
 * input/button children while allowing configurable border width/color and radius.
 */
export function GlassInputShell({
  children,
  borderRadius = Radius.md,
  borderWidth = 1,
  borderColor = TopBarTokens.buttonBorderColor,
  style,
  testID,
  glassTestID,
}: GlassInputShellProps) {
  return (
    <View
      testID={testID}
      style={[
        s.shell,
        { borderRadius, borderWidth, borderColor },
        style,
      ]}
    >
      <TopBarGlassSurface
        testID={glassTestID ?? (testID ? `${testID}-glass` : 'glass-input-shell-surface')}
        kind="ice-control"
        borderRadius={borderRadius}
      />
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    backgroundColor: Colors.transparent,
  },
})
