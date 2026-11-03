import { type MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

export interface HomeListingCategory {
  id: 'cars' | 'buses' | 'equipment' | 'services' | 'parts'
  title: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}

export const HOME_LISTING_CATEGORIES: readonly HomeListingCategory[] = [
  { id: 'cars', title: 'سيارات', icon: 'car-sports' },
  { id: 'buses', title: 'حافلات', icon: 'bus-side' },
  { id: 'equipment', title: 'معدات', icon: 'excavator' },
  { id: 'services', title: 'خدمات', icon: 'car-wrench' },
  { id: 'parts', title: 'قطع غيار', icon: 'car-cog' },
]

export const HOME_BOTTOM_TOKENS = {
  cardRadius: Radius.lg,
  glassWashColor: Colors.paleMint,
  glassWashOpacity: 0.18,
  categoryIconSize: 21,
  categoryLabelLines: 2,
  titleLines: 2,
  bannerTitleFontSize: 15,
  bannerTitleLineHeight: 22,
  bannerSubtitleFontSize: 11,
  bannerSubtitleLineHeight: 16,
  categoryLabelFontSize: 9,
  categoryLabelLineHeight: 13,
  buttonFontSize: 13,
  buttonLineHeight: 19,
} as const
