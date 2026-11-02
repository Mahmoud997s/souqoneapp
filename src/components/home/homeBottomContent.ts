import { type ImageSourcePropType } from 'react-native'
import { CATEGORY_ICONS, type CategoryVertical } from '../../constants/categoryIcons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

export interface HomeListingCategory {
  id: Extract<CategoryVertical, 'cars' | 'buses' | 'equipment' | 'services' | 'parts'>
  title: string
  image: ImageSourcePropType
}

export const HOME_LISTING_CATEGORIES: readonly HomeListingCategory[] = [
  { id: 'cars', title: 'سيارات', image: CATEGORY_ICONS.cars },
  { id: 'buses', title: 'حافلات', image: CATEGORY_ICONS.buses },
  { id: 'equipment', title: 'معدات', image: CATEGORY_ICONS.equipment },
  { id: 'services', title: 'خدمات', image: CATEGORY_ICONS.services },
  { id: 'parts', title: 'قطع غيار', image: CATEGORY_ICONS.parts },
]

export const HOME_BOTTOM_TOKENS = {
  cardRadius: Radius.lg,
  glassWashColor: Colors.paleMint,
  glassWashOpacity: 0.18,
  categoryImageSize: 36,
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
