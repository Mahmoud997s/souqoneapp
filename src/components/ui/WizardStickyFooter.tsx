import React from 'react'
import { StyleSheet, View, Platform, type StyleProp, type ViewStyle } from 'react-native'
import { GlassSurface } from '../navigation/glassSupport'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

const WIZARD_FOOTER_PADDING_TOP = 10
/** Matches `AppButton` `size="sm"` height (`src/components/ui/AppButton.tsx:47`). */
const WIZARD_FOOTER_BUTTON_HEIGHT = 38
/** Content height above `paddingBottom` for `WizardStickyFooter`. */
export const WIZARD_STICKY_FOOTER_CONTENT_HEIGHT =
  WIZARD_FOOTER_PADDING_TOP + WIZARD_FOOTER_BUTTON_HEIGHT

export interface WizardStickyFooterProps {
  paddingBottom: number
  children: React.ReactNode
  testID?: string
  style?: StyleProp<ViewStyle>
}

export function WizardStickyFooter({
  paddingBottom,
  children,
  testID = 'wizard-sticky-footer',
  style,
}: WizardStickyFooterProps) {
  return (
    <View
      testID={testID}
      style={[
        s.footer,
        { paddingBottom },
        style,
      ]}
    >
      <GlassSurface
        testID={`${testID}-surface`}
        variant="surface"
        noBorder
        intensity={60}
        washColor={Colors.white}
        washOpacity={BottomBarTokens.lightWashOpacity}
      />
      <View style={s.footerTint} pointerEvents="none" />
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: BottomBarTokens.borderColor,
    paddingHorizontal: Spacing.space4,
    paddingTop: WIZARD_FOOTER_PADDING_TOP,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
  },
  footerTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
})
