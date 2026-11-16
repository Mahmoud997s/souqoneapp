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

export const PEEK_COMPACT_BODY_HEIGHT = 115
export const PEEK_CARD_BORDER_HEIGHT = 2
export const MY_LISTINGS_OWNER_ACTIONS_HEIGHT = 92

export const getPeekCompactCardHeight = (): number =>
  CARS_PEEK_IMAGE_HEIGHT + PEEK_COMPACT_BODY_HEIGHT + PEEK_CARD_BORDER_HEIGHT

export const getMyListingsOwnerPeekHeight = (): number =>
  getPeekCompactCardHeight() + MY_LISTINGS_OWNER_ACTIONS_HEIGHT

export interface PeekSliderConfig {
  cardWidth: number
  gap: number
  paddingEnd: number
  imageHeight: number
  fullWidth: boolean
  compactBody: boolean
  paging: boolean
  showDots: boolean
  depthEffect: boolean
}

export const getPeekSliderConfig = (screenWidth: number = SW): PeekSliderConfig => ({
  cardWidth: getPeekCardWidth(screenWidth),
  gap: CARS_PEEK_GAP,
  paddingEnd: getPeekLeadingInset(),
  imageHeight: CARS_PEEK_IMAGE_HEIGHT,
  fullWidth: true,
  compactBody: true,
  paging: true,
  showDots: true,
  depthEffect: true,
})

export const MY_LISTINGS_FAB_SIZE = 56
export const MY_LISTINGS_FAB_BOTTOM_OFFSET = 20
export const MY_LISTINGS_FAB_CLEARANCE =
  MY_LISTINGS_FAB_SIZE + MY_LISTINGS_FAB_BOTTOM_OFFSET + Spacing.space6

export const getMyListingsBottomPadding = (bottomInset: number): number =>
  bottomInset + MY_LISTINGS_FAB_CLEARANCE
