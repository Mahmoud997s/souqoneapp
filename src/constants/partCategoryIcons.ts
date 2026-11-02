import type { ImageSourcePropType } from 'react-native'

export type PartCategoryIconId =
  | 'ENGINE'
  | 'BODY'
  | 'ELECTRICAL'
  | 'SUSPENSION'
  | 'BRAKES'
  | 'INTERIOR'
  | 'TIRES'
  | 'BATTERIES'
  | 'OILS'
  | 'ACCESSORIES'
  | 'all'

export const PART_CATEGORY_ICONS: Record<PartCategoryIconId, ImageSourcePropType> = {
  ENGINE: require('../../assets/images/categories/parts/part-engine.png'),
  BODY: require('../../assets/images/categories/parts/part-body.png'),
  ELECTRICAL: require('../../assets/images/categories/parts/part-electrical.png'),
  SUSPENSION: require('../../assets/images/categories/parts/part-suspension.png'),
  BRAKES: require('../../assets/images/categories/cat-parts.png'),
  INTERIOR: require('../../assets/images/categories/parts/part-interior.png'),
  TIRES: require('../../assets/images/categories/parts/part-tires.png'),
  BATTERIES: require('../../assets/images/categories/parts/part-batteries.png'),
  OILS: require('../../assets/images/categories/parts/part-oils.png'),
  ACCESSORIES: require('../../assets/images/categories/parts/part-accessories.png'),
  all: require('../../assets/images/categories/cat-browse.png'),
} as const
