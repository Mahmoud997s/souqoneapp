import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { VerifiedBadge as BaseVerifiedBadge } from '../ui/VerifiedBadge'
import { STRINGS } from '../../constants/jobs'

export interface VerificationBadgeProps {
  size?: number
  showText?: boolean
  variant?: 'dark' | 'mint'
  style?: StyleProp<ViewStyle>
}

export function VerificationBadge({
  size = 14,
  showText = false,
  variant = 'dark',
  style,
}: VerificationBadgeProps) {
  return (
    <BaseVerifiedBadge
      size={size}
      showText={showText}
      text={STRINGS.VERIFIED}
      variant={variant}
      style={style}
    />
  )
}

export default VerificationBadge

