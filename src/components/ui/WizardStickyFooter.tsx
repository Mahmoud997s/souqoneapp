import React from 'react'
import { StyleSheet, View, Platform, type StyleProp, type ViewStyle } from 'react-native'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'

const WIZARD_FOOTER_PADDING_VERTICAL = Spacing.space2 + 2
/** Matches `AppButton` `size="sm"` height (`src/components/ui/AppButton.tsx:47`). */
const WIZARD_FOOTER_BUTTON_HEIGHT = 38
const WIZARD_FOOTER_BOTTOM_LIFT = Spacing.space3
/** Content height above `paddingBottom` for floating `WizardStickyFooter`. */
export const WIZARD_STICKY_FOOTER_CONTENT_HEIGHT =
  WIZARD_FOOTER_PADDING_VERTICAL * 2 + WIZARD_FOOTER_BUTTON_HEIGHT + WIZARD_FOOTER_BOTTOM_LIFT

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
  const bottomOffset = Math.max(paddingBottom, Spacing.space3)
  return (
    <View
      testID={testID}
      style={[
        s.footer,
        { bottom: bottomOffset },
        style,
      ]}
    >
      <TopBarGlassSurface
        testID={`${testID}-glass`}
        kind="background"
        borderRadius={Radius.lg}
      />
      {children}
    </View>
  )
}

const s = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: Spacing.space3,
    right: Spacing.space3,
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BottomBarTokens.borderColor,
    paddingHorizontal: Spacing.space3,
    paddingVertical: WIZARD_FOOTER_PADDING_VERTICAL,
    backgroundColor: Colors.transparent,
    ...Platform.select({
      ios: { shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
})
