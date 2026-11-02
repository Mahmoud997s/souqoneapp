import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TopBarTokens } from '../../constants/topBarTokens'
import { StaleDataBanner, type StaleDataBannerProps } from './StaleDataBanner'

export interface DetailStaleBannerProps extends StaleDataBannerProps {
  visible?: boolean
  top?: number
  testID?: string
}

/**
 * DetailStaleBanner
 *
 * Fixed overlay banner positioned directly below the overlaid DetailTopBar
 * (top = insets.top + TopBarTokens.detailTopBarBodyHeight, left/right: 0, zIndex: 49).
 * Overlays scrolling content like a toast bar without shifting layout or scroll padding.
 * Only renders when visible is true (default: true).
 */
export function DetailStaleBanner({
  visible = true,
  top,
  onRetry,
  isRefetching,
  message,
  testID = 'detail-stale-banner-wrapper',
}: DetailStaleBannerProps) {
  const insets = useSafeAreaInsets()

  if (!visible) {
    return null
  }

  const computedTop =
    top !== undefined ? top : insets.top + TopBarTokens.detailTopBarBodyHeight

  return (
    <View
      style={[s.container, { top: computedTop }]}
      testID={testID}
      pointerEvents="box-none"
    >
      <StaleDataBanner
        onRetry={onRetry}
        isRefetching={isRefetching}
        message={message}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 49, // Directly below DetailTopBar (zIndex: 50)
    elevation: 4,
  },
})
