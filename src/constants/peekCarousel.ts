import { Dimensions } from 'react-native'
import { Spacing } from './spacing'

const { width: SW } = Dimensions.get('window')

export const CARS_PEEK_WIDTH_RATIO = 0.80
export const CARS_PEEK_GAP = 6
export const CARS_PEEK_IMAGE_HEIGHT = 133

export const getPeekCardWidth = (screenWidth: number = SW): number =>
  Math.round(screenWidth * CARS_PEEK_WIDTH_RATIO)

export const getPeekSideInset = (screenWidth: number = SW): number =>
  Math.round((screenWidth - getPeekCardWidth(screenWidth)) / 2)

export const getPeekLeadingInset = (): number => Spacing.space5

export const getPeekLeftRemainder = (screenWidth: number = SW): number =>
  screenWidth - getPeekLeadingInset() - getPeekCardWidth(screenWidth) - CARS_PEEK_GAP
